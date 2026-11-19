<?php

namespace App\Services;

use App\Models\CoinPackage;
use App\Models\CoinTransaction;
use App\Models\MpesaTransaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class CoinsPurchaseService
{
    public function __construct(
        protected MpesaService $payments,
        protected NotificationService $notifier,
        protected PointsService $points,
    ) {
    }

    /**
     * Start a new coin purchase.
     */
    public function startPurchase(
        User $user,
        int $coins,
        int $amountKes,
        ?int $packageId,
        string $phone,
        ?array $packageSnapshot = null,
    ): array {
        if ($coins < 1 || $amountKes < 1) {
            throw new \InvalidArgumentException(
                'The coin quantity and payment amount must be greater than zero.'
            );
        }

        $phone = trim($phone);

        if (!$this->payments->validPhone($phone)) {
            throw new \InvalidArgumentException(
                'Please provide a valid M-PESA phone number.'
            );
        }

        if ($packageId !== null && $packageSnapshot === null) {
            $package = CoinPackage::query()->findOrFail($packageId);
            $packageSnapshot = $this->packageSnapshot($package);
        }

        $tx = MpesaTransaction::create([
            'user_id' => $user->id,
            'type' => MpesaTransaction::TYPE_COINS_PURCHASE,
            'direction' => MpesaTransaction::DIRECTION_INBOUND,
            'amount' => $amountKes,
            'phone' => $phone,
            'reference' => $this->payments->generateReference('COIN', $user),
            'status' => MpesaTransaction::STATUS_PENDING,
            'meta' => [
                'payment_method' => 'stk',
                'coins' => $coins,
                'package_snapshot' => $packageSnapshot,
            ],
        ]);

        try {
            if (!$this->payments->isStkConfigured()) {
                throw new \RuntimeException('M-PESA STK Push is not configured.');
            }

            $result = $this->payments->initiateStk(
                $phone,
                $amountKes,
                $tx->reference,
                'Mingle coins top-up',
            );

            if (!$result['success']) {
                $tx->update([
                    'status' => $result['uncertain']
                        ? MpesaTransaction::STATUS_UNKNOWN
                        : MpesaTransaction::STATUS_FAILED,
                    'gateway_response' => $result['raw'],
                    'meta' => array_merge($tx->meta ?? [], [
                        'stk_error' => $result['message'],
                        'stk_uncertain' => $result['uncertain'],
                    ]),
                ]);

                return [
                    'success' => false,
                    'uncertain' => $result['uncertain'],
                    'transaction' => $tx->fresh(),
                    'transaction_id' => $tx->id,
                    'message' => $result['message'],
                ];
            }

            $tx->update([
                'status' => MpesaTransaction::STATUS_PROCESSING,
                'checkout_request_id' => $result['checkout_request_id'],
                'merchant_request_id' => $result['merchant_request_id'],
                'gateway_response' => $result['raw'],
            ]);

            return [
                'success' => true,
                'transaction' => $tx->fresh(),
                'transaction_id' => $tx->id,
                'checkout_request_id' => $result['checkout_request_id'],
                'message' => $result['message'],
            ];
        } catch (Throwable $e) {
            Log::error('Coins STK purchase initiation failed.', [
                'transaction_id' => $tx->id,
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            $tx->update([
                'status' => MpesaTransaction::STATUS_UNKNOWN,
                'gateway_response' => [
                    'error' => $e->getMessage(),
                    'uncertain' => true,
                ],
            ]);

            return [
                'success' => false,
                'uncertain' => true,
                'transaction' => $tx->fresh(),
                'transaction_id' => $tx->id,
                'message' => 'We could not confirm whether M-PESA received the request. Please wait while we verify it.',
            ];
        }
    }

    /**
     * Confirm an STK payment and credit the wallet.
     */
    public function confirmPayment(
        MpesaTransaction $tx,
        string $mpesaReceipt,
    ): void {
        if (blank($mpesaReceipt)) {
            Log::warning('Coin payment confirmation received without receipt.', [
                'transaction_id' => $tx->id,
            ]);

            return;
        }

        $result = DB::transaction(function () use ($tx, $mpesaReceipt) {
            $lockedTx = MpesaTransaction::query()
                ->lockForUpdate()
                ->find($tx->id);

            if (!$lockedTx) {
                return ['ledger' => null, 'notify' => false];
            }

            if (
                $lockedTx->type !== MpesaTransaction::TYPE_COINS_PURCHASE
                || $lockedTx->direction !== MpesaTransaction::DIRECTION_INBOUND
            ) {
                return ['ledger' => null, 'notify' => false];
            }

            if ($lockedTx->status === MpesaTransaction::STATUS_COMPLETED) {
                return ['ledger' => null, 'notify' => false];
            }

            if ($lockedTx->isTerminal()) {
                Log::warning('Coin payment confirmation received for terminal transaction.', [
                    'transaction_id' => $lockedTx->id,
                    'status' => $lockedTx->status,
                ]);

                return ['ledger' => null, 'notify' => false];
            }

            $meta = $lockedTx->meta ?? [];
            $snapshot = $meta['package_snapshot'] ?? null;

            $coins = (int) ($snapshot['coins'] ?? $meta['coins'] ?? 0);

            if ($coins < 1) {
                throw new \RuntimeException(
                    'Unable to determine the number of coins to credit.'
                );
            }

            $reference = 'MPESA-COIN-' . $lockedTx->id;

            $existingLedger = CoinTransaction::query()
                ->where('reference', $reference)
                ->first();

            if ($existingLedger) {
                $lockedTx->update([
                    'status' => MpesaTransaction::STATUS_COMPLETED,
                    'trans_id' => $mpesaReceipt,
                ]);

                return ['ledger' => null, 'notify' => false];
            }

            $user = User::query()
                ->lockForUpdate()
                ->findOrFail($lockedTx->user_id);

            $user->increment('coins', $coins);
            $user->refresh();

            $ledgerEntry = CoinTransaction::create([
                'user_id' => $user->id,
                'type' => CoinTransaction::TYPE_PURCHASE,
                'amount' => $coins,
                'balance_after' => $user->coins,
                'reference' => $reference,
                'description' => 'Coins purchased through M-PESA',
                'meta' => [
                    'mpesa_transaction_id' => $lockedTx->id,
                    'mpesa_receipt' => $mpesaReceipt,
                    'amount_kes' => $lockedTx->amount,
                    'package_snapshot' => $snapshot,
                    'payment_method' => $meta['payment_method'] ?? 'stk',
                ],
            ]);

            $lockedTx->update([
                'status' => MpesaTransaction::STATUS_COMPLETED,
                'trans_id' => $mpesaReceipt,
                'meta' => array_merge($meta, [
                    'coins_credited' => $coins,
                    'coin_transaction_id' => $ledgerEntry->id,
                ]),
            ]);

            $this->points->awardPaymentPoints($user, $lockedTx);

            return [
                'ledger' => $ledgerEntry,
                'notify' => true,
                'phone' => $lockedTx->phone,
            ];
        });

        if ($result['notify'] && $result['ledger']) {
            DB::afterCommit(function () use ($result) {
                $this->sendPurchaseNotification(
                    $result['phone'],
                    $result['ledger'],
                );
            });
        }
    }

    /**
     * Mark a payment as failed when failure is definitive.
     */
    public function failPayment(
        MpesaTransaction $tx,
        string $reason,
    ): void {
        DB::transaction(function () use ($tx, $reason) {
            $lockedTx = MpesaTransaction::query()
                ->lockForUpdate()
                ->find($tx->id);

            if (
                !$lockedTx
                || $lockedTx->type !== MpesaTransaction::TYPE_COINS_PURCHASE
                || $lockedTx->isTerminal()
            ) {
                return;
            }

            $lockedTx->update([
                'status' => MpesaTransaction::STATUS_FAILED,
                'meta' => array_merge($lockedTx->meta ?? [], [
                    'failure_reason' => $reason,
                ]),
            ]);
        });
    }

    public function findByCheckoutRequestId(
        string $checkoutRequestId,
    ): ?MpesaTransaction {
        return MpesaTransaction::query()
            ->where('checkout_request_id', $checkoutRequestId)
            ->where('type', MpesaTransaction::TYPE_COINS_PURCHASE)
            ->first();
    }

    public function findByBillRef(string $billRef): ?MpesaTransaction
    {
        return MpesaTransaction::query()
            ->where('reference', $billRef)
            ->where('type', MpesaTransaction::TYPE_COINS_PURCHASE)
            ->first();
    }

    public function billRefForUser(User $user): string
    {
        return 'COIN-' . $user->id;
    }

    /**
     * Query the status of an existing STK payment.
     */
    public function reconcileStkQuery(MpesaTransaction $tx): array
    {
        $tx = $tx->fresh();

        if (!$tx || $tx->type !== MpesaTransaction::TYPE_COINS_PURCHASE) {
            return [
                'success' => false,
                'status' => 'not_found',
                'message' => 'Coin payment transaction not found.',
            ];
        }

        if ($tx->status === MpesaTransaction::STATUS_COMPLETED) {
            return [
                'success' => true,
                'status' => $tx->status,
                'message' => 'Payment already completed.',
            ];
        }

        if ($tx->isTerminal()) {
            return [
                'success' => false,
                'status' => $tx->status,
                'message' => 'This payment has already been finalized.',
            ];
        }

        if (blank($tx->checkout_request_id)) {
            return [
                'success' => false,
                'status' => $tx->status,
                'message' => 'No checkout request ID is available.',
            ];
        }

        try {
            $result = $this->payments->queryStk($tx->checkout_request_id);

            if (!$result['success']) {
                return [
                    'success' => false,
                    'status' => $tx->status,
                    'message' => $result['message'],
                ];
            }

            if ((string) $result['result_code'] === '0') {
                if (blank($result['receipt'])) {
                    return [
                        'success' => false,
                        'status' => MpesaTransaction::STATUS_UNKNOWN,
                        'message' => 'Payment success was reported without a receipt. Waiting for confirmation.',
                    ];
                }

                $this->confirmPayment($tx, (string) $result['receipt']);

                return [
                    'success' => true,
                    'status' => $tx->fresh()?->status,
                    'message' => 'Payment confirmation processed.',
                ];
            }

            if (
                $result['result_code'] !== null
                && (string) $result['result_code'] !== ''
            ) {
                $this->failPayment(
                    $tx,
                    $result['result_desc'] ?? 'M-PESA payment failed.',
                );

                return [
                    'success' => false,
                    'status' => MpesaTransaction::STATUS_FAILED,
                    'message' => $result['result_desc'] ?? 'M-PESA payment failed.',
                ];
            }

            $tx->update([
                'status' => MpesaTransaction::STATUS_UNKNOWN,
                'gateway_response' => $result['raw'],
            ]);

            return [
                'success' => false,
                'status' => MpesaTransaction::STATUS_UNKNOWN,
                'message' => $result['message'],
            ];
        } catch (Throwable $e) {
            Log::warning('Coin STK reconciliation failed.', [
                'transaction_id' => $tx->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'status' => $tx->status,
                'message' => 'Unable to query M-PESA at this time.',
            ];
        }
    }

    /**
     * Process an incoming C2B payment.
     */
    public function confirmDirectPayment(
        string $billRef,
        string $transId,
        int $amountKes,
        string $phone,
    ): ?MpesaTransaction {
        if ($amountKes < 1 || blank($transId)) {
            return null;
        }

        try {
            $tx = DB::transaction(function () use ($billRef, $transId, $amountKes, $phone, ) {
                $existing = MpesaTransaction::query()
                    ->where('trans_id', $transId)
                    ->first();

                if ($existing) {
                    return $existing;
                }

                if (!preg_match('/^COIN-(\d+)(?:-|$)/i', $billRef, $matches)) {
                    return null;
                }

                $user = User::query()->find((int) $matches[1]);

                if (!$user) {
                    return null;
                }

                $package = CoinPackage::query()
                    ->where('price', $amountKes)
                    ->first();

                $coins = $package
                    ? $package->totalCoins()
                    : $amountKes;

                if ($coins < 1) {
                    return null;
                }

                $snapshot = $package
                    ? $this->packageSnapshot($package)
                    : null;

                $meta = [
                    'payment_method' => 'c2b',
                    'package_snapshot' => $snapshot,
                    'coins' => $coins,
                ];

                $tx = MpesaTransaction::create([
                    'user_id' => $user->id,
                    'type' => MpesaTransaction::TYPE_COINS_PURCHASE,
                    'direction' => MpesaTransaction::DIRECTION_INBOUND,
                    'amount' => $amountKes,
                    'phone' => $phone,
                    'reference' => $billRef,
                    'trans_id' => $transId,
                    'status' => MpesaTransaction::STATUS_PROCESSING,
                    'meta' => $meta,
                ]);

                $lockedUser = User::query()
                    ->lockForUpdate()
                    ->findOrFail($user->id);

                $lockedUser->increment('coins', $coins);
                $lockedUser->refresh();

                $ledgerEntry = CoinTransaction::create([
                    'user_id' => $lockedUser->id,
                    'type' => CoinTransaction::TYPE_PURCHASE,
                    'amount' => $coins,
                    'balance_after' => $lockedUser->coins,
                    'reference' => 'MPESA-COIN-' . $tx->id,
                    'description' => 'Coins purchased through M-PESA C2B',
                    'meta' => [
                        'mpesa_transaction_id' => $tx->id,
                        'mpesa_receipt' => $transId,
                        'amount_kes' => $amountKes,
                        'package_snapshot' => $snapshot,
                        'payment_method' => 'c2b',
                    ],
                ]);

                $tx->update([
                    'status' => MpesaTransaction::STATUS_COMPLETED,
                    'meta' => array_merge($meta, [
                        'coins_credited' => $coins,
                        'coin_transaction_id' => $ledgerEntry->id,
                    ]),
                ]);

                $this->points->awardPaymentPoints($lockedUser, $tx);

                DB::afterCommit(function () use ($phone, $ledgerEntry) {
                    $this->sendPurchaseNotification($phone, $ledgerEntry);
                });

                return $tx;
            });

            return $tx;
        } catch (Throwable $e) {
            Log::error('C2B coin payment processing failed.', [
                'trans_id' => $transId,
                'bill_ref' => $billRef,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    protected function packageSnapshot(CoinPackage $package): array
    {
        return [
            'id' => $package->id,
            'name' => $package->name,
            'coins' => $package->totalCoins(),
            'base_coins' => $package->baseCoins(),
            'bonus' => $package->bonus,
            'price' => $package->price,
            'currency' => 'KES',
        ];
    }

    protected function sendPurchaseNotification(
        string $phone,
        CoinTransaction $ledgerEntry,
    ): void {
        try {
            $this->notifier->coinsPurchaseCompleted($phone, $ledgerEntry);
        } catch (Throwable $e) {
            Log::warning('Coins purchase notification failed.', [
                'ledger_id' => $ledgerEntry->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
