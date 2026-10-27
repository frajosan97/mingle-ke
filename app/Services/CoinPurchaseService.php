<?php

namespace App\Services;

use App\Models\CoinTransaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CoinPurchaseService
{
    public function __construct(
        protected MpesaService $mpesa,
        protected NotificationService $notifier,
    ) {
    }

    /* =================================================================
     | STK PUSH
     | ================================================================= */

    /**
     * @return array{ok: bool, message: string, transaction?: CoinTransaction}
     */
    public function startPurchase(
        User $user,
        int $coins,
        int $amountKes,
        ?int $packageId,
        string $phone
    ): array {
        if ($coins <= 0 || $amountKes <= 0) {
            return ['ok' => false, 'message' => 'Invalid amount.'];
        }

        // Prevent duplicate STK prompts from rapid taps.
        if ($user->hasPendingCoinPurchase()) {
            return [
                'ok' => false,
                'message' => 'You already have a pending coin payment. '
                    . 'Check your phone or wait a minute before trying again.',
            ];
        }

        $tx = $user->coinTransactions()->create([
            'type' => CoinTransaction::TYPE_PURCHASE,
            'status' => CoinTransaction::STATUS_PENDING,
            'coins' => $coins,
            'amount_kes' => $amountKes,
            'package_id' => $packageId,
            'method' => 'mpesa',
            'source' => CoinTransaction::SOURCE_STK,
            'phone' => $phone,
            'bill_ref_number' => $this->billRefForUser($user),
        ]);

        $res = $this->mpesa->stkPush(
            $phone,
            $amountKes,
            'COINS-' . $tx->id,
            'MingleKE coins top-up'
        );

        if (!($res['success'] ?? false)) {
            $tx->update([
                'status' => CoinTransaction::STATUS_FAILED,
                'meta' => ['error' => $res['message'] ?? 'STK push failed'],
            ]);
            return ['ok' => false, 'message' => $res['message'] ?? 'M-PESA is unavailable.'];
        }

        $tx->update([
            'status' => CoinTransaction::STATUS_PROCESSING,
            'checkout_request_id' => $res['checkout_request_id'] ?? null,
            'merchant_request_id' => $res['merchant_request_id'] ?? null,
        ]);

        return [
            'ok' => true,
            'message' => 'Check your phone and enter your M-PESA PIN.',
            'transaction' => $tx->fresh(),
        ];
    }

    /**
     * Called from the STK callback when M-PESA reports success.
     * Idempotent — safe if M-PESA retries the callback.
     */
    public function confirmPayment(CoinTransaction $tx, string $mpesaReceipt): void
    {
        if ($tx->status === CoinTransaction::STATUS_COMPLETED) {
            return;
        }

        DB::transaction(function () use ($tx, $mpesaReceipt) {
            $locked = CoinTransaction::lockForUpdate()->find($tx->id);
            if (!$locked || $locked->status === CoinTransaction::STATUS_COMPLETED) {
                return;
            }

            $locked->update([
                'status' => CoinTransaction::STATUS_COMPLETED,
                'mpesa_receipt' => $mpesaReceipt,
            ]);

            $user = User::lockForUpdate()->find($locked->user_id);
            if ($user) {
                $user->increment('coins', $locked->coins);
            }
        });

        $fresh = $tx->fresh();
        if ($fresh && $fresh->phone) {
            $this->notifier->coinsPurchaseCompleted($fresh->phone, $fresh);
        }
    }

    public function failPayment(CoinTransaction $tx, string $reason): void
    {
        if ($tx->isTerminal()) {
            return;
        }

        $tx->update([
            'status' => CoinTransaction::STATUS_FAILED,
            'meta' => array_merge($tx->meta ?? [], ['failure_reason' => $reason]),
        ]);
    }

    public function findByCheckoutRequestId(string $checkoutRequestId): ?CoinTransaction
    {
        return CoinTransaction::where('checkout_request_id', $checkoutRequestId)->first();
    }

    /* =================================================================
     | C2B (DIRECT PAYBILL)
     | ================================================================= */

    /**
     * Deterministic account reference the user types in M-PESA.
     * Format: COINS{userId}. M-PESA accepts 1-12 alphanumeric chars.
     */
    public function billRefForUser(User $user): string
    {
        return 'COINS' . $user->id;
    }

    public function findByBillRef(string $billRef): ?CoinTransaction
    {
        return CoinTransaction::query()
            ->where('bill_ref_number', $billRef)
            ->where('status', CoinTransaction::STATUS_PENDING)
            ->latest()
            ->first();
    }

    /**
     * Handle a confirmed C2B payment.
     *  - If a pending tx exists for the bill ref, credit it.
     *  - If none exists but the bill ref encodes a valid user id, create
     *    a completed tx and credit coins (paying manually without clicking
     *    Recharge first still works).
     * Idempotent on TransID.
     */
    public function confirmDirectPayment(
        string $billRef,
        string $transId,
        int $amountKes,
        string $phone
    ): ?CoinTransaction {
        if ($amountKes <= 0 || $transId === '') {
            return null;
        }

        // Idempotency — M-PESA can retry the confirmation webhook.
        $already = CoinTransaction::where('trans_id', $transId)->first();
        if ($already) {
            return $already;
        }

        return DB::transaction(function () use ($billRef, $transId, $amountKes, $phone) {
            $tx = $this->findByBillRef($billRef);

            // No pending tx — derive the user from COINS{userId}.
            if (!$tx) {
                $userId = $this->extractUserId($billRef);
                if ($userId === null) {
                    return null;
                }

                $user = User::find($userId);
                if (!$user) {
                    return null;
                }

                $coins = $this->coinsForAmount($amountKes);

                $tx = $user->coinTransactions()->create([
                    'type' => CoinTransaction::TYPE_PURCHASE,
                    'status' => CoinTransaction::STATUS_COMPLETED,
                    'coins' => $coins,
                    'amount_kes' => $amountKes,
                    'method' => 'mpesa',
                    'source' => CoinTransaction::SOURCE_C2B,
                    'phone' => $phone,
                    'bill_ref_number' => $billRef,
                    'trans_id' => $transId,
                    'mpesa_receipt' => $transId,
                ]);

                $user->increment('coins', $coins);

                if ($phone) {
                    $this->notifier->coinsPurchaseCompleted($phone, $tx);
                }

                return $tx;
            }

            // Existing pending tx — close it out.
            $locked = CoinTransaction::lockForUpdate()->find($tx->id);
            if (!$locked || $locked->status === CoinTransaction::STATUS_COMPLETED) {
                return $locked;
            }

            $locked->update([
                'status' => CoinTransaction::STATUS_COMPLETED,
                'mpesa_receipt' => $transId,
                'trans_id' => $transId,
                'source' => CoinTransaction::SOURCE_C2B,
            ]);

            $user = User::lockForUpdate()->find($locked->user_id);
            if ($user) {
                $user->increment('coins', $locked->coins);
            }

            if ($phone) {
                $this->notifier->coinsPurchaseCompleted($phone, $locked->fresh());
            }

            return $locked;
        });
    }

    private function extractUserId(string $billRef): ?int
    {
        return preg_match('/^COINS(\d+)$/i', $billRef, $m)
            ? (int) $m[1]
            : null;
    }

    /**
     * Convert a raw KES amount to coins using the same tier bonuses as
     * the CoinController pricing table, so manual payers get the same
     * rate as clickers.
     */
    private function coinsForAmount(int $amountKes): int
    {
        $bonus = match (true) {
            $amountKes >= 820 => 0.28,
            $amountKes >= 500 => 0.20,
            $amountKes >= 330 => 0.15,
            $amountKes >= 250 => 0.12,
            $amountKes >= 165 => 0.09,
            $amountKes >= 100 => 0.10,
            default => 0.0,
        };

        return (int) floor($amountKes * (1 + $bonus));
    }
}