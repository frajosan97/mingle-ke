<?php

namespace App\Services;

use App\Models\MpesaTransaction;
use App\Models\PointTransaction;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class PointsService
{
    public const POINTS_PER_KES = 0.1;
    public const MAX_PAYMENT_POINTS = 100;
    public const REFERRAL_POINTS = 5;

    /**
     * Award points for a successfully completed inbound payment.
     *
     * IMPORTANT:
     * Call this inside the same DB transaction that completes
     * the M-PESA transaction.
     */
    public function awardPaymentPoints(
        User $user,
        MpesaTransaction $payment
    ): ?PointTransaction {
        if (
            $payment->status !== MpesaTransaction::STATUS_COMPLETED ||
            $payment->direction !== MpesaTransaction::DIRECTION_INBOUND ||
            (float) $payment->amount <= 0
        ) {
            return null;
        }

        // 1 point per KES 10, maximum 100 points.
        $amountKes = (int) floor((float) $payment->amount);

        $points = min(
            self::MAX_PAYMENT_POINTS,
            intdiv($amountKes, 10)
        );

        if ($points <= 0) {
            return null;
        }

        // Deterministic reference prevents duplicate rewards.
        $reference = 'PAYMENT-MPESA-' . $payment->id;

        $existing = PointTransaction::query()
            ->where('user_id', $user->id)
            ->where('reference', $reference)
            ->first();

        if ($existing) {
            return $existing;
        }

        return PointTransaction::create([
            'user_id' => $user->id,
            'type' => PointTransaction::TYPE_EARNED,
            'direction' => PointTransaction::DIRECTION_CREDIT,
            'points' => $points,
            'reference' => $reference,
            'description' => 'Points earned from successful M-PESA payment',
            'meta' => [
                'mpesa_transaction_id' => $payment->id,
                'mpesa_reference' => $payment->reference,
                'mpesa_receipt' => $payment->mpesa_receipt,
                'amount_kes' => $amountKes,
                'points_rate' => '1 point per KES 10',
                'maximum_points' => self::MAX_PAYMENT_POINTS,
            ],
        ]);
    }

    /**
     * Award the referrer 5 points after the referred user's
     * email has been verified.
     *
     * $referralReference must uniquely identify this referral,
     * for example: REFERRAL-123.
     */
    public function awardReferralPoints(
        User $referrer,
        string $referralReference,
        ?User $referredUser = null
    ): ?PointTransaction {
        $referralReference = trim($referralReference);

        if ($referralReference === '') {
            Log::warning('Referral reward skipped: missing reference.', [
                'referrer_id' => $referrer->id,
            ]);

            return null;
        }

        $reference = 'REFERRAL-' . $referralReference;

        $existing = PointTransaction::query()
            ->where('user_id', $referrer->id)
            ->where('reference', $reference)
            ->first();

        if ($existing) {
            return $existing;
        }

        return PointTransaction::create([
            'user_id' => $referrer->id,
            'type' => PointTransaction::TYPE_REFERRAL,
            'direction' => PointTransaction::DIRECTION_CREDIT,
            'points' => self::REFERRAL_POINTS,
            'reference' => $reference,
            'description' => 'Referral reward for a verified account',
            'meta' => [
                'referred_user_id' => $referredUser?->id,
                'referral_reference' => $referralReference,
                'points_awarded' => self::REFERRAL_POINTS,
                'trigger' => 'email_verified',
            ],
        ]);
    }
}
