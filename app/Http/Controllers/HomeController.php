<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProfileCardResource;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(Request $request): Response
    {
        // 1. Premium: Use relationship eager loading, no manual relation setting
        $premium = UserProfile::query()
            ->with('user.profile') // loads user, and the profile relation on the user
            ->approved()
            ->available()
            ->whereHas('user', fn($q) => $q->where('tier', 'premium'))
            ->orderByDesc('is_featured')
            ->orderByDesc('rating_avg')
            ->limit(8)
            ->get()
            ->map(fn(UserProfile $p) => (new ProfileCardResource($p->user))->resolve())
            ->all();

        // 2. Regular
        $regular = UserProfile::query()
            ->with('user.profile')
            ->approved()
            ->available()
            ->whereHas('user', fn($q) => $q->where('tier', 'regular'))
            ->orderByDesc('rating_avg')
            ->limit(8)
            ->get()
            ->map(fn(UserProfile $p) => (new ProfileCardResource($p->user))->resolve())
            ->all();

        // 3. Fallback for a fresh DB or if one tier is empty
        if (empty($premium) && empty($regular)) {
            $all = UserProfile::query()
                ->with('user.profile')
                ->approved()
                ->orderByDesc('rating_avg')
                ->limit(16)
                ->get();

            $premium = $all
                ->filter(fn(UserProfile $p) => $p->user?->tier === 'premium')
                ->take(8)
                ->map(fn(UserProfile $p) => (new ProfileCardResource($p->user))->resolve())
                ->values()
                ->all();

            $regular = $all
                ->reject(fn(UserProfile $p) => $p->user?->tier === 'premium')
                ->take(8)
                ->map(fn(UserProfile $p) => (new ProfileCardResource($p->user))->resolve())
                ->values()
                ->all();
        }

        return Inertia::render('welcome', [
            'premium' => $premium,
            'regular' => $regular,
            'stats' => $this->stats(),
        ]);
    }

    private function stats(): array
    {
        $members = User::count();
        $escorts = UserProfile::approved()->count();
        $verified = UserProfile::approved()
            ->whereHas('user', fn($q) => $q->where('is_verified', true))
            ->count();
        $avgRating = (float) (UserProfile::approved()->avg('rating_avg') ?? 0);

        return [
            ['value' => $this->fmt($members), 'label' => 'Members'],
            ['value' => number_format($avgRating, 1) . '★', 'label' => 'Rating'],
            [
                'value' => $escorts > 0 ? round($verified / $escorts * 100) . '%' : '0%',
                'label' => 'Verified',
            ],
            ['value' => '24/7', 'label' => 'Support'],
        ];
    }

    private function fmt(int $n): string
    {
        return $n >= 1000
            ? rtrim(rtrim(number_format($n / 1000, 1), '0'), '.') . 'K+'
            : (string) $n;
    }
}