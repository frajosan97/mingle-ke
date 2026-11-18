<?php

namespace App\Services;

use App\Models\CoinTransaction;
use App\Models\MpesaTransaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class CoinsService
{
    public function __construct(
        protected MpesaService $mpesa,
        protected NotificationService $notifier,
        protected PointsService $pointsService
    ) {
    }

    /*
    |--------------------------------------------------------------------------
    | STK Coin Purchase
    |--------------------------------------------------------------------------
    */

    /**
     * Start an STK coin purchase.
     *
     * Coins and points are not credited here.
     * They are credited only after confirmed payment.
     */
    public function startPurchase(
        User $user,
        int $coins,
        int $amountKes,
        ?int $packageId,
        string $phone
    ): array {
        if ($coins <= 0 || $amountKes <= 0) {
            return [
                'success' => false,
                'message' => 'Invalid coin purchase amount.',
            ];
        }

        if (!$this->mpesa->isStkConfigured()) {
            return [
                'success' => false,
                'message' => 'M-PESA payments are currently unavailable.',
            ];
        }

        if (blank($phone)) {
            return [
                'success' => false,
                'message' => 'A valid phone number is required.',
            ];
        }

        /*
         * Create the transaction while locking the user.
         * Prevent simultaneous unresolved coin purchases.
         */
        $tx = DB::transaction(function () use ($user, $coins, $amountKes, $packageId, $phone) {
            $lockedUser = User::query()
                ->whereKey($user->id)
                ->lockForUpdate()
                ->firstOrFail();

            $hasUnresolvedPurchase = MpesaTransaction::query()
                ->where('user_id', $lockedUser->id)
                ->where('type', MpesaTransaction::TYPE_COINS_PURCHASE)
                ->whereIn('status', [
                    MpesaTransaction::STATUS_PENDING,
                    MpesaTransaction::STATUS_PROCESSING,
                    MpesaTransaction::STATUS_UNKNOWN,
                ])
                ->exists();

            if ($hasUnresolvedPurchase) {
                return null;
            }

            return MpesaTransaction::create([
                'user_id' => $lockedUser->id,
                'type' => MpesaTransaction::TYPE_COINS_PURCHASE,
                'direction' => MpesaTransaction::DIRECTION_INBOUND,
                'status' => MpesaTransaction::STATUS_PENDING,
                'amount' => $amountKes,
                'currency' => 'KES',
                'phone' => $phone,
                'bill_ref_number' => $this->billRefForUser($lockedUser),
                'coins' => $coins,
                'package_id' => $packageId,
                'meta' => [
                    'created_for' => 'coin_purchase',
                    'payment_method' => 'stk',
                ],
            ]);
        }, 3);

        if (!$tx) {
            return [
                'success' => false,
                'message' => 'You already have an unresolved coin purchase. Please wait for it to be confirmed before trying again.',
            ];
        }

        /*
         * Initiate STK outside the database transaction.
         */
        try {
            $result = $this->mpesa->stkPush(
                $phone,
                $amountKes,
                $tx->reference,
                'Mingle coins top-up'
            );

            if (!($result['success'] ?? false)) {
                $uncertain = (bool) ($result['uncertain'] ?? false);

                $tx->update([
                    'status' => $uncertain
                        ? MpesaTransaction::STATUS_UNKNOWN
                        : MpesaTransaction::STATUS_FAILED,

                    'failed_at' => $uncertain ? null : now(),

                    'result_desc' => $result['message']
                        ?? 'STK request failed.',

                    'gateway_response' => [
                        'stk_error' => $result['message'] ?? null,
                        'stk_uncertain' => $uncertain,
                        'stk_error_at' => now()->toISOString(),
                        'raw' => $result['raw'] ?? null,
                    ],
                ]);

                return [
                    'success' => false,
                    'uncertain' => $uncertain,
                    'transaction' => $tx->fresh(),
                    'message' => $uncertain
                        ? 'We could not confirm whether M-PESA received your request. Please wait while we verify it. Do not pay again yet.'
                        : ($result['message'] ?? 'Unable to initiate M-PESA payment.'),
                ];
            }

            $tx->update([
                'status' => MpesaTransaction::STATUS_PROCESSING,
                'checkout_request_id' => $result['checkout_request_id'] ?? null,
                'merchant_request_id' => $result['merchant_request_id'] ?? null,
                'gateway_response' => [
                    'stk_submitted_at' => now()->toISOString(),
                    'raw' => $result['raw'] ?? null,
                ],
            ]);

            return [
                'success' => true,
                'transaction' => $tx->fresh(),
                'checkout_request_id' => $result['checkout_request_id'] ?? null,
                'message' => 'M-PESA payment request sent. Complete the prompt on your phone.',
            ];
        } catch (Throwable $e) {
            Log::error('Coin STK initiation exception.', [
                'transaction_id' => $tx->id,
                'error' => $e->getMessage(),
            ]);

            /*
             * A network exception does not prove rejection.
             * Keep the transaction unresolved.
             */
            $tx->update([
                'status' => MpesaTransaction::STATUS_UNKNOWN,
                'gateway_response' => [
                    'stk_error' => 'Network error during STK initiation.',
                    'stk_uncertain' => true,
                    'stk_error_at' => now()->toISOString(),
                ],
            ]);

            return [
                'success' => false,
                'uncertain' => true,
                'transaction' => $tx->fresh(),
                'message' => 'We could not confirm whether M-PESA received your request. Please wait while we verify it.',
            ];
        }
    }

    /*
    |--------------------------------------------------------------------------
    | STK Payment Confirmation
    |--------------------------------------------------------------------------
    */

    /**
     * Confirm a successful STK payment.
     *
     * Credits:
     * 1. Purchased coins.
     * 2. Loyalty points.
     *
     * Both ledger entries and the completed payment are committed
     * together. Repeated callbacks cannot credit them twice.
     */
    public function confirmPayment(
        MpesaTransaction $tx,
        string $mpesaReceipt
    ): void {
        if (blank($mpesaReceipt)) {
            Log::warning('Attempted to confirm STK payment without receipt.', [
                'transaction_id' => $tx->id,
            ]);

            return;
        }

        $notificationData = DB::transaction(function () use ($tx, $mpesaReceipt) {
            $lockedTx = MpesaTransaction::query()
                ->lockForUpdate()
                ->find($tx->id);

            if (!$lockedTx) {
                return null;
            }

            if ($lockedTx->status === MpesaTransaction::STATUS_COMPLETED) {
                return null;
            }

            if (
                in_array($lockedTx->status, [
                    MpesaTransaction::STATUS_FAILED,
                    MpesaTransaction::STATUS_CANCELLED,
                ], true)
            ) {
                Log::warning(
                    'Successful STK confirmation received for terminal transaction.',
                    [
                        'transaction_id' => $lockedTx->id,
                        'status' => $lockedTx->status,
                    ]
                );

                return null;
            }

            if (
                $lockedTx->type !== MpesaTransaction::TYPE_COINS_PURCHASE ||
                $lockedTx->direction !== MpesaTransaction::DIRECTION_INBOUND
            ) {
                Log::warning('Invalid transaction type for coin confirmation.', [
                    'transaction_id' => $lockedTx->id,
                    'type' => $lockedTx->type,
                    'direction' => $lockedTx->direction,
                ]);

                return null;
            }

            $user = User::query()
                ->lockForUpdate()
                ->find($lockedTx->user_id);

            if (!$user) {
                Log::error('Cannot credit STK payment: user not found.', [
                    'transaction_id' => $lockedTx->id,
                    'user_id' => $lockedTx->user_id,
                ]);

                return null;
            }

            /*
             * Coin ledger: one entry per M-PESA transaction.
             */
            $coinReference = 'MPESA-COIN-' . $lockedTx->id;

            $coinLedger = CoinTransaction::query()
                ->where('reference', $coinReference)
                ->first();

            if (!$coinLedger) {
                $coinLedger = CoinTransaction::create([
                    'user_id' => $user->id,
                    'type' => CoinTransaction::TYPE_PURCHASE,
                    'coins' => (int) $lockedTx->coins,
                    'mpesa_transaction_id' => $lockedTx->id,
                    'package_id' => $lockedTx->package_id,
                    'reference' => $coinReference,
                    'description' => 'M-PESA coin purchase',
                    'meta' => [
                        'payment_reference' => $lockedTx->reference,
                        'mpesa_receipt' => $mpesaReceipt,
                    ],
                ]);

                $user->increment('coins', (int) $lockedTx->coins);
            }

            /*
             * Mark the M-PESA transaction completed before
             * awarding points. Both operations remain in this
             * database transaction.
             */
            $lockedTx->update([
                'status' => MpesaTransaction::STATUS_COMPLETED,
                'mpesa_receipt' => $mpesaReceipt,
                'completed_at' => now(),
                'failed_at' => null,
                'gateway_response' => array_merge(
                    $lockedTx->gateway_response ?? [],
                    [
                        'confirmed_at' => now()->toISOString(),
                        'confirmed_by' => 'mpesa_stk',
                    ]
                ),
            ]);

            /*
             * Points: 1 per KES 10, capped at 100.
             * The PointsService also checks for an existing
             * unique payment reference.
             */
            $this->pointsService->awardPaymentPoints(
                $user,
                $lockedTx
            );

            return [
                'phone' => $lockedTx->phone,
                'ledger_transaction_id' => $coinLedger->id,
            ];
        }, 3);

        if ($notificationData) {
            $this->sendPurchaseNotification($notificationData);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Payment Failure
    |--------------------------------------------------------------------------
    */

    /**
     * Mark a payment failed only when failure is definitive.
     *
     * Never overwrite a completed transaction.
     * Failed payments never receive coins or points.
     */
    public function failPayment(
        MpesaTransaction $tx,
        string $reason
    ): void {
        DB::transaction(function () use ($tx, $reason) {
            $lockedTx = MpesaTransaction::query()
                ->lockForUpdate()
                ->find($tx->id);

            if (!$lockedTx || $lockedTx->isTerminal()) {
                return;
            }

            $lockedTx->update([
                'status' => MpesaTransaction::STATUS_FAILED,
                'failed_at' => now(),
                'result_desc' => $reason,
                'gateway_response' => array_merge(
                    $lockedTx->gateway_response ?? [],
                    [
                        'failure_reason' => $reason,
                        'failed_at' => now()->toISOString(),
                    ]
                ),
            ]);
        }, 3);
    }

    /*
    |--------------------------------------------------------------------------
    | Transaction Lookup
    |--------------------------------------------------------------------------
    */

    public function findByCheckoutRequestId(
        string $checkoutRequestId
    ): ?MpesaTransaction {
        return MpesaTransaction::query()
            ->where('checkout_request_id', $checkoutRequestId)
            ->where('type', MpesaTransaction::TYPE_COINS_PURCHASE)
            ->first();
    }

    /**
     * Find an unresolved coin purchase by bill reference.
     */
    public function findByBillRef(
        string $billRef
    ): ?MpesaTransaction {
        return MpesaTransaction::query()
            ->where('bill_ref_number', $billRef)
            ->where('type', MpesaTransaction::TYPE_COINS_PURCHASE)
            ->whereIn('status', [
                MpesaTransaction::STATUS_PENDING,
                MpesaTransaction::STATUS_PROCESSING,
                MpesaTransaction::STATUS_UNKNOWN,
            ])
            ->latest('id')
            ->first();
    }

    /*
    |--------------------------------------------------------------------------
    | STK Reconciliation
    |--------------------------------------------------------------------------
    */

    /**
     * Reconcile a transaction against the M-PESA STK Query API.
     */
    public function reconcileStkQuery(
        MpesaTransaction $tx
    ): array {
        $fresh = $tx->fresh();

        if (!$fresh) {
            return [
                'status' => 'not_found',
                'message' => 'Transaction not found.',
            ];
        }

        if (!$fresh->checkout_request_id) {
            return [
                'status' => 'query_unavailable',
                'message' => 'No checkout request ID is available.',
            ];
        }

        if ($fresh->status === MpesaTransaction::STATUS_COMPLETED) {
            return ['status' => 'completed'];
        }

        if ($fresh->isTerminal()) {
            return ['status' => $fresh->status];
        }

        try {
            $result = $this->mpesa->stkQuery(
                $fresh->checkout_request_id
            );

            if (!($result['success'] ?? false)) {
                return [
                    'status' => 'query_failed',
                    'message' => $result['message'] ?? 'M-PESA query failed.',
                ];
            }

            $resultCode = $result['result_code'] ?? null;

            if ($resultCode === null || $resultCode === '') {
                return [
                    'status' => 'still_pending',
                    'message' => $result['result_desc']
                        ?? 'Payment is still being processed.',
                ];
            }

            if ((int) $resultCode === 0) {
                $receipt = $result['receipt'] ?? null;

                if (blank($receipt)) {
                    return [
                        'status' => 'still_pending',
                        'message' => 'Payment success reported without a receipt number. Waiting for confirmation.',
                    ];
                }

                $this->confirmPayment(
                    $fresh,
                    (string) $receipt
                );

                return ['status' => 'completed'];
            }

            $this->failPayment(
                $fresh,
                $result['result_desc'] ?? 'M-PESA payment failed.'
            );

            return [
                'status' => 'failed',
                'message' => $result['result_desc'] ?? 'M-PESA payment failed.',
            ];
        } catch (Throwable $e) {
            Log::error('STK reconciliation failed.', [
                'transaction_id' => $fresh->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'status' => 'query_failed',
                'message' => 'Unable to query M-PESA at this time.',
            ];
        }
    }

    /*
    |--------------------------------------------------------------------------
    | C2B Payments
    |--------------------------------------------------------------------------
    */

    /**
     * Generate the C2B bill reference for a user.
     */
    public function billRefForUser(User $user): string
    {
        return 'COINS' . $user->id;
    }

    /**
     * Confirm a direct C2B payment.
     *
     * Creates:
     * 1. Completed M-PESA transaction.
     * 2. Coin ledger entry.
     * 3. Coin balance credit.
     * 4. Points ledger entry.
     *
     * M-PESA TransID prevents duplicate payment credits.
     */
    public function confirmDirectPayment(
        string $billRef,
        string $transId,
        int $amountKes,
        string $phone
    ): ?MpesaTransaction {
        if (
            blank($transId) ||
            $amountKes <= 0 ||
            !preg_match('/^COINS(\d+)$/i', trim($billRef), $matches)
        ) {
            return null;
        }

        $userId = (int) $matches[1];
        $coins = $this->coinsForAmount($amountKes);

        if ($coins <= 0) {
            return null;
        }

        $notificationData = null;

        try {
            $tx = DB::transaction(function () use ($billRef, $transId, $amountKes, $phone, $userId, $coins, &$notificationData) {
                /*
                 * TransID is unique in mpesa_transactions.
                 */
                $existing = MpesaTransaction::query()
                    ->where('trans_id', $transId)
                    ->first();

                if ($existing) {
                    return $existing;
                }

                $user = User::query()
                    ->lockForUpdate()
                    ->find($userId);

                if (!$user) {
                    return null;
                }

                /*
                 * Create completed inbound payment.
                 */
                $tx = MpesaTransaction::create([
                    'user_id' => $user->id,
                    'type' => MpesaTransaction::TYPE_COINS_PURCHASE,
                    'direction' => MpesaTransaction::DIRECTION_INBOUND,
                    'status' => MpesaTransaction::STATUS_COMPLETED,
                    'amount' => $amountKes,
                    'currency' => 'KES',
                    'phone' => $phone ?: null,
                    'bill_ref_number' => $billRef,
                    'reference' => 'C2B-' . substr(
                        hash('sha256', $transId),
                        0,
                        40
                    ),
                    'trans_id' => $transId,
                    'mpesa_receipt' => $transId,
                    'coins' => $coins,
                    'completed_at' => now(),
                    'gateway_response' => [
                        'confirmed_by' => 'mpesa_c2b',
                        'confirmed_at' => now()->toISOString(),
                    ],
                ]);

                /*
                 * Create coin ledger entry.
                 */
                $ledgerEntry = CoinTransaction::create([
                    'user_id' => $user->id,
                    'type' => CoinTransaction::TYPE_PURCHASE,
                    'coins' => $coins,
                    'mpesa_transaction_id' => $tx->id,
                    'reference' => 'MPESA-COIN-' . $tx->id,
                    'description' => 'M-PESA C2B coin purchase',
                    'meta' => [
                        'payment_reference' => $tx->reference,
                        'mpesa_receipt' => $transId,
                        'payment_method' => 'c2b',
                    ],
                ]);

                /*
                 * Credit coins.
                 */
                $user->increment('coins', $coins);

                /*
                 * Award loyalty points.
                 *
                 * The transaction is already marked completed.
                 * This is still inside the same DB transaction.
                 */
                $this->pointsService->awardPaymentPoints(
                    $user,
                    $tx
                );

                $notificationData = [
                    'phone' => $phone,
                    'ledger_transaction_id' => $ledgerEntry->id,
                ];

                return $tx;
            }, 3);
        } catch (Throwable $e) {
            /*
             * A concurrent duplicate callback may hit the unique
             * trans_id constraint. Return the existing transaction.
             */
            $existing = MpesaTransaction::query()
                ->where('trans_id', $transId)
                ->first();

            if ($existing) {
                return $existing;
            }

            Log::error('C2B coin payment confirmation failed.', [
                'trans_id' => $transId,
                'bill_ref' => $billRef,
                'error' => $e->getMessage(),
            ]);

            return null;
        }

        if ($notificationData) {
            $this->sendPurchaseNotification($notificationData);
        }

        return $tx;
    }

    /*
    |--------------------------------------------------------------------------
    | C2B Coin Conversion
    |--------------------------------------------------------------------------
    */

    /**
     * Convert C2B amount into coins.
     */
    protected function coinsForAmount(int $amountKes): int
    {
        return match ($amountKes) {
            50 => 50,
            100 => 110,
            165 => 180,
            250 => 280,
            330 => 380,
            500 => 600,
            820 => 1050,
            default => $amountKes,
        };
    }

    /*
    |--------------------------------------------------------------------------
    | Notifications
    |--------------------------------------------------------------------------
    */

    /**
     * Send purchase notification outside the database transaction.
     */
    protected function sendPurchaseNotification(array $data): void
    {
        if (blank($data['phone'] ?? null)) {
            return;
        }

        try {
            $ledgerEntry = CoinTransaction::find(
                $data['ledger_transaction_id'] ?? 0
            );

            if (!$ledgerEntry) {
                return;
            }

            $this->notifier->coinsPurchaseCompleted(
                $data['phone'],
                $ledgerEntry
            );
        } catch (Throwable $e) {
            Log::warning('Coin purchase notification failed.', [
                'ledger_transaction_id' => $data['ledger_transaction_id'] ?? null,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
