<?php

namespace App\Services;

use App\Http\Resources\ProfileCardResource;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Support\Collection;

class HomeFeedService
{
    private const CARD_LIMIT = 8;

    /**
     * @return array{premium: array, regular: array, stats: array}
     */
    public function payload(): array
    {
        [$premium, $regular] = $this->profiles();

        return [
            'premium' => $premium,
            'regular' => $regular,
            'stats' => $this->stats(),
        ];
    }

    /**
     * @return array{0: array, 1: array}
     */
    private function profiles(): array
    {
        $premium = $this->byTier('premium');
        $regular = $this->byTier('regular');

        if (!empty($premium) || !empty($regular)) {
            return [$premium, $regular];
        }

        return $this->fallbackSplit();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function byTier(string $tier): array
    {
        /** @var Collection<int, UserProfile> $profiles */
        $profiles = UserProfile::query()
            ->with('user.profile')
            ->approved()
            ->available()
            ->whereHas('user', fn($q) => $q->where('tier', $tier))
            ->when($tier === 'premium', fn($q) => $q->orderByDesc('is_featured'))
            ->orderByDesc('rating_avg')
            ->limit(self::CARD_LIMIT)
            ->get();

        return $this->toCards($profiles);
    }

    /**
     * Fresh DB / both tiers empty: pull a combined pool and split in memory.
     * Keeps the `available()` constraint so we never surface unavailable profiles.
     *
     * @return array{0: array, 1: array}
     */
    private function fallbackSplit(): array
    {
        /** @var Collection<int, UserProfile> $all */
        $all = UserProfile::query()
            ->with('user.profile')
            ->approved()
            ->available()
            ->orderByDesc('rating_avg')
            ->limit(self::CARD_LIMIT * 2)
            ->get();

        return [
            $this->toCards($all->filter(fn(UserProfile $p) => $p->user?->tier === 'premium')),
            $this->toCards($all->reject(fn(UserProfile $p) => $p->user?->tier === 'premium')),
        ];
    }

    /**
     * @param  Collection<int, UserProfile>  $profiles
     * @return array<int, array<string, mixed>>
     */
    private function toCards(Collection $profiles): array
    {
        return $profiles
            ->take(self::CARD_LIMIT)
            ->map(fn(UserProfile $p) => (new ProfileCardResource($p->user))->resolve())
            ->values()
            ->all();
    }

    // ---------------------------------------------------------------
    // Stats
    // ---------------------------------------------------------------

    /**
     * @return array<int, array{value: string, label: string}>
     */
    private function stats(): array
    {
        $escortStats = UserProfile::approved()
            ->selectRaw('COUNT(*) AS total')
            ->selectRaw('AVG(rating_avg) AS avg_rating')
            ->selectRaw(
                'SUM(CASE WHEN EXISTS (SELECT 1 FROM users WHERE users.id = user_profiles.user_id AND users.is_verified = 1) THEN 1 ELSE 0 END) AS verified'
            )
            ->first();

        $escorts = (int) ($escortStats->total ?? 0);
        $verified = (int) ($escortStats->verified ?? 0);
        $avgRating = (float) ($escortStats->avg_rating ?? 0);

        $members = User::count();

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