<?php

namespace App\Services;

use App\Models\MpesaTransaction;
use App\Models\PricingPlan;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class EscortPaymentService
{
    public function __construct(
        protected MpesaService $payments,
    ) {
    }

    /**
     * Start an escort subscription payment.
     */
    public function startPurchase(
        User $user,
        int $planId,
        int $days,
        string $phone,
    ): array {
        if ($days < 1 || $days > 3650) {
            return [
                'success' => false,
                'message' => 'Subscription duration must be between 1 and 3650 days.',
            ];
        }

        $phone = trim($phone);

        if (!$this->payments->validPhone($phone)) {
            return [
                'success' => false,
                'message' => 'Please enter a valid M-PESA phone number.',
            ];
        }

        if (!$this->payments->isStkConfigured()) {
            return [
                'success' => false,
                'message' => 'M-PESA payments are currently unavailable. Please try again later.',
            ];
        }

        $plan = PricingPlan::query()
            ->ofType(PricingPlan::TYPE_ESCORT_LISTING)
            ->active()
            ->whereKey($planId)
            ->first();

        if (!$plan) {
            return [
                'success' => false,
                'message' => 'The selected subscription plan is unavailable.',
            ];
        }

        if (!$plan->isCustom() && (int) $plan->days !== $days) {
            return [
                'success' => false,
                'message' => 'Invalid subscription duration for the selected plan.',
            ];
        }

        // Calculate the amount on the server, never from frontend input.
        $calculatedAmount = $plan->priceFor($days);
        $amountKes = (int) round($calculatedAmount);

        if ($amountKes <= 0) {
            return [
                'success' => false,
                'message' => 'The calculated subscription amount is invalid.',
            ];
        }

        $tx = DB::transaction(function () use ($user, $plan, $days, $amountKes, $phone, $calculatedAmount, ) {
            $lockedUser = User::query()
                ->whereKey($user->id)
                ->lockForUpdate()
                ->firstOrFail();

            $hasUnresolvedPayment = MpesaTransaction::query()
                ->where('user_id', $lockedUser->id)
                ->where('type', MpesaTransaction::TYPE_ESCORT_LISTING_FEES)
                ->whereIn('status', [
                    MpesaTransaction::STATUS_PENDING,
                    MpesaTransaction::STATUS_PROCESSING,
                    MpesaTransaction::STATUS_UNKNOWN,
                ])
                ->exists();

            if ($hasUnresolvedPayment) {
                return null;
            }

            $reference = $this->payments->generateReference(
                'ESCORT',
                $lockedUser,
            );

            return MpesaTransaction::create([
                'user_id' => $lockedUser->id,
                'type' => MpesaTransaction::TYPE_ESCORT_LISTING_FEES,
                'direction' => MpesaTransaction::DIRECTION_INBOUND,
                'status' => MpesaTransaction::STATUS_PENDING,
                'amount' => $amountKes,
                'currency' => $plan->currency ?: 'KES',
                'phone' => $phone,

                // Use this exact value when submitting STK Push.
                'bill_ref_number' => $reference,

                'meta' => [
                    'created_for' => 'escort_subscription',
                    'payment_method' => 'stk',
                    'plan_id' => $plan->id,
                    'plan_key' => $plan->key,
                    'plan_label' => $plan->label,
                    'days' => $days,
                    'unit_price' => (float) $plan->unit_price,
                    'discount_percent' => (float) $plan->discount_percent,
                    'calculated_amount' => $calculatedAmount,
                    'amount' => $amountKes,
                    'created_at' => now()->toISOString(),
                ],
            ]);
        });

        if (!$tx) {
            return [
                'success' => false,
                'message' => 'You already have an unresolved escort subscription payment. Please wait for it to be confirmed before starting another payment.',
            ];
        }

        try {
            $result = $this->payments->initiateStk(
                $phone,
                $amountKes,
                $tx->bill_ref_number,
                'Escort listing subscription',
            );

            if (!$result['success']) {
                $tx->update([
                    'status' => $result['uncertain']
                        ? MpesaTransaction::STATUS_UNKNOWN
                        : MpesaTransaction::STATUS_FAILED,
                    'failed_at' => $result['uncertain'] ? null : now(),
                    'result_desc' => $result['message'],
                    'gateway_response' => [
                        'stk_error' => $result['message'],
                        'stk_uncertain' => $result['uncertain'],
                        'stk_error_at' => now()->toISOString(),
                        'raw' => $result['raw'],
                    ],
                ]);

                return [
                    'success' => false,
                    'uncertain' => $result['uncertain'],
                    'transaction' => $tx->fresh(),
                    'message' => $result['uncertain']
                        ? 'We could not confirm whether M-PESA received your request. Please wait while we verify it. Do not pay again yet.'
                        : $result['message'],
                ];
            }

            $tx->update([
                'status' => MpesaTransaction::STATUS_PROCESSING,
                'checkout_request_id' => $result['checkout_request_id'],
                'merchant_request_id' => $result['merchant_request_id'],
                'gateway_response' => [
                    'stk_submitted_at' => now()->toISOString(),
                    'raw' => $result['raw'],
                ],
            ]);

            return [
                'success' => true,
                'transaction' => $tx->fresh(),
                'checkout_request_id' => $result['checkout_request_id'],
                'message' => $result['message'],
            ];
        } catch (Throwable $e) {
            Log::error('Escort subscription STK initiation exception.', [
                'transaction_id' => $tx->id,
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            // The request may have reached M-PESA. Do not mark it failed
            // or initiate another payment automatically.
            $tx->update([
                'status' => MpesaTransaction::STATUS_UNKNOWN,
                'gateway_response' => [
                    'stk_error' => 'Unable to confirm the STK initiation result.',
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

    /**
     * Confirm payment and activate or extend the subscription.
     */
    public function confirmPayment(
        MpesaTransaction $tx,
        string $mpesaReceipt,
    ): void {
        if (blank($mpesaReceipt)) {
            Log::warning('Escort payment confirmation received without receipt.', [
                'transaction_id' => $tx->id,
            ]);

            return;
        }

        DB::transaction(function () use ($tx, $mpesaReceipt) {
            $lockedTx = MpesaTransaction::query()
                ->lockForUpdate()
                ->find($tx->id);

            if (!$lockedTx) {
                return;
            }

            if (
                $lockedTx->type !== MpesaTransaction::TYPE_ESCORT_LISTING_FEES
                || $lockedTx->direction !== MpesaTransaction::DIRECTION_INBOUND
            ) {
                Log::warning('Invalid transaction type for escort confirmation.', [
                    'transaction_id' => $lockedTx->id,
                ]);

                return;
            }

            if ($lockedTx->status === MpesaTransaction::STATUS_COMPLETED) {
                return;
            }

            if ($lockedTx->isTerminal()) {
                Log::warning('Successful callback received for terminal escort payment.', [
                    'transaction_id' => $lockedTx->id,
                    'status' => $lockedTx->status,
                ]);

                return;
            }

            $meta = $lockedTx->meta ?? [];

            $days = (int) ($meta['days'] ?? 0);
            $planId = (int) ($meta['plan_id'] ?? 0);
            $expectedAmount = (int) ($meta['amount'] ?? 0);
            $planLabel = trim((string) ($meta['plan_label'] ?? ''));

            if (
                $days < 1
                || $days > 3650
                || $planId <= 0
                || $expectedAmount <= 0
                || $planLabel === ''
                || (int) $lockedTx->amount !== $expectedAmount
            ) {
                Log::error('Invalid escort subscription transaction metadata.', [
                    'transaction_id' => $lockedTx->id,
                    'meta' => $meta,
                    'transaction_amount' => $lockedTx->amount,
                ]);

                return;
            }

            $user = User::query()
                ->lockForUpdate()
                ->find($lockedTx->user_id);

            if (!$user) {
                Log::error('Escort subscription user not found.', [
                    'transaction_id' => $lockedTx->id,
                    'user_id' => $lockedTx->user_id,
                ]);

                return;
            }

            $now = now();

            $existingExpiry = $user->subscription_expires_at
                ? Carbon::parse($user->subscription_expires_at)
                : null;

            $existingStart = $user->subscription_started_at
                ? Carbon::parse($user->subscription_started_at)
                : null;

            $hasActiveSubscription = $existingStart
                && $existingExpiry
                && $existingStart->lte($now)
                && $existingExpiry->gt($now);

            $subscriptionStart = $hasActiveSubscription
                ? $existingStart
                : $now->copy();

            $expiryBase = $existingExpiry && $existingExpiry->gt($now)
                ? $existingExpiry->copy()
                : $now->copy();

            $newExpiry = $expiryBase->addDays($days);

            $user->forceFill([
                'subscription_plan' => $planLabel,
                'subscription_started_at' => $subscriptionStart,
                'subscription_expires_at' => $newExpiry,
            ])->save();

            $gatewayResponse = $lockedTx->gateway_response ?? [];

            if (!is_array($gatewayResponse)) {
                $gatewayResponse = [];
            }

            $lockedTx->update([
                'status' => MpesaTransaction::STATUS_COMPLETED,
                'mpesa_receipt' => $mpesaReceipt,
                'completed_at' => now(),
                'failed_at' => null,
                'gateway_response' => array_merge($gatewayResponse, [
                    'confirmed_at' => now()->toISOString(),
                    'confirmed_by' => 'mpesa_stk',
                    'subscription_activated' => true,
                    'subscription_days_added' => $days,
                    'subscription_expires_at' => $newExpiry->toISOString(),
                ]),
            ]);
        });
    }

    /**
     * Mark a payment failed only when failure is definitive.
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
                || $lockedTx->type !== MpesaTransaction::TYPE_ESCORT_LISTING_FEES
                || $lockedTx->isTerminal()
            ) {
                return;
            }

            $gatewayResponse = $lockedTx->gateway_response ?? [];

            if (!is_array($gatewayResponse)) {
                $gatewayResponse = [];
            }

            $lockedTx->update([
                'status' => MpesaTransaction::STATUS_FAILED,
                'failed_at' => now(),
                'result_desc' => $reason,
                'gateway_response' => array_merge($gatewayResponse, [
                    'failure_reason' => $reason,
                    'failed_at' => now()->toISOString(),
                ]),
            ]);
        });
    }

    public function findByCheckoutRequestId(
        string $checkoutRequestId,
    ): ?MpesaTransaction {
        return MpesaTransaction::query()
            ->where('checkout_request_id', $checkoutRequestId)
            ->where('type', MpesaTransaction::TYPE_ESCORT_LISTING_FEES)
            ->first();
    }

    /**
     * Find an unresolved escort payment by bill reference.
     */
    public function findByBillRef(string $billRef): ?MpesaTransaction
    {
        return MpesaTransaction::query()
            ->where('bill_ref_number', $billRef)
            ->where('type', MpesaTransaction::TYPE_ESCORT_LISTING_FEES)
            ->whereIn('status', [
                MpesaTransaction::STATUS_PENDING,
                MpesaTransaction::STATUS_PROCESSING,
                MpesaTransaction::STATUS_UNKNOWN,
            ])
            ->latest('id')
            ->first();
    }

    /**
     * Query an existing escort payment.
     */
    public function reconcileStkQuery(MpesaTransaction $tx): array
    {
        $tx = $tx->fresh();

        if (!$tx || $tx->type !== MpesaTransaction::TYPE_ESCORT_LISTING_FEES) {
            return [
                'status' => 'not_found',
                'message' => 'Escort payment transaction not found.',
            ];
        }

        if ($tx->status === MpesaTransaction::STATUS_COMPLETED) {
            return ['status' => 'completed'];
        }

        if ($tx->isTerminal()) {
            return ['status' => $tx->status];
        }

        if (blank($tx->checkout_request_id)) {
            return [
                'status' => 'query_unavailable',
                'message' => 'No checkout request ID is available.',
            ];
        }

        try {
            $result = $this->payments->queryStk(
                $tx->checkout_request_id
            );

            if (!$result['success']) {
                return [
                    'status' => 'query_failed',
                    'message' => $result['message'],
                ];
            }

            if (
                $result['result_code'] === null
                || $result['result_code'] === ''
            ) {
                return [
                    'status' => 'still_pending',
                    'message' => $result['message'],
                ];
            }

            if ((string) $result['result_code'] === '0') {
                if (blank($result['receipt'])) {
                    return [
                        'status' => 'still_pending',
                        'message' => 'Payment success reported without a receipt. Waiting for confirmation.',
                    ];
                }

                $this->confirmPayment($tx, (string) $result['receipt']);

                return [
                    'status' => $tx->fresh()?->status === MpesaTransaction::STATUS_COMPLETED
                        ? 'completed'
                        : 'confirmation_pending',
                ];
            }

            $this->failPayment(
                $tx,
                $result['result_desc'] ?? 'M-PESA payment failed.',
            );

            return [
                'status' => 'failed',
                'message' => $result['result_desc'] ?? 'M-PESA payment failed.',
            ];
        } catch (Throwable $e) {
            Log::error('Escort subscription STK reconciliation failed.', [
                'transaction_id' => $tx->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'status' => 'query_failed',
                'message' => 'Unable to query M-PESA at this time.',
            ];
        }
    }

    public function billRefForUser(User $user): string
    {
        return $this->payments->generateReference('ESCORT', $user);
    }
}
