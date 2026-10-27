<?php

namespace App\Http\Controllers;

use App\Models\CoinTransaction;
use App\Services\CoinPurchaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CoinController extends Controller
{
    /**
     * Preset packages. Single source of truth on the server —
     * the frontend receives these via Inertia props.
     */
    private const PACKAGES = [
        1 => ['coins' => 50, 'price' => 50],
        2 => ['coins' => 110, 'price' => 100, 'bonus' => '+10%'],
        3 => ['coins' => 180, 'price' => 165, 'bonus' => '+9%'],
        4 => ['coins' => 280, 'price' => 250, 'bonus' => '+12%', 'popular' => true],
        5 => ['coins' => 380, 'price' => 330, 'bonus' => '+15%'],
        6 => ['coins' => 600, 'price' => 500, 'bonus' => '+20%'],
        7 => ['coins' => 1050, 'price' => 820, 'bonus' => '+28%'],
    ];

    private const BASE_RATE = 1.0;
    private const MINIMUM_COINS = 20;
    private const MAXIMUM_COINS = 1_000_000;

    public function __construct(protected CoinPurchaseService $purchases)
    {
    }

    /* =================================================================
     | READ
     | ================================================================= */

    /**
     * GET /coins — the top-up page.
     */
    public function index(Request $request): Response
    {
        $packages = collect(self::PACKAGES)
            ->map(fn(array $p, int $id) => ['id' => $id] + $p)
            ->values()
            ->all();

        $packages[] = ['id' => 8, 'coins' => 'custom', 'price' => null];

        return Inertia::render('coin/index', [
            'packages' => $packages,
            'customRate' => self::BASE_RATE,
            'minimumCoins' => self::MINIMUM_COINS,
            'billRef' => $this->purchases->billRefForUser($request->user()),
            'paybill' => (string) config('services.mpesa.shortcode'),
        ]);
    }

    /**
     * GET /coins/history — paginated ledger + summary cards.
     */
    public function history(Request $request): Response
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $transactions = $user->coinTransactions()
            ->latest()
            ->paginate(20)
            ->through(fn(CoinTransaction $tx) => [
                'id' => $tx->id,
                'type' => $tx->type,
                'status' => $tx->status,
                'coins' => $tx->coins,
                'amount_kes' => (int) $tx->amount_kes,
                'method' => $tx->method,
                'source' => $tx->source,
                'mpesa_receipt' => $tx->mpesa_receipt,
                'package_id' => $tx->package_id,
                'phone' => $tx->phone,
                'created_at' => $tx->created_at?->toIso8601String(),
                'failure_reason' => $tx->meta['failure_reason'] ?? null,
            ]);

        return Inertia::render('coin/history', [
            'transactions' => $transactions,
            'summary' => [
                'coins_balance' => (int) $user->coins,
                'total_purchased' => $user->totalCoinsPurchased(),
                'total_spent_kes' => $user->totalSpentOnCoins(),
            ],
        ]);
    }

    /**
     * GET /coins/status/{checkoutRequestId} — front-end polling.
     */
    public function status(Request $request, string $checkoutRequestId): JsonResponse
    {
        $tx = $this->purchases->findByCheckoutRequestId($checkoutRequestId);

        if (!$tx || $tx->user_id !== $request->user()->id) {
            return response()->json(['status' => 'unknown'], 404);
        }

        return response()->json([
            'status' => $tx->status,
            'coins' => $tx->coins,
            'receipt' => $tx->mpesa_receipt,
        ]);
    }

    /* =================================================================
     | WRITE
     | ================================================================= */

    /**
     * POST /coins/purchase
     *
     * The client sends `package_id` (preset) OR `coins` (custom).
     * `amount_kes` is NEVER trusted from the client — computed here.
     */
    public function purchase(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'package_id' => ['nullable', 'integer'],
            'coins' => [
                'nullable',
                'integer',
                'min:' . self::MINIMUM_COINS,
                'max:' . self::MAXIMUM_COINS,
            ],
            'method' => ['required', Rule::in(['mpesa'])],
        ]);

        /** @var \App\Models\User $user */
        $user = $request->user();

        $phone = $user->phone ?? $request->input('phone');
        if (!$phone) {
            return back()->withErrors([
                'phone' => 'Add a phone number to your account before buying coins.',
            ]);
        }

        $packageId = $data['package_id'] ? (int) $data['package_id'] : null;

        if ($packageId !== null) {
            if (!isset(self::PACKAGES[$packageId])) {
                return back()->withErrors(['purchase' => 'Unknown package.']);
            }

            $coins = self::PACKAGES[$packageId]['coins'];
            $amountKes = self::PACKAGES[$packageId]['price'];
        } else {
            if (empty($data['coins'])) {
                return back()->withErrors([
                    'coins' => 'Enter how many coins you want to buy.',
                ]);
            }

            $coins = (int) $data['coins'];
            $amountKes = $this->priceForCoins($coins);
        }

        $result = $this->purchases->startPurchase(
            $user,
            $coins,
            $amountKes,
            $packageId,
            $phone,
        );

        if (!$result['ok']) {
            return back()->withErrors(['purchase' => $result['message']]);
        }

        return back()
            ->with('success', $result['message'])
            ->with('checkout_request_id', $result['transaction']->checkout_request_id);
    }

    /**
     * POST /coins/retry/{tx}
     * Re-kick a failed purchase with the same coins/amount/package.
     */
    public function retry(Request $request, CoinTransaction $tx): RedirectResponse
    {
        abort_unless($tx->user_id === $request->user()->id, 403);

        if ($tx->status !== CoinTransaction::STATUS_FAILED) {
            return back()->withErrors([
                'purchase' => 'Only failed transactions can be retried.',
            ]);
        }

        /** @var \App\Models\User $user */
        $user = $request->user();

        $phone = $tx->phone ?? $user->phone;
        if (!$phone) {
            return back()->withErrors([
                'phone' => 'Add a phone number to your account before retrying.',
            ]);
        }

        $result = $this->purchases->startPurchase(
            $user,
            (int) $tx->coins,
            (int) $tx->amount_kes,
            $tx->package_id,
            $phone,
        );

        if (!$result['ok']) {
            return back()->withErrors(['purchase' => $result['message']]);
        }

        return back()
            ->with('success', $result['message'])
            ->with('checkout_request_id', $result['transaction']->checkout_request_id);
    }

    /* =================================================================
     | PRICING
     | ================================================================= */

    /**
     * Tiered bonus — mirrors the preset packages so custom and bundle
     * buyers pay the same at the same coin volume.
     */
    private function bonusForCoins(int $coins): float
    {
        return match (true) {
            $coins >= 1000 => 0.28,
            $coins >= 600 => 0.20,
            $coins >= 380 => 0.15,
            $coins >= 280 => 0.12,
            $coins >= 180 => 0.09,
            $coins >= 110 => 0.10,
            default => 0.0,
        };
    }

    /**
     * price = paidCoins * BASE_RATE where paidCoins = coins / (1 + bonus).
     * Rounded up so the platform never underpays by a shilling.
     */
    private function priceForCoins(int $coins): int
    {
        if ($coins <= 0) {
            return 0;
        }

        $bonus = $this->bonusForCoins($coins);
        $paidCoins = $coins / (1 + $bonus);

        return (int) ceil($paidCoins * self::BASE_RATE);
    }
}