<?php

namespace App\Http\Controllers;

use App\Models\CoinTransaction;
use App\Models\MpesaTransaction;
use App\Models\PointTransaction;
use App\Models\User;
use App\Services\CoinsService;
use App\Services\MpesaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class WalletController extends Controller
{
    private const PACKAGES = [
        ['id' => 1, 'coins' => 50, 'price' => 50, 'bonus' => 0, 'popular' => false],
        ['id' => 2, 'coins' => 110, 'price' => 100, 'bonus' => 10, 'popular' => false],
        ['id' => 3, 'coins' => 180, 'price' => 165, 'bonus' => 9, 'popular' => false],
        ['id' => 4, 'coins' => 280, 'price' => 250, 'bonus' => 12, 'popular' => true],
        ['id' => 5, 'coins' => 380, 'price' => 330, 'bonus' => 15, 'popular' => false],
        ['id' => 6, 'coins' => 600, 'price' => 500, 'bonus' => 20, 'popular' => false],
        ['id' => 7, 'coins' => 1050, 'price' => 820, 'bonus' => 28, 'popular' => false],
    ];

    private const BASE_RATE = 1.0;
    private const MINIMUM_COINS = 20;
    private const MAXIMUM_COINS = 1_000_000;

    public function __construct(
        private readonly CoinsService $coinsService,
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
        $user = $request->user();

        return Inertia::render('wallets/coins', [
            'packages' => self::PACKAGES,
            'customRate' => self::BASE_RATE,
            'minimumCoins' => self::MINIMUM_COINS,
            'maximumCoins' => self::MAXIMUM_COINS,
            'billRef' => $this->coinsService->billRefForUser($user),
            'paybill' => config('services.mpesa.shortcode'),
            'phoneConfigured' => filled($user->phone),
            'mpesaAvailable' => $this->mpesa->isStkConfigured(),
            'phoneSetupUrl' => route('profile.edit'),
            'checkout_request_id' => session('checkout_request_id'),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Purchase Coins
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

        $packageId = isset($validated['package_id'])
            ? (int) $validated['package_id']
            : null;

        if ($packageId !== null) {
            $package = collect(self::PACKAGES)
                ->firstWhere('id', $packageId);

            if (!$package) {
                throw ValidationException::withMessages([
                    'package_id' => 'The selected coin package is invalid.',
                ]);
            }

            $coins = (int) $package['coins'];
            $amountKes = (int) $package['price'];
        } else {
            $coins = (int) $validated['coins'];
            $amountKes = $this->priceForCoins($coins);
        }

        $result = $this->coinsService->startPurchase(
            user: $user,
            coins: $coins,
            amountKes: $amountKes,
            packageId: $packageId,
            phone: trim((string) $user->phone),
        );

        if (!($result['success'] ?? false)) {
            throw ValidationException::withMessages([
                'payment' => $result['message'] ?? 'Unable to initiate M-PESA payment.',
            ]);
        }

        $transaction = $result['transaction'] ?? null;

        return back()->with([
            'success' => $result['message'] ?? 'Payment request sent. Check your phone.',
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
            ->where('type', MpesaTransaction::TYPE_COINS_PURCHASE)
            ->latest('created_at')
            ->paginate(20)
            ->through(fn(MpesaTransaction $transaction) => [
                'id' => $transaction->id,
                'type' => $transaction->type,
                'direction' => $transaction->direction,
                'status' => $transaction->status,
                'coins' => (int) ($transaction->coins ?? 0),
                'amount_kes' => (float) $transaction->amount,
                'method' => 'mpesa',
                'source' => 'mpesa',
                'mpesa_receipt' => $transaction->mpesa_receipt,
                'package_id' => $transaction->package_id,
                'phone' => $transaction->phone,
                'reference' => $transaction->reference,
                'checkout_request_id' => $transaction->checkout_request_id,
                'created_at' => $transaction->created_at,
                'completed_at' => $transaction->completed_at,
                'failure_reason' => $transaction->result_desc,
            ]);

        $coinLedger = $user->coinTransactions()
            ->latest('created_at')
            ->take(30)
            ->get()
            ->map(fn(CoinTransaction $transaction) => [
                'id' => $transaction->id,
                'type' => $transaction->type,
                'coins' => (int) $transaction->coins,
                'reference' => $transaction->reference,
                'description' => $transaction->description,
                'meta' => $transaction->meta,
                'created_at' => $transaction->created_at,
            ]);

        $completedPayments = $user->mpesaTransactions()
            ->where('type', MpesaTransaction::TYPE_COINS_PURCHASE)
            ->where('status', MpesaTransaction::STATUS_COMPLETED);

        return Inertia::render('wallets/transactions', [
            'transactions' => $payments,
            'coinLedger' => $coinLedger,
            'summary' => [
                'coins_balance' => (int) $user->coins,
                'total_purchased' => (int) (clone $completedPayments)
                    ->sum('coins'),
                'total_spent_kes' => (float) (clone $completedPayments)
                    ->sum('amount'),
                'total_coins_spent' => (int) $user->coinTransactions()
                    ->where('type', CoinTransaction::TYPE_SPEND)
                    ->sum('coins'),
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
        $record = $this->coinsService->findByCheckoutRequestId($transaction);

        if (
            !$record ||
            (int) $record->user_id !== (int) $request->user()->id
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
    | Retry Failed Payment
    |--------------------------------------------------------------------------
    */

    public function retry(
        Request $request,
        MpesaTransaction $transaction
    ): RedirectResponse {
        /** @var User $user */
        $user = $request->user();

        abort_unless(
            (int) $transaction->user_id === (int) $user->id,
            403
        );

        if ($transaction->type !== MpesaTransaction::TYPE_COINS_PURCHASE) {
            throw ValidationException::withMessages([
                'payment' => 'Only coin purchases can be retried.',
            ]);
        }

        if ($transaction->status !== MpesaTransaction::STATUS_FAILED) {
            throw ValidationException::withMessages([
                'payment' => 'Only failed transactions can be retried.',
            ]);
        }

        $this->ensurePurchaseRequirements($user);

        $result = $this->coinsService->startPurchase(
            user: $user,
            coins: (int) $transaction->coins,
            amountKes: (int) $transaction->amount,
            packageId: $transaction->package_id,
            phone: trim((string) $user->phone),
        );

        if (!($result['success'] ?? false)) {
            throw ValidationException::withMessages([
                'payment' => $result['message'] ?? 'Unable to retry M-PESA payment.',
            ]);
        }

        $newTransaction = $result['transaction'] ?? null;

        return back()->with([
            'success' => $result['message'] ?? 'Payment request sent.',
            'checkout_request_id' => $newTransaction?->checkout_request_id,
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
                'payment' => 'M-PESA payments are currently locked. Please try again later.',
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
        return (int) ceil($coins * self::BASE_RATE);
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
            ->latest('created_at')
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
                'total_earned' => (int) (clone $credits)
                    ->sum('points'),
                'total_spent' => (int) (clone $debits)
                    ->sum('points'),
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
            ->latest('created_at')
            ->paginate(10)
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
            'conversionRate' => (float) config('wallet.withdrawal_conversion_rate', 1),
            'minimumPoints' => (int) config('wallet.minimum_withdrawal_points', 20),
            'pointsBalance' => (int) $user->points_balance,
            'payouts' => $payouts,
        ]);
    }

    public function requestWithdrawal(Request $request): RedirectResponse
    {
        throw ValidationException::withMessages([
            'withdrawal' => 'Withdrawals are not currently available.',
        ]);
    }
}
