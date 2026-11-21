<?php

namespace App\Services;

use App\Models\CoinPackage;
use App\Models\CoinTransaction;
use App\Models\MpesaTransaction;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class CoinsPurchaseService
{
    private const DIRECT_INTENT_TTL_HOURS = 24;

    /**
     * Must match the custom coin pricing in WalletController.
     */
    private const CUSTOM_RATE = 1.0;

    private const MINIMUM_CUSTOM_COINS = 20;
    private const MAXIMUM_CUSTOM_COINS = 1_000_000;

    public function __construct(
        protected MpesaService $payments,
        protected NotificationService $notifier,
        protected PointsService $points,
    ) {
    }

    /*
    |--------------------------------------------------------------------------
    | STK PURCHASE
    |--------------------------------------------------------------------------
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

        // Always use database package values for predefined packages.
        if ($packageId !== null) {
            $package = CoinPackage::query()
                ->active()
                ->findOrFail($packageId);

            $coins = $package->totalCoins();
            $amountKes = (int) round((float) $package->price);
            $packageSnapshot = $this->packageSnapshot($package);
        } else {
            // Do not trust custom purchase prices supplied by the frontend.
            if (
                $coins < self::MINIMUM_CUSTOM_COINS
                || $coins > self::MAXIMUM_CUSTOM_COINS
            ) {
                throw new \InvalidArgumentException(
                    'The custom coin quantity is outside the allowed range.'
                );
            }

            $expectedAmount = (int) ceil(
                $coins * self::CUSTOM_RATE
            );

            if ($amountKes !== $expectedAmount) {
                throw new \InvalidArgumentException(
                    'The custom coin purchase amount is invalid.'
                );
            }

            $packageSnapshot = null;
        }

        if (!$this->payments->isStkConfigured()) {
            return [
                'success' => false,
                'uncertain' => false,
                'transaction' => null,
                'transaction_id' => null,
                'message' => 'M-PESA STK Push is not configured.',
            ];
        }

        $tx = DB::transaction(function () use ($user, $coins, $amountKes, $packageId, $packageSnapshot, $phone) {
            $lockedUser = User::query()
                ->lockForUpdate()
                ->findOrFail($user->id);

            $hasUnresolved = MpesaTransaction::query()
                ->where('user_id', $lockedUser->id)
                ->where('type', MpesaTransaction::TYPE_COINS_PURCHASE)
                ->whereIn('status', [
                    MpesaTransaction::STATUS_PENDING,
                    MpesaTransaction::STATUS_PROCESSING,
                    MpesaTransaction::STATUS_UNKNOWN,
                ])
                ->exists();

            if ($hasUnresolved) {
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
                'reference' => $this->payments->generateReference(
                    'COIN',
                    $lockedUser
                ),
                'package_id' => $packageId,
                'coins' => $coins,
                'meta' => [
                    'payment_method' => 'stk',
                    'purchase_type' => $packageId !== null
                        ? 'package'
                        : 'custom',
                    'coins' => $coins,
                    'package_snapshot' => $packageSnapshot,
                ],
            ]);
        });

        if (!$tx) {
            return [
                'success' => false,
                'uncertain' => false,
                'transaction' => null,
                'transaction_id' => null,
                'message' => 'You already have a coin purchase in progress. Please wait for it to be confirmed.',
            ];
        }

        try {
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

                    'failed_at' => $result['uncertain']
                        ? null
                        : now(),

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
                    'transaction_id' => $tx->id,
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
                    'error_at' => now()->toISOString(),
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
            Log::warning(
                'Coin payment confirmation received without receipt.',
                [
                    'transaction_id' => $tx->id,
                ]
            );

            return;
        }

        try {
            $result = DB::transaction(function () use ($tx, $mpesaReceipt, $allowFailedRecovery, $paidAmount) {
                $lockedTx = MpesaTransaction::query()
                    ->lockForUpdate()
                    ->find($tx->id);

                if (
                    !$lockedTx
                    || $lockedTx->type !== MpesaTransaction::TYPE_COINS_PURCHASE
                    || $lockedTx->direction !== MpesaTransaction::DIRECTION_INBOUND
                ) {
                    return ['notify' => false];
                }

                if ($lockedTx->status === MpesaTransaction::STATUS_COMPLETED) {
                    return ['notify' => false];
                }

                if ($lockedTx->isTerminal()) {
                    if (
                        !$allowFailedRecovery
                        || $lockedTx->status !== MpesaTransaction::STATUS_FAILED
                    ) {
                        return ['notify' => false];
                    }
                }

                if (
                    $paidAmount !== null
                    && $paidAmount !== (int) round((float) $lockedTx->amount)
                ) {
                    Log::error('Coin STK callback amount mismatch.', [
                        'transaction_id' => $lockedTx->id,
                        'expected' => $lockedTx->amount,
                        'received' => $paidAmount,
                    ]);

                    return ['notify' => false];
                }

                if (
                    $this->receiptBelongsToAnotherTransaction(
                        $mpesaReceipt,
                        $lockedTx->id
                    )
                ) {
                    Log::warning(
                        'M-PESA receipt already belongs to another transaction.',
                        [
                            'receipt' => $mpesaReceipt,
                            'transaction_id' => $lockedTx->id,
                        ]
                    );

                    return ['notify' => false];
                }

                $meta = $lockedTx->meta ?? [];
                $snapshot = $meta['package_snapshot'] ?? null;

                $coins = (int) (
                    $snapshot['coins']
                    ?? $meta['coins']
                    ?? $lockedTx->coins
                    ?? 0
                );

                if ($coins < 1) {
                    throw new \RuntimeException(
                        'Unable to determine the number of coins to credit.'
                    );
                }

                $ledgerReference = 'MPESA-COIN-' . $lockedTx->id;

                $existingLedger = CoinTransaction::query()
                    ->where('reference', $ledgerReference)
                    ->first();

                if ($existingLedger) {
                    $lockedTx->update([
                        'status' => MpesaTransaction::STATUS_COMPLETED,
                        'mpesa_receipt' => $mpesaReceipt,
                        'completed_at' => $lockedTx->completed_at ?? now(),
                        'failed_at' => null,
                    ]);

                    return ['notify' => false];
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
                    'reference' => $ledgerReference,
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
                    'mpesa_receipt' => $mpesaReceipt,
                    'completed_at' => now(),
                    'failed_at' => null,

                    'meta' => array_merge($meta, [
                        'coins_credited' => $coins,
                        'coin_transaction_id' => $ledgerEntry->id,
                    ]),
                ]);

                $this->points->awardPaymentPoints($user, $lockedTx);

                return [
                    'notify' => true,
                    'phone' => $lockedTx->phone,
                    'ledger' => $ledgerEntry,
                ];
            });

            if (
                ($result['notify'] ?? false)
                && !empty($result['ledger'])
            ) {
                $this->sendPurchaseNotification(
                    (string) ($result['phone'] ?? ''),
                    $result['ledger']
                );
            }

        } catch (UniqueConstraintViolationException $e) {
            Log::warning('Duplicate coin STK confirmation prevented.', [
                'transaction_id' => $tx->id,
                'receipt' => $mpesaReceipt,
            ]);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | FAILURE HANDLING
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
                || $lockedTx->type !== MpesaTransaction::TYPE_COINS_PURCHASE
                || $lockedTx->isTerminal()
            ) {
                return;
            }

            $lockedTx->update([
                'status' => MpesaTransaction::STATUS_FAILED,
                'failed_at' => now(),
                'result_desc' => $reason,

                'meta' => array_merge($lockedTx->meta ?? [], [
                    'failure_reason' => $reason,
                    'failed_at' => now()->toISOString(),
                ]),
            ]);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | TRANSACTION LOOKUPS
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

    public function findByBillRef(string $billRef): ?MpesaTransaction
    {
        return MpesaTransaction::query()
            ->where('reference', strtoupper(trim($billRef)))
            ->where('type', MpesaTransaction::TYPE_COINS_PURCHASE)
            ->first();
    }

    /*
    |--------------------------------------------------------------------------
    | C2B REFERENCE GENERATION - PACKAGE
    |--------------------------------------------------------------------------
    */

    /**
     * Generate a temporary C2B reference for a predefined package.
     *
     * Format:
     * C-{USER_ID}-{PACKAGE_ID}-{RANDOM}
     */
    public function billRefForPackage(
        User $user,
        CoinPackage|int $package,
    ): string {
        $package = $package instanceof CoinPackage
            ? CoinPackage::query()->active()->findOrFail($package->id)
            : CoinPackage::query()->active()->findOrFail($package);

        $amount = (int) round((float) $package->price);
        $coins = (int) $package->totalCoins();

        if ($amount < 1 || $coins < 1) {
            throw new \InvalidArgumentException(
                'Invalid coin package.'
            );
        }

        $snapshot = $this->packageSnapshot($package);

        return $this->createDirectIntent(
            $user,
            $amount,
            [
                'purchase_type' => 'package',
                'package_id' => $package->id,
                'coins' => $coins,
                'package_snapshot' => $snapshot,
            ]
        );
    }

    /*
    |--------------------------------------------------------------------------
    | C2B REFERENCE GENERATION - CUSTOM
    |--------------------------------------------------------------------------
    */

    /**
     * Generate a temporary C2B reference for a custom coin purchase.
     *
     * Format:
     * C-{USER_ID}-0-{RANDOM}
     *
     * A package ID of zero identifies a custom purchase.
     */
    public function billRefForCustomPurchase(
        User $user,
        int $coins,
        int $amountKes,
    ): string {
        if (
            $coins < self::MINIMUM_CUSTOM_COINS
            || $coins > self::MAXIMUM_CUSTOM_COINS
        ) {
            throw new \InvalidArgumentException(
                'Custom coin quantity is outside the allowed range.'
            );
        }

        $expectedAmount = (int) ceil(
            $coins * self::CUSTOM_RATE
        );

        if ($amountKes !== $expectedAmount) {
            throw new \InvalidArgumentException(
                'Invalid custom coin purchase amount.'
            );
        }

        return $this->createDirectIntent(
            $user,
            $amountKes,
            [
                'purchase_type' => 'custom',
                'package_id' => null,
                'coins' => $coins,
                'package_snapshot' => null,
            ]
        );
    }

    /*
    |--------------------------------------------------------------------------
    | SHARED C2B INTENT CREATION
    |--------------------------------------------------------------------------
    */

    protected function createDirectIntent(
        User $user,
        int $amountKes,
        array $purchase,
    ): string {
        if ($amountKes < 1) {
            throw new \InvalidArgumentException(
                'Payment amount must be greater than zero.'
            );
        }

        do {
            $packageReference = (int) (
                $purchase['package_id'] ?? 0
            );

            $reference = 'C-'
                . $user->id
                . '-'
                . $packageReference
                . '-'
                . Str::upper(Str::random(7));

            $stored = Cache::add(
                $this->directIntentKey($reference),
                array_merge($purchase, [
                    'user_id' => $user->id,
                    'amount' => $amountKes,
                    'created_at' => now()->toISOString(),
                ]),
                now()->addHours(self::DIRECT_INTENT_TTL_HOURS)
            );

        } while (!$stored);

        return $reference;
    }

    /**
     * Explicitly prevent the old generic-reference implementation.
     */
    public function billRefForUser(User $user): string
    {
        throw new \InvalidArgumentException(
            'A coin package or custom coin quantity is required. Use billRefForPackage() or billRefForCustomPurchase().'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | C2B VALIDATION
    |--------------------------------------------------------------------------
    */

    /**
     * Validate a C2B payment intent.
     *
     * This method does not create a transaction or credit coins.
     */
    public function validateDirectPayment(
        string $billRef,
        int $amountKes,
    ): bool {
        $intent = $this->directIntent($billRef);

        if (!$intent || $amountKes < 1) {
            return false;
        }

        if ((int) ($intent['amount'] ?? 0) !== $amountKes) {
            return false;
        }

        if (
            !isset($intent['user_id'])
            || !User::query()->whereKey($intent['user_id'])->exists()
        ) {
            return false;
        }

        $coins = (int) ($intent['coins'] ?? 0);

        if ($coins < 1) {
            return false;
        }

        $purchaseType = $intent['purchase_type'] ?? null;

        if ($purchaseType === 'custom') {
            if (
                $coins < self::MINIMUM_CUSTOM_COINS
                || $coins > self::MAXIMUM_CUSTOM_COINS
            ) {
                return false;
            }

            return $amountKes === (int) ceil(
                $coins * self::CUSTOM_RATE
            );
        }

        if ($purchaseType === 'package') {
            $packageId = (int) ($intent['package_id'] ?? 0);

            return $packageId > 0
                && $coins === (int) (
                    $intent['package_snapshot']['coins'] ?? 0
                )
                && $amountKes === (int) (
                    $intent['package_snapshot']['price'] ?? 0
                );
        }

        return false;
    }

    /*
    |--------------------------------------------------------------------------
    | C2B CONFIRMATION
    |--------------------------------------------------------------------------
    */

    /**
     * Process a successful C2B confirmation.
     *
     * This method:
     * - Checks the payment intent.
     * - Prevents duplicate receipts.
     * - Prevents duplicate reference credits.
     * - Creates the completed M-PESA transaction.
     * - Credits the user's coins.
     * - Creates the coin ledger entry.
     * - Awards points.
     * - Sends a notification.
     */
    public function confirmDirectPayment(
        string $billRef,
        string $transId,
        int $amountKes,
        string $phone,
    ): ?MpesaTransaction {
        $billRef = strtoupper(trim($billRef));
        $transId = strtoupper(trim($transId));
        $phone = trim($phone);

        if (
            $billRef === ''
            || $transId === ''
            || $amountKes < 1
        ) {
            return null;
        }

        // First handle a genuine retry of an already completed callback.
        $alreadyProcessed = MpesaTransaction::query()
            ->where('mpesa_receipt', $transId)
            ->first();

        if ($alreadyProcessed) {
            if (
                $alreadyProcessed->type === MpesaTransaction::TYPE_COINS_PURCHASE
                && strtoupper((string) $alreadyProcessed->reference) === $billRef
            ) {
                return $alreadyProcessed;
            }

            Log::warning('C2B receipt is already assigned to another transaction.', [
                'receipt' => $transId,
                'bill_ref' => $billRef,
            ]);

            return null;
        }

        $intent = $this->directIntent($billRef);

        if (
            !$intent
            || !$this->validateDirectPayment($billRef, $amountKes)
        ) {
            Log::warning('Rejected C2B coin confirmation.', [
                'bill_ref' => $billRef,
                'trans_id' => $transId,
                'amount' => $amountKes,
            ]);

            return null;
        }

        try {
            $result = DB::transaction(function () use ($billRef, $transId, $amountKes, $phone, $intent) {
                // Serialize callbacks for the same user's wallet.
                $user = User::query()
                    ->lockForUpdate()
                    ->find($intent['user_id']);

                if (!$user) {
                    return [
                        'transaction' => null,
                        'notify' => false,
                    ];
                }

                // Check receipt again inside the transaction.
                $existingReceipt = MpesaTransaction::query()
                    ->where('mpesa_receipt', $transId)
                    ->first();

                if ($existingReceipt) {
                    if (
                        $existingReceipt->type === MpesaTransaction::TYPE_COINS_PURCHASE
                        && strtoupper((string) $existingReceipt->reference) === $billRef
                    ) {
                        return [
                            'transaction' => $existingReceipt,
                            'notify' => false,
                        ];
                    }

                    return [
                        'transaction' => null,
                        'notify' => false,
                    ];
                }

                // A bill reference must never credit coins twice.
                $existingReference = MpesaTransaction::query()
                    ->where('reference', $billRef)
                    ->where('type', MpesaTransaction::TYPE_COINS_PURCHASE)
                    ->first();

                if ($existingReference) {
                    return [
                        'transaction' => null,
                        'notify' => false,
                    ];
                }

                $coins = (int) $intent['coins'];
                $packageId = $intent['package_id'] ?? null;
                $snapshot = $intent['package_snapshot'] ?? null;

                if ($coins < 1) {
                    return [
                        'transaction' => null,
                        'notify' => false,
                    ];
                }

                // Recheck the amount and purchase intent.
                if ((int) $intent['amount'] !== $amountKes) {
                    return [
                        'transaction' => null,
                        'notify' => false,
                    ];
                }

                $tx = MpesaTransaction::create([
                    'user_id' => $user->id,
                    'type' => MpesaTransaction::TYPE_COINS_PURCHASE,
                    'direction' => MpesaTransaction::DIRECTION_INBOUND,
                    'status' => MpesaTransaction::STATUS_COMPLETED,
                    'amount' => $amountKes,
                    'currency' => 'KES',
                    'phone' => $phone,
                    'reference' => $billRef,
                    'bill_ref_number' => $billRef,
                    'mpesa_receipt' => $transId,
                    'trans_id' => $transId,
                    'package_id' => $packageId,
                    'coins' => $coins,
                    'completed_at' => now(),

                    'meta' => [
                        'payment_method' => 'c2b',
                        'purchase_type' => $intent['purchase_type'],
                        'coins' => $coins,
                        'package_snapshot' => $snapshot,
                    ],
                ]);

                // Credit wallet.
                $user->increment('coins', $coins);
                $user->refresh();

                // Create immutable purchase ledger entry.
                $ledgerEntry = CoinTransaction::create([
                    'user_id' => $user->id,
                    'type' => CoinTransaction::TYPE_PURCHASE,
                    'amount' => $coins,
                    'balance_after' => $user->coins,
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
                    'meta' => array_merge($tx->meta ?? [], [
                        'coins_credited' => $coins,
                        'coin_transaction_id' => $ledgerEntry->id,
                    ]),
                ]);

                // Award points within the same database transaction.
                $this->points->awardPaymentPoints($user, $tx);

                return [
                    'transaction' => $tx,
                    'notify' => true,
                    'phone' => $phone,
                    'ledger' => $ledgerEntry,
                ];
            });

            if (
                ($result['notify'] ?? false)
                && !empty($result['ledger'])
            ) {
                $this->sendPurchaseNotification(
                    (string) ($result['phone'] ?? ''),
                    $result['ledger']
                );
            }

            if (!empty($result['transaction'])) {
                Cache::forget($this->directIntentKey($billRef));
            }

            return $result['transaction'] ?? null;

        } catch (UniqueConstraintViolationException $e) {
            // A concurrent callback may have created the transaction first.
            $existing = MpesaTransaction::query()
                ->where('mpesa_receipt', $transId)
                ->where('reference', $billRef)
                ->where('type', MpesaTransaction::TYPE_COINS_PURCHASE)
                ->first();

            if ($existing) {
                Cache::forget($this->directIntentKey($billRef));
                return $existing;
            }

            Log::warning('C2B duplicate transaction prevented by database constraint.', [
                'receipt' => $transId,
                'bill_ref' => $billRef,
            ]);

            return null;

        } catch (Throwable $e) {
            Log::error('C2B coin payment processing failed.', [
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

    public function reconcileStkQuery(
        MpesaTransaction $tx
    ): array {
        $tx = $tx->fresh();

        if (
            !$tx
            || $tx->type !== MpesaTransaction::TYPE_COINS_PURCHASE
        ) {
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
            $result = $this->payments->queryStk(
                $tx->checkout_request_id
            );

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

                $this->confirmPayment(
                    $tx,
                    (string) $result['receipt']
                );

                $fresh = $tx->fresh();

                return [
                    'success' => $fresh?->status === MpesaTransaction::STATUS_COMPLETED,
                    'status' => $fresh?->status,
                    'message' => 'Payment confirmation processed.',
                ];
            }

            if (
                $result['result_code'] !== null
                && (string) $result['result_code'] !== ''
            ) {
                $this->failPayment(
                    $tx,
                    $result['result_desc'] ?? 'M-PESA payment failed.'
                );

                return [
                    'success' => false,
                    'status' => MpesaTransaction::STATUS_FAILED,
                    'message' => $result['result_desc'] ?? 'M-PESA payment failed.',
                ];
            }

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

    /*
    |--------------------------------------------------------------------------
    | INTERNAL HELPERS
    |--------------------------------------------------------------------------
    */

    protected function directIntentKey(string $billRef): string
    {
        return 'mpesa:c2b:coins:' . hash(
            'sha256',
            strtoupper(trim($billRef))
        );
    }

    protected function directIntent(string $billRef): ?array
    {
        $intent = Cache::get(
            $this->directIntentKey($billRef)
        );

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

    protected function packageSnapshot(
        CoinPackage $package
    ): array {
        return [
            'id' => $package->id,
            'name' => $package->name,
            'coins' => $package->totalCoins(),
            'base_coins' => $package->baseCoins(),
            'bonus' => $package->bonus,
            'price' => (int) round((float) $package->price),
            'currency' => 'KES',
        ];
    }

    protected function sendPurchaseNotification(
        string $phone,
        CoinTransaction $ledgerEntry,
    ): void {
        try {
            if ($phone !== '') {
                $this->notifier->coinsPurchaseCompleted(
                    $phone,
                    $ledgerEntry
                );
            }
        } catch (Throwable $e) {
            Log::warning('Coins purchase notification failed.', [
                'ledger_id' => $ledgerEntry->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
