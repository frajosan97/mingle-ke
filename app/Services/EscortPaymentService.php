<?php

namespace App\Services;

use App\Models\MpesaTransaction;
use App\Models\PricingPlan;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class EscortPaymentService
{
    private const DIRECT_INTENT_TTL_HOURS = 24;

    public function __construct(
        protected MpesaService $payments,
    ) {
    }

    /*
    |--------------------------------------------------------------------------
    | STK PURCHASE
    |--------------------------------------------------------------------------
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
            ->find($planId);

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

        $calculatedAmount = $plan->priceFor($days);
        $amountKes = (int) round($calculatedAmount);

        if ($amountKes <= 0) {
            return [
                'success' => false,
                'message' => 'The calculated subscription amount is invalid.',
            ];
        }

        $tx = DB::transaction(function () use ($user, $plan, $days, $amountKes, $phone, $calculatedAmount) {
            $lockedUser = User::query()
                ->lockForUpdate()
                ->findOrFail($user->id);

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

            $reference = 'E-' . $lockedUser->id
                . '-' . $plan->id
                . '-' . Str::upper(Str::random(7));

            return MpesaTransaction::create([
                'user_id' => $lockedUser->id,
                'type' => MpesaTransaction::TYPE_ESCORT_LISTING_FEES,
                'direction' => MpesaTransaction::DIRECTION_INBOUND,
                'status' => MpesaTransaction::STATUS_PENDING,
                'amount' => $amountKes,
                'currency' => 'KES',
                'phone' => $phone,
                'reference' => $reference,
                'bill_ref_number' => $reference,
                'pricing_plan_id' => $plan->id,
                'days' => $days,
                'unit_price' => $plan->unit_price,
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
                'message' => 'You already have an unresolved escort subscription payment. Please wait for it to be confirmed.',
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
                        'raw' => $result['raw'] ?? [],
                    ],
                ]);

                return [
                    'success' => false,
                    'uncertain' => $result['uncertain'],
                    'transaction' => $tx->fresh(),
                    'message' => $result['message'],
                ];
            }

            $tx->update([
                'status' => MpesaTransaction::STATUS_PROCESSING,
                'checkout_request_id' => $result['checkout_request_id'],
                'merchant_request_id' => $result['merchant_request_id'] ?? null,
                'gateway_response' => [
                    'stk_submitted_at' => now()->toISOString(),
                    'raw' => $result['raw'] ?? [],
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

    /*
    |--------------------------------------------------------------------------
    | STK CONFIRMATION
    |--------------------------------------------------------------------------
    */

    public function confirmPayment(
        MpesaTransaction $tx,
        string $mpesaReceipt,
        bool $allowFailedRecovery = true,
        ?int $paidAmount = null,
    ): void {
        $mpesaReceipt = strtoupper(trim($mpesaReceipt));

        if ($mpesaReceipt === '') {
            Log::warning('Escort payment confirmation received without receipt.', [
                'transaction_id' => $tx->id,
            ]);

            return;
        }

        DB::transaction(function () use ($tx, $mpesaReceipt, $allowFailedRecovery, $paidAmount) {
            $lockedTx = MpesaTransaction::query()
                ->lockForUpdate()
                ->find($tx->id);

            if (
                !$lockedTx
                || $lockedTx->type !== MpesaTransaction::TYPE_ESCORT_LISTING_FEES
                || $lockedTx->direction !== MpesaTransaction::DIRECTION_INBOUND
            ) {
                return;
            }

            if ($lockedTx->status === MpesaTransaction::STATUS_COMPLETED) {
                return;
            }

            if ($lockedTx->isTerminal()) {
                if (
                    !$allowFailedRecovery
                    || $lockedTx->status !== MpesaTransaction::STATUS_FAILED
                ) {
                    return;
                }
            }

            if (
                $paidAmount !== null
                && $paidAmount !== (int) round((float) $lockedTx->amount)
            ) {
                Log::error('Escort STK callback amount mismatch.', [
                    'transaction_id' => $lockedTx->id,
                    'expected' => $lockedTx->amount,
                    'received' => $paidAmount,
                ]);

                return;
            }

            if (
                $this->receiptBelongsToAnotherTransaction(
                    $mpesaReceipt,
                    $lockedTx->id
                )
            ) {
                Log::warning('Escort receipt already belongs to another transaction.', [
                    'receipt' => $mpesaReceipt,
                    'transaction_id' => $lockedTx->id,
                ]);

                return;
            }

            $meta = $lockedTx->meta ?? [];

            $days = (int) ($meta['days'] ?? $lockedTx->days ?? 0);
            $planId = (int) ($meta['plan_id'] ?? $lockedTx->pricing_plan_id ?? 0);
            $expectedAmount = (int) ($meta['amount'] ?? round((float) $lockedTx->amount));
            $planLabel = trim((string) ($meta['plan_label'] ?? ''));

            if (
                $days < 1
                || $days > 3650
                || $planId <= 0
                || $expectedAmount <= 0
                || (int) round((float) $lockedTx->amount) !== $expectedAmount
            ) {
                Log::error('Invalid escort subscription transaction metadata.', [
                    'transaction_id' => $lockedTx->id,
                    'meta' => $meta,
                ]);

                return;
            }

            if ($planLabel === '') {
                $planLabel = (string) PricingPlan::query()
                    ->whereKey($planId)
                    ->value('label');
            }

            if ($planLabel === '') {
                Log::error('Escort payment has no valid plan label.', [
                    'transaction_id' => $lockedTx->id,
                    'plan_id' => $planId,
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

            $expiry = $this->activateSubscription($user, $days, $planLabel);

            $gatewayResponse = $lockedTx->gateway_response ?? [];

            if (!is_array($gatewayResponse)) {
                $gatewayResponse = [];
            }

            $lockedTx->update([
                'status' => MpesaTransaction::STATUS_COMPLETED,
                'mpesa_receipt' => $mpesaReceipt,
                'trans_id' => $mpesaReceipt,
                'completed_at' => now(),
                'failed_at' => null,
                'starts_at' => $user->subscription_started_at,
                'expires_at' => $expiry,
                'gateway_response' => array_merge($gatewayResponse, [
                    'confirmed_at' => now()->toISOString(),
                    'confirmed_by' => 'mpesa_stk',
                    'subscription_activated' => true,
                    'subscription_days_added' => $days,
                    'subscription_expires_at' => $expiry->toISOString(),
                ]),
            ]);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | FAILURE AND LOOKUPS
    |--------------------------------------------------------------------------
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
        string $checkoutRequestId
    ): ?MpesaTransaction {
        return MpesaTransaction::query()
            ->where('checkout_request_id', $checkoutRequestId)
            ->where('type', MpesaTransaction::TYPE_ESCORT_LISTING_FEES)
            ->first();
    }

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

    /*
    |--------------------------------------------------------------------------
    | MANUAL C2B REFERENCE GENERATION
    |--------------------------------------------------------------------------
    */

    public function billRefForPlan(
        User $user,
        PricingPlan|int $plan,
        int $days,
    ): string {
        if ($days < 1 || $days > 3650) {
            throw new \InvalidArgumentException(
                'Invalid subscription duration.'
            );
        }

        $plan = $plan instanceof PricingPlan
            ? PricingPlan::query()
                ->ofType(PricingPlan::TYPE_ESCORT_LISTING)
                ->active()
                ->findOrFail($plan->id)
            : PricingPlan::query()
                ->ofType(PricingPlan::TYPE_ESCORT_LISTING)
                ->active()
                ->findOrFail($plan);

        if (!$plan->isCustom() && (int) $plan->days !== $days) {
            throw new \InvalidArgumentException(
                'Invalid subscription duration for the selected plan.'
            );
        }

        $amount = (int) round($plan->priceFor($days));

        if ($amount < 1) {
            throw new \InvalidArgumentException(
                'Invalid subscription amount.'
            );
        }

        do {
            $reference = 'E-' . $user->id
                . '-' . $plan->id
                . '-' . Str::upper(Str::random(7));

            $stored = Cache::add(
                $this->directIntentKey($reference),
                [
                    'user_id' => $user->id,
                    'plan_id' => $plan->id,
                    'days' => $days,
                    'amount' => $amount,
                    'plan_label' => $plan->label,
                    'created_at' => now()->toISOString(),
                ],
                now()->addHours(self::DIRECT_INTENT_TTL_HOURS)
            );
        } while (!$stored);

        return $reference;
    }

    public function billRefForUser(User $user): string
    {
        throw new \InvalidArgumentException(
            'A pricing plan and duration are required. Use billRefForPlan($user, $plan, $days).'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | MANUAL C2B VALIDATION
    |--------------------------------------------------------------------------
    */

    public function validateDirectPayment(
        string $billRef,
        int $amountKes,
    ): bool {
        $intent = $this->directIntent($billRef);

        if (!$intent || $amountKes < 1) {
            return false;
        }

        if ((int) $intent['amount'] !== $amountKes) {
            return false;
        }

        $userExists = User::query()
            ->whereKey($intent['user_id'] ?? 0)
            ->exists();

        if (!$userExists) {
            return false;
        }

        $plan = PricingPlan::query()
            ->ofType(PricingPlan::TYPE_ESCORT_LISTING)
            ->active()
            ->find($intent['plan_id'] ?? 0);

        if (!$plan) {
            return false;
        }

        $days = (int) ($intent['days'] ?? 0);

        if ($days < 1 || $days > 3650) {
            return false;
        }

        if (!$plan->isCustom() && (int) $plan->days !== $days) {
            return false;
        }

        return (int) round($plan->priceFor($days)) === $amountKes;
    }

    /*
    |--------------------------------------------------------------------------
    | MANUAL C2B CONFIRMATION
    |--------------------------------------------------------------------------
    */

    public function confirmDirectPayment(
        string $billRef,
        string $transId,
        int $amountKes,
        string $phone,
    ): ?MpesaTransaction {
        $transId = strtoupper(trim($transId));
        $phone = trim($phone);
        $billRef = strtoupper(trim($billRef));

        if ($transId === '' || $amountKes < 1 || $billRef === '') {
            return null;
        }

        try {
            $tx = DB::transaction(function () use ($billRef, $transId, $amountKes, $phone) {
                $existingReceipt = MpesaTransaction::query()
                    ->where('mpesa_receipt', $transId)
                    ->lockForUpdate()
                    ->first();

                if ($existingReceipt) {
                    return $existingReceipt->type === MpesaTransaction::TYPE_ESCORT_LISTING_FEES
                        ? $existingReceipt
                        : null;
                }

                $intent = $this->directIntent($billRef);

                if (
                    !$intent
                    || !$this->validateDirectPayment($billRef, $amountKes)
                ) {
                    Log::warning('Rejected C2B escort confirmation.', [
                        'bill_ref' => $billRef,
                        'trans_id' => $transId,
                        'amount' => $amountKes,
                    ]);

                    return null;
                }

                $user = User::query()
                    ->lockForUpdate()
                    ->find($intent['user_id']);

                if (!$user) {
                    return null;
                }

                $plan = PricingPlan::query()
                    ->ofType(PricingPlan::TYPE_ESCORT_LISTING)
                    ->active()
                    ->find($intent['plan_id']);

                if (!$plan) {
                    return null;
                }

                $days = (int) $intent['days'];

                if (
                    $days < 1
                    || $days > 3650
                    || (!$plan->isCustom() && (int) $plan->days !== $days)
                    || (int) round($plan->priceFor($days)) !== $amountKes
                ) {
                    return null;
                }

                $expiry = $this->activateSubscription(
                    $user,
                    $days,
                    $plan->label
                );

                return MpesaTransaction::create([
                    'user_id' => $user->id,
                    'type' => MpesaTransaction::TYPE_ESCORT_LISTING_FEES,
                    'direction' => MpesaTransaction::DIRECTION_INBOUND,
                    'status' => MpesaTransaction::STATUS_COMPLETED,
                    'amount' => $amountKes,
                    'currency' => 'KES',
                    'phone' => $phone,
                    'reference' => $billRef,
                    'bill_ref_number' => $billRef,
                    'mpesa_receipt' => $transId,
                    'trans_id' => $transId,
                    'pricing_plan_id' => $plan->id,
                    'days' => $days,
                    'unit_price' => $plan->unit_price,
                    'starts_at' => $user->subscription_started_at,
                    'expires_at' => $expiry,
                    'completed_at' => now(),
                    'meta' => [
                        'created_for' => 'escort_subscription',
                        'payment_method' => 'c2b',
                        'plan_id' => $plan->id,
                        'plan_key' => $plan->key,
                        'plan_label' => $plan->label,
                        'days' => $days,
                        'unit_price' => (float) $plan->unit_price,
                        'discount_percent' => (float) $plan->discount_percent,
                        'amount' => $amountKes,
                    ],
                    'gateway_response' => [
                        'confirmed_by' => 'mpesa_c2b',
                        'confirmed_at' => now()->toISOString(),
                        'subscription_activated' => true,
                        'subscription_days_added' => $days,
                        'subscription_expires_at' => $expiry->toISOString(),
                    ],
                ]);
            });

            if ($tx) {
                Cache::forget($this->directIntentKey($billRef));
            }

            return $tx;
        } catch (UniqueConstraintViolationException $e) {
            return MpesaTransaction::query()
                ->where('mpesa_receipt', $transId)
                ->where('type', MpesaTransaction::TYPE_ESCORT_LISTING_FEES)
                ->first();
        } catch (Throwable $e) {
            Log::error('C2B escort payment processing failed.', [
                'trans_id' => $transId,
                'bill_ref' => $billRef,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | STK RECONCILIATION
    |--------------------------------------------------------------------------
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
            $result = $this->payments->queryStk($tx->checkout_request_id);

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
                $result['result_desc'] ?? 'M-PESA payment failed.'
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

    /*
    |--------------------------------------------------------------------------
    | INTERNAL HELPERS
    |--------------------------------------------------------------------------
    */

    protected function directIntentKey(string $billRef): string
    {
        return 'mpesa:c2b:escort:' . hash(
            'sha256',
            strtoupper(trim($billRef))
        );
    }

    protected function directIntent(string $billRef): ?array
    {
        $intent = Cache::get($this->directIntentKey($billRef));

        return is_array($intent) ? $intent : null;
    }

    protected function receiptBelongsToAnotherTransaction(
        string $receipt,
        int $transactionId,
    ): bool {
        return MpesaTransaction::query()
            ->where('mpesa_receipt', $receipt)
            ->where('id', '!=', $transactionId)
            ->exists();
    }

    protected function activateSubscription(
        User $user,
        int $days,
        string $planLabel,
    ): CarbonImmutable {
        $now = CarbonImmutable::now();

        $existingExpiry = $user->subscription_expires_at
            ? CarbonImmutable::parse($user->subscription_expires_at)
            : null;

        $existingStart = $user->subscription_started_at
            ? CarbonImmutable::parse($user->subscription_started_at)
            : null;

        $hasActiveSubscription = $existingStart
            && $existingExpiry
            && $existingStart->lte($now)
            && $existingExpiry->gt($now);

        $subscriptionStart = $hasActiveSubscription
            ? $existingStart
            : $now;

        $expiryBase = $existingExpiry && $existingExpiry->gt($now)
            ? $existingExpiry
            : $now;

        $newExpiry = $expiryBase->addDays($days);

        $user->forceFill([
            'subscription_plan' => $planLabel,
            'subscription_started_at' => $subscriptionStart,
            'subscription_expires_at' => $newExpiry,
        ])->save();

        return $newExpiry;
    }
}
