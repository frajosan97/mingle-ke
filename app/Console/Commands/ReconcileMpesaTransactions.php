<?php

namespace App\Console\Commands;

use App\Models\MpesaTransaction;
use App\Services\CoinsPurchaseService;
use App\Services\EscortPaymentService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class ReconcileMpesaTransactions extends Command
{
    protected $signature = 'mpesa:reconcile-pending
        {--minutes=15 : Minutes before an unresolved payment is marked unknown}
        {--query-after=10 : Minimum minutes between queries for the same transaction}
        {--query-interval=3 : Minimum seconds between global STK queries}
        {--limit=15 : Maximum transactions to process per run}';

    protected $description = 'Reconcile unresolved inbound M-PESA transactions';

    private int $queried = 0;
    private int $completed = 0;
    private int $failed = 0;
    private int $pending = 0;
    private int $unknown = 0;
    private int $queryFailed = 0;
    private int $rateLimited = 0;
    private int $skipped = 0;

    private const QUERY_LOCK = 'mpesa:stk-query-global-lock';
    private const NEXT_QUERY_AT = 'mpesa:stk-query-next-at';

    public function handle(
        CoinsPurchaseService $coins,
        EscortPaymentService $escorts,
    ): int {
        $unknownAfter = max(1, (int) $this->option('minutes'));
        $queryAfter = max(1, (int) $this->option('query-after'));
        $queryInterval = max(1, (int) $this->option('query-interval'));
        $limit = max(1, (int) $this->option('limit'));

        $this->info('Reconciling unresolved M-PESA transactions...');

        $transactionIds = MpesaTransaction::query()
            ->where('direction', MpesaTransaction::DIRECTION_INBOUND)
            // ->whereIn('type', $this->supportedTypes())
            ->whereIn('status', $this->unresolvedStatuses())
            ->where('created_at', '<=', now()->subMinutes($queryAfter))
            ->orderBy('updated_at')
            ->orderBy('created_at')
            ->limit($limit)
            ->pluck('id');

        foreach ($transactionIds as $transactionId) {
            $this->processTransaction(
                (int) $transactionId,
                $coins,
                $escorts,
                $unknownAfter,
                $queryAfter,
                $queryInterval,
            );
        }

        $this->displaySummary();

        return self::SUCCESS;
    }

    /**
     * Transaction types supported by STK reconciliation.
     */
    private function supportedTypes(): array
    {
        return [
            MpesaTransaction::TYPE_COINS_PURCHASE,
            MpesaTransaction::TYPE_ESCORT_LISTING_FEES,
        ];
    }

    /**
     * Transaction statuses eligible for reconciliation.
     */
    private function unresolvedStatuses(): array
    {
        return [
            MpesaTransaction::STATUS_PENDING,
            MpesaTransaction::STATUS_PROCESSING,
            MpesaTransaction::STATUS_UNKNOWN,
        ];
    }

    /**
     * Process one transaction using its appropriate payment service.
     */
    private function processTransaction(
        int $transactionId,
        CoinsPurchaseService $coins,
        EscortPaymentService $escorts,
        int $unknownAfter,
        int $queryAfter,
        int $queryInterval,
    ): void {
        try {
            $transaction = MpesaTransaction::find($transactionId);

            if (!$transaction || $transaction->isTerminal()) {
                $this->skipped++;
                return;
            }

            if (blank($transaction->checkout_request_id)) {
                if (
                    $this->markUnknownIfExpired(
                        $transactionId,
                        $unknownAfter,
                        'Missing CheckoutRequestID. Manual payment verification may be required.',
                    )
                ) {
                    $this->unknown++;
                } else {
                    $this->skipped++;
                }

                return;
            }

            // Reserve this transaction's next query attempt.
            if (!$this->claimTransactionQuery($transactionId, $queryAfter)) {
                $this->skipped++;
                return;
            }

            // Enforce a global interval across all transaction types.
            $this->waitForGlobalQuerySlot($queryInterval);

            $transaction = MpesaTransaction::find($transactionId);

            if (!$transaction || $transaction->isTerminal()) {
                $this->skipped++;
                return;
            }

            $this->queried++;

            $result = $this->reconcile(
                $transaction,
                $coins,
                $escorts,
            );

            $status = $result['status'] ?? 'query_failed';

            // Some payment services report HTTP 429 as query_failed.
            // Normalize that response before handling the result.
            if ($this->isRateLimited($result)) {
                $status = 'rate_limited';
            }

            $this->handleResult(
                $transactionId,
                $status,
                $result,
                $unknownAfter,
            );
        } catch (Throwable $exception) {
            $this->queryFailed++;

            Log::error('M-PESA transaction reconciliation exception.', [
                'transaction_id' => $transactionId,
                'exception' => $exception->getMessage(),
            ]);

            $this->error(
                "Transaction #{$transactionId}: reconciliation error."
            );
        }
    }

    /**
     * Dispatch reconciliation to the correct payment service.
     */
    private function reconcile(
        MpesaTransaction $transaction,
        CoinsPurchaseService $coins,
        EscortPaymentService $escorts,
    ): array {
        return match ($transaction->type) {
            MpesaTransaction::TYPE_COINS_PURCHASE =>
                $coins->reconcileStkQuery($transaction),

            MpesaTransaction::TYPE_ESCORT_LISTING_FEES =>
                $escorts->reconcileStkQuery($transaction),

            default => [
                'status' => 'invalid_transaction',
                'message' => 'Unsupported transaction type.',
            ],
        };
    }

    /**
     * Detect Daraja rate-limit responses.
     */
    private function isRateLimited(array $result): bool
    {
        if ((int) ($result['http_status'] ?? 0) === 429) {
            return true;
        }

        if (($result['status'] ?? null) === 'rate_limited') {
            return true;
        }

        $message = strtolower((string) ($result['message'] ?? ''));

        return str_contains($message, 'http 429')
            || str_contains($message, 'too many requests')
            || str_contains($message, 'spike arrest');
    }

    /**
     * Handle the payment reconciliation result.
     */
    private function handleResult(
        int $transactionId,
        string $status,
        array $result,
        int $unknownAfter,
    ): void {
        switch ($status) {
            case 'completed':
                $this->completed++;
                $this->line("Transaction #{$transactionId}: completed.");
                return;

            case 'failed':
                $this->failed++;
                $this->warn("Transaction #{$transactionId}: failed.");
                return;

            case 'still_pending':
            case 'confirmation_pending':
                $this->pending++;
                break;

            case 'rate_limited':
                $this->rateLimited++;

                Log::warning('M-PESA STK Query rate limited. Retry deferred.', [
                    'transaction_id' => $transactionId,
                    'message' => $result['message'] ?? null,
                ]);

                // Never mark UNKNOWN because Daraja returned HTTP 429.
                return;

            case 'query_unavailable':
            case 'not_found':
            case 'invalid_transaction':
                $this->skipped++;
                return;

            case 'query_failed':
                $this->queryFailed++;

                Log::warning('M-PESA transaction query failed.', [
                    'transaction_id' => $transactionId,
                    'message' => $result['message'] ?? null,
                ]);

                // A failed query is not definitive payment confirmation.
                return;

            default:
                $this->skipped++;

                Log::warning('Unexpected M-PESA reconciliation response.', [
                    'transaction_id' => $transactionId,
                    'result' => $result,
                ]);

                return;
        }

        /*
         * A definitive still-pending response means the payment
         * remains unresolved. It can become UNKNOWN after the timeout.
         */
        if ($status === 'still_pending' || $status === 'confirmation_pending') {
            if (
                $this->markUnknownIfExpired(
                    $transactionId,
                    $unknownAfter,
                    'M-PESA confirmed that the payment is still unresolved beyond the expected time.',
                )
            ) {
                $this->unknown++;
            }
        }
    }

    /**
     * Reserve a query attempt for an individual transaction.
     *
     * Prevents repeated queries for the same transaction.
     */
    private function claimTransactionQuery(
        int $transactionId,
        int $queryAfter,
    ): bool {
        return DB::transaction(function () use ($transactionId, $queryAfter): bool {
            $transaction = MpesaTransaction::query()
                ->lockForUpdate()
                ->find($transactionId);

            if (
                !$transaction ||
                $transaction->isTerminal() ||
                $transaction->direction !== MpesaTransaction::DIRECTION_INBOUND ||
                !in_array($transaction->status, $this->unresolvedStatuses(), true)
            ) {
                return false;
            }

            $response = $transaction->gateway_response ?? [];

            if (!is_array($response)) {
                $response = [];
            }

            $lastQuery = $response['last_stk_query_at'] ?? null;

            if ($lastQuery) {
                try {
                    if (
                        Carbon::parse($lastQuery)->gt(
                            now()->subMinutes($queryAfter)
                        )
                    ) {
                        return false;
                    }
                } catch (Throwable) {
                    // Allow a new query if the stored timestamp is invalid.
                }
            }

            $response['last_stk_query_at'] = now()->toISOString();

            $transaction->gateway_response = $response;
            $transaction->save();

            return true;
        }, 3);
    }

    /**
     * Enforce a global minimum interval between STK Query requests.
     *
     * The cache lock coordinates scheduler processes and application
     * instances sharing the same cache backend.
     */
    private function waitForGlobalQuerySlot(int $interval): void
    {
        $lock = Cache::lock(
            self::QUERY_LOCK,
            max(10, $interval + 5),
        );

        $lock->block(
            max(5, $interval + 2),
            function () use ($interval): void {
                $nextQueryAt = (float) Cache::get(
                    self::NEXT_QUERY_AT,
                    0,
                );

                $wait = $nextQueryAt - microtime(true);

                if ($wait > 0) {
                    usleep((int) ceil($wait * 1_000_000));
                }

                Cache::put(
                    self::NEXT_QUERY_AT,
                    microtime(true) + $interval,
                    now()->addMinutes(5),
                );
            },
        );
    }

    /**
     * Mark an expired unresolved transaction UNKNOWN.
     *
     * Completed, failed, cancelled and already unknown records
     * are never changed by this method.
     */
    private function markUnknownIfExpired(
        int $transactionId,
        int $unknownAfter,
        string $reason,
    ): bool {
        return DB::transaction(function () use ($transactionId, $unknownAfter, $reason): bool {
            $transaction = MpesaTransaction::query()
                ->lockForUpdate()
                ->find($transactionId);

            if (
                !$transaction ||
                !in_array($transaction->status, [
                    MpesaTransaction::STATUS_PENDING,
                    MpesaTransaction::STATUS_PROCESSING,
                ], true)
            ) {
                return false;
            }

            if (
                !$transaction->created_at ||
                $transaction->created_at->gt(
                    now()->subMinutes($unknownAfter)
                )
            ) {
                return false;
            }

            $response = $transaction->gateway_response ?? [];

            if (!is_array($response)) {
                $response = [];
            }

            $response['marked_unknown_at'] = now()->toISOString();
            $response['reconciliation_note'] = $reason;

            $transaction->status = MpesaTransaction::STATUS_UNKNOWN;
            $transaction->gateway_response = $response;
            $transaction->save();

            Log::warning('M-PESA transaction marked unknown.', [
                'transaction_id' => $transactionId,
                'type' => $transaction->type,
                'reason' => $reason,
            ]);

            return true;
        }, 3);
    }

    /**
     * Display reconciliation statistics.
     */
    private function displaySummary(): void
    {
        $this->newLine();

        $this->info('M-PESA reconciliation summary');

        $this->table(
            ['Metric', 'Count'],
            [
                ['Queried', $this->queried],
                ['Completed', $this->completed],
                ['Failed', $this->failed],
                ['Still pending', $this->pending],
                ['Marked unknown', $this->unknown],
                ['Rate limited', $this->rateLimited],
                ['Query failures', $this->queryFailed],
                ['Skipped', $this->skipped],
            ],
        );
    }
}