<?php

namespace App\Console\Commands;

use App\Models\MpesaTransaction;
use App\Services\CoinsService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class ReconcileCoinTransactions extends Command
{
    protected $signature = 'coins:reconcile-pending
        {--minutes=15 : Minutes before an unresolved payment is marked unknown}
        {--query-after=5 : Minimum minutes between STK queries}
        {--limit=100 : Maximum transactions to process per run}';

    protected $description = 'Reconcile unresolved M-PESA coin purchases using STK Query';

    private int $queried = 0;
    private int $completed = 0;
    private int $failed = 0;
    private int $pending = 0;
    private int $unknown = 0;
    private int $queryFailed = 0;
    private int $skipped = 0;

    public function handle(CoinsService $coinsService): int
    {
        $unknownAfter = max(1, (int) $this->option('minutes'));
        $queryAfter = max(1, (int) $this->option('query-after'));
        $limit = max(1, (int) $this->option('limit'));

        $this->info('Reconciling unresolved M-PESA coin purchases...');

        /*
         * Process in small batches.
         * Payment data belongs to MpesaTransaction, not CoinTransaction.
         */
        MpesaTransaction::query()
            ->where('type', MpesaTransaction::TYPE_COINS_PURCHASE)
            ->whereIn('status', [
                MpesaTransaction::STATUS_PENDING,
                MpesaTransaction::STATUS_PROCESSING,
                MpesaTransaction::STATUS_UNKNOWN,
            ])
            ->where('created_at', '<=', now()->subMinutes($queryAfter))
            ->orderBy('created_at')
            ->limit($limit)
            ->select(['id'])
            ->get()
            ->each(function (MpesaTransaction $transaction) use ($coinsService, $unknownAfter, $queryAfter): void {
                $this->processTransaction(
                    $transaction->id,
                    $coinsService,
                    $unknownAfter,
                    $queryAfter
                );
            });

        $this->displaySummary();

        return self::SUCCESS;
    }

    /**
     * Process one unresolved payment.
     */
    private function processTransaction(
        int $transactionId,
        CoinsService $coinsService,
        int $unknownAfter,
        int $queryAfter
    ): void {
        try {
            $transaction = MpesaTransaction::find($transactionId);

            if (!$transaction || $transaction->isTerminal()) {
                $this->skipped++;
                return;
            }

            /*
             * STK Query requires a CheckoutRequestID.
             */
            if (blank($transaction->checkout_request_id)) {
                if (
                    $this->markUnknownIfExpired(
                        $transactionId,
                        $unknownAfter,
                        'Missing CheckoutRequestID. Manual payment verification may be required.'
                    )
                ) {
                    $this->unknown++;
                } else {
                    $this->skipped++;
                }

                return;
            }

            /*
             * Claim the query interval before making the external request.
             * This prevents overlapping scheduler runs from querying
             * the same payment repeatedly.
             */
            if (!$this->claimQuery($transactionId, $queryAfter)) {
                $this->skipped++;
                return;
            }

            $transaction = MpesaTransaction::find($transactionId);

            if (!$transaction || $transaction->isTerminal()) {
                $this->skipped++;
                return;
            }

            $this->queried++;

            $result = $coinsService->reconcileStkQuery($transaction);

            $status = $result['status'] ?? 'query_failed';

            switch ($status) {
                case 'completed':
                    $this->completed++;
                    $this->line("Payment #{$transactionId}: completed.");
                    break;

                case 'failed':
                    $this->failed++;
                    $this->warn("Payment #{$transactionId}: failed.");
                    break;

                case 'still_pending':
                    $this->pending++;
                    break;

                case 'query_unavailable':
                case 'not_found':
                    $this->skipped++;
                    break;

                case 'query_failed':
                    $this->queryFailed++;

                    Log::warning('M-PESA coin purchase reconciliation failed.', [
                        'transaction_id' => $transactionId,
                        'message' => $result['message'] ?? null,
                    ]);
                    break;

                default:
                    $this->skipped++;

                    Log::warning('Unexpected M-PESA reconciliation response.', [
                        'transaction_id' => $transactionId,
                        'result' => $result,
                    ]);
                    break;
            }

            /*
             * Only unresolved payments become UNKNOWN.
             * UNKNOWN remains eligible for future STK queries.
             */
            if (in_array($status, ['still_pending', 'query_failed'], true)) {
                if (
                    $this->markUnknownIfExpired(
                        $transactionId,
                        $unknownAfter,
                        'No definitive M-PESA payment result received within the expected time.'
                    )
                ) {
                    $this->unknown++;
                }
            }
        } catch (Throwable $exception) {
            $this->queryFailed++;

            Log::error('Coin purchase reconciliation exception.', [
                'transaction_id' => $transactionId,
                'exception' => $exception->getMessage(),
            ]);

            $this->error(
                "Payment #{$transactionId}: reconciliation error."
            );
        }
    }

    /**
     * Atomically reserve an STK query attempt.
     *
     * No database lock is held during the external API request.
     */
    private function claimQuery(
        int $transactionId,
        int $queryAfter
    ): bool {
        return DB::transaction(function () use ($transactionId, $queryAfter): bool {
            $transaction = MpesaTransaction::query()
                ->lockForUpdate()
                ->find($transactionId);

            if (!$transaction || $transaction->isTerminal()) {
                return false;
            }

            if (
                !in_array($transaction->status, [
                    MpesaTransaction::STATUS_PENDING,
                    MpesaTransaction::STATUS_PROCESSING,
                    MpesaTransaction::STATUS_UNKNOWN,
                ], true)
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
                    // Invalid historical timestamp: allow a fresh query.
                }
            }

            $response['last_stk_query_at'] = now()->toISOString();

            $transaction->gateway_response = $response;
            $transaction->save();

            return true;
        }, 3);
    }

    /**
     * Mark an expired unresolved payment UNKNOWN.
     *
     * Never changes completed, failed, cancelled or already unknown records.
     */
    private function markUnknownIfExpired(
        int $transactionId,
        int $unknownAfter,
        string $reason
    ): bool {
        return DB::transaction(function () use ($transactionId, $unknownAfter, $reason): bool {
            $transaction = MpesaTransaction::query()
                ->lockForUpdate()
                ->find($transactionId);

            if (
                !$transaction || !in_array($transaction->status, [
                    MpesaTransaction::STATUS_PENDING,
                    MpesaTransaction::STATUS_PROCESSING,
                ], true)
            ) {
                return false;
            }

            if (
                !$transaction->created_at ||
                $transaction->created_at->gt(now()->subMinutes($unknownAfter))
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

            Log::warning('M-PESA coin purchase marked unknown.', [
                'transaction_id' => $transactionId,
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
                ['Query failures', $this->queryFailed],
                ['Skipped', $this->skipped],
            ]
        );
    }
}
