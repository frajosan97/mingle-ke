<?php

namespace App\Http\Controllers;

use App\Models\CoinPackage;
use App\Models\CoinTransaction;
use App\Models\MpesaTransaction;
use App\Models\PointTransaction;
use App\Models\User;
use App\Services\CoinsPurchaseService;
use App\Services\MpesaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class WalletController extends Controller
{
    private const CUSTOM_RATE = 1.0;
    private const MINIMUM_COINS = 20;
    private const MAXIMUM_COINS = 1_000_000;

    public function __construct(
        private readonly CoinsPurchaseService $coinsPurchaseService,
        private readonly MpesaService $mpesa,
    ) {
    }

    /*
    |--------------------------------------------------------------------------
    | Wallet Overview
    |--------------------------------------------------------------------------
    */

    public function index(): Response
    {
        return Inertia::render('wallets/index');
    }

    public function balance(Request $request): JsonResponse
    {
        return response()->json([
            'coins' => (int) $request->user()->coins,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Coins Wallet
    |--------------------------------------------------------------------------
    */

    public function coins(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        $packages = CoinPackage::query()
            ->active()
            ->ordered()
            ->get()
            ->map(fn(CoinPackage $package) => [
                'id' => $package->id,
                'name' => $package->name,
                'coins' => $package->totalCoins(),
                'base_coins' => $package->baseCoins(),
                'bonus' => $package->bonus,
                'price' => $package->price,
                'is_popular' => $package->is_popular,
                'price_per_coin' => $package->pricePerCoin(),
            ]);

        return Inertia::render('wallets/coins', [
            'packages' => $packages,
            'customRate' => self::CUSTOM_RATE,
            'minimumCoins' => self::MINIMUM_COINS,
            'maximumCoins' => self::MAXIMUM_COINS,
            'billRef' => null,
            'paybill' => config('services.mpesa.shortcode'),
            'phoneConfigured' => filled($user->phone),
            'mpesaAvailable' => $this->mpesa->isStkConfigured(),
            'phoneSetupUrl' => route('profile.edit'),
            'checkout_request_id' => session('checkout_request_id'),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Generate C2B Bill Reference
    |--------------------------------------------------------------------------
    */

    public function generateBillRef(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'package_id' => [
                'nullable',
                'integer',
                'min:1',
                'required_without:coins',
                'prohibits:coins',
            ],

            'coins' => [
                'nullable',
                'integer',
                'min:' . self::MINIMUM_COINS,
                'max:' . self::MAXIMUM_COINS,
                'required_without:package_id',
                'prohibits:package_id',
            ],
        ]);

        if (!filled($user->phone)) {
            throw ValidationException::withMessages([
                'phone' => 'Please configure your phone number before purchasing coins.',
            ]);
        }

        if (isset($validated['package_id'])) {
            $package = CoinPackage::query()
                ->active()
                ->find($validated['package_id']);

            if (!$package) {
                throw ValidationException::withMessages([
                    'package_id' => 'The selected package is unavailable.',
                ]);
            }

            $coins = $package->totalCoins();
            $amount = (int) round((float) $package->price);

            $billRef = $this->coinsPurchaseService
                ->billRefForPackage($user, $package);

        } else {
            $coins = (int) $validated['coins'];
            $amount = $this->priceForCoins($coins);

            $billRef = $this->coinsPurchaseService
                ->billRefForCustomPurchase(
                    $user,
                    $coins,
                    $amount
                );
        }

        return response()->json([
            'success' => true,
            'bill_ref' => $billRef,
            'amount' => $amount,
            'coins' => $coins,
            'paybill' => config('services.mpesa.shortcode'),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Purchase Coins Through STK
    |--------------------------------------------------------------------------
    */

    public function purchaseCoins(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $this->ensurePurchaseRequirements($user);

        $validated = $request->validate([
            'package_id' => [
                'nullable',
                'integer',
                'min:1',
                'required_without:coins',
                'prohibits:coins',
            ],

            'coins' => [
                'nullable',
                'integer',
                'min:' . self::MINIMUM_COINS,
                'max:' . self::MAXIMUM_COINS,
                'required_without:package_id',
                'prohibits:package_id',
            ],

            'method' => [
                'required',
                'in:mpesa',
            ],
        ]);

        $packageId = $validated['package_id'] ?? null;

        if ($packageId !== null) {
            $package = CoinPackage::query()
                ->active()
                ->find($packageId);

            if (!$package) {
                throw ValidationException::withMessages([
                    'package_id' => 'The selected coin package is unavailable.',
                ]);
            }

            $coins = $package->totalCoins();
            $amountKes = (int) round((float) $package->price);
            $packageId = $package->id;

            $packageSnapshot = [
                'id' => $package->id,
                'name' => $package->name,
                'coins' => $package->totalCoins(),
                'base_coins' => $package->baseCoins(),
                'bonus' => $package->bonus,
                'price' => $package->price,
                'currency' => 'KES',
            ];
        } else {
            $coins = (int) $validated['coins'];
            $amountKes = $this->priceForCoins($coins);

            $packageId = null;
            $packageSnapshot = null;
        }

        $result = $this->coinsPurchaseService->startPurchase(
            user: $user,
            coins: $coins,
            amountKes: $amountKes,
            packageId: $packageId,
            phone: trim($user->phone),
            packageSnapshot: $packageSnapshot,
        );

        if (!($result['success'] ?? false)) {
            throw ValidationException::withMessages([
                'payment' => $result['message']
                    ?? 'Unable to initiate M-PESA payment.',
            ]);
        }

        $transaction = $result['transaction'] ?? null;

        return back()->with([
            'success' => $result['message']
                ?? 'Payment request sent. Check your phone.',

            'checkout_request_id' => $transaction?->checkout_request_id,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Transaction History
    |--------------------------------------------------------------------------
    */

    public function transactions(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        $payments = $user->mpesaTransactions()
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(fn(MpesaTransaction $transaction) => [
                'id' => $transaction->id,
                'type' => $transaction->type,
                'direction' => $transaction->direction,
                'status' => $transaction->status,
                'coins' => (int) ($transaction->coins ?? 0),
                'amount_kes' => (float) $transaction->amount,
                'method' => $transaction->meta['payment_method'] ?? 'mpesa',
                'source' => 'mpesa',
                'mpesa_receipt' => $transaction->mpesa_receipt,
                'package_id' => $transaction->package_id,
                'package' => $transaction->meta['package_snapshot'] ?? null,
                'phone' => $transaction->phone,
                'reference' => $transaction->reference,
                'checkout_request_id' => $transaction->checkout_request_id,
                'created_at' => $transaction->created_at,
                'completed_at' => $transaction->completed_at,
                'failure_reason' => $transaction->result_desc,
            ]);

        $coinLedger = $user->coinTransactions()
            ->latest()
            ->take(30)
            ->get()
            ->map(fn(CoinTransaction $transaction) => [
                'id' => $transaction->id,
                'type' => $transaction->type,
                'coins' => (int) $transaction->amount,
                'reference' => $transaction->reference,
                'description' => $transaction->description,
                'meta' => $transaction->meta,
                'created_at' => $transaction->created_at,
            ])
            ->values();

        $completedPayments = $user->mpesaTransactions()
            ->where('type', MpesaTransaction::TYPE_COINS_PURCHASE)
            ->where('status', MpesaTransaction::STATUS_COMPLETED);

        $totalPurchased = (clone $completedPayments)->sum('coins');
        $totalSpentKes = (clone $completedPayments)->sum('amount');

        $totalCoinsSpent = $user->coinTransactions()
            ->where('type', CoinTransaction::TYPE_SPEND)
            ->sum('coins');

        return Inertia::render('wallets/transactions', [
            'transactions' => $payments,
            'coinLedger' => $coinLedger,

            'summary' => [
                'coins_balance' => (int) $user->coins,
                'total_purchased' => (int) $totalPurchased,
                'total_spent_kes' => (float) $totalSpentKes,
                'total_coins_spent' => (int) $totalCoinsSpent,
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Transaction Status
    |--------------------------------------------------------------------------
    */

    public function status(
        Request $request,
        string $transaction
    ): JsonResponse {
        $checkoutRequestId = trim($transaction);

        if ($checkoutRequestId === '') {
            return response()->json([
                'message' => 'Transaction not found.',
            ], 404);
        }

        $record = $this->coinsPurchaseService
            ->findByCheckoutRequestId($checkoutRequestId);

        if (
            !$record
            || (int) $record->user_id !== (int) $request->user()->id
        ) {
            return response()->json([
                'message' => 'Transaction not found.',
            ], 404);
        }

        return response()->json([
            'id' => $record->id,
            'status' => $record->status,
            'coins' => (int) ($record->coins ?? 0),
            'amount_kes' => (float) $record->amount,
            'receipt' => $record->mpesa_receipt,
            'completed_at' => $record->completed_at,
            'failure_reason' => $record->result_desc,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Purchase Requirements
    |--------------------------------------------------------------------------
    */

    private function ensurePurchaseRequirements(User $user): void
    {
        if (!filled($user->phone)) {
            throw ValidationException::withMessages([
                'phone' => 'Please set up your phone number in your profile before purchasing coins.',
            ]);
        }

        if (!$this->mpesa->isStkConfigured()) {
            throw ValidationException::withMessages([
                'payment' => 'M-PESA payments are currently unavailable. Please try again later.',
            ]);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Custom Coin Pricing
    |--------------------------------------------------------------------------
    */

    private function priceForCoins(int $coins): int
    {
        return (int) ceil($coins * self::CUSTOM_RATE);
    }

    /*
    |--------------------------------------------------------------------------
    | Points History
    |--------------------------------------------------------------------------
    */

    public function points(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        $pointTransactions = $user->pointTransactions()
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn(PointTransaction $transaction) => [
                'id' => $transaction->id,
                'type' => $transaction->type,
                'direction' => $transaction->direction,
                'points' => (int) $transaction->points,
                'reference' => $transaction->reference,
                'description' => $transaction->description,
                'meta' => $transaction->meta,
                'created_at' => $transaction->created_at,
            ]);

        $credits = $user->pointTransactions()
            ->where('direction', PointTransaction::DIRECTION_CREDIT);

        $debits = $user->pointTransactions()
            ->where('direction', PointTransaction::DIRECTION_DEBIT);

        return Inertia::render('wallets/points', [
            'transactions' => $pointTransactions,

            'summary' => [
                'points_balance' => (int) $user->points_balance,
                'total_earned' => (int) (clone $credits)->sum('points'),
                'total_spent' => (int) (clone $debits)->sum('points'),
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Withdrawals
    |--------------------------------------------------------------------------
    */

    public function withdrawals(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        $payouts = $user->mpesaTransactions()
            ->where('type', MpesaTransaction::TYPE_WITHDRAWAL)
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(fn(MpesaTransaction $transaction) => [
                'id' => $transaction->id,
                'points' => (int) ($transaction->meta['points'] ?? 0),
                'amount_kes' => (float) $transaction->amount,
                'phone' => $transaction->phone,
                'status' => $transaction->status,
                'reference' => $transaction->reference,
                'failure_reason' => $transaction->result_desc,
                'created_at' => $transaction->created_at,
            ]);

        return Inertia::render('wallets/withdrawals', [
            'phone' => $user->phone,
            'phoneConfigured' => filled($user->phone),
            'mpesaAvailable' => $this->mpesa->isStkConfigured(),
            'paybill' => config('services.mpesa.shortcode'),
            'phoneSetupUrl' => route('profile.edit'),

            'conversionRate' => (float) config(
                'wallet.withdrawal_conversion_rate',
                1
            ),

            'minimumPoints' => (int) config(
                'wallet.minimum_withdrawal_points',
                20
            ),

            'pointsBalance' => (int) $user->points_balance,
            'payouts' => $payouts,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Request Withdrawal
    |--------------------------------------------------------------------------
    */

    public function requestWithdrawal(Request $request): RedirectResponse
    {
        throw ValidationException::withMessages([
            'withdrawal' => 'Withdrawals are not currently available.',
        ]);
    }
}
