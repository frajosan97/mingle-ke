<?php

namespace App\Services;

use App\Models\County;
use App\Models\Town;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class EscortSearchService
{
    public const PER_PAGE = 20;

    /** Default ordering — replaces the old client-controlled `sort`. */
    private const DEFAULT_SORT = 'distance';

    public function __construct(private readonly GeoService $geo)
    {
    }

    public function buildQuery(array $filters, float $lat, float $lng, ?User $viewer): Builder
    {
        $query = User::query()
            ->with('profile')
            ->whereNotNull('users.lat')
            ->whereNotNull('users.lng');

        $query->where(function (Builder $q) {
            $q->whereDoesntHave('profile')
                ->orWhereHas('profile', fn(Builder $q2) => $q2
                    ->where('is_approved', true)
                    ->whereNull('deleted_at'));
        });

        if ($viewer) {
            $query->where('users.id', '!=', $viewer->id);
            $this->excludeBlocked($query, $viewer);
        }

        // ── Radius (bounding box) ───────────────────────────────────
        if (($filters['radius'] ?? null) !== null) {
            $d = $this->geo->boundingBoxDeltas($lat, $filters['radius']);
            $query->whereBetween('users.lat', [$lat - $d['lat'], $lat + $d['lat']])
                ->whereBetween('users.lng', [$lng - $d['lng'], $lng + $d['lng']]);
        }

        // ── Location (names → FK ids on users) ──────────────────────
        $countyId = null;

        if (($filters['county'] ?? null) !== null) {
            $countyId = County::where('name', $filters['county'])->value('id');

            if ($countyId !== null) {
                $query->where('users.county_id', $countyId);
            } else {
                // Unknown county → return no results rather than ignore the filter.
                $query->whereRaw('1 = 0');
            }
        }

        if (($filters['town'] ?? null) !== null) {
            $townId = Town::query()
                ->where('name', $filters['town'])
                ->when($countyId !== null, fn(Builder $q) => $q->where('county_id', $countyId))
                ->value('id');

            if ($townId !== null) {
                $query->where('users.town_id', $townId);
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        // ── Demographics (on users) ─────────────────────────────────
        if (($filters['age_min'] ?? null) !== null)
            $query->where('users.age', '>=', $filters['age_min']);
        if (($filters['age_max'] ?? null) !== null)
            $query->where('users.age', '<=', $filters['age_max']);
        if (($filters['gender'] ?? null) !== null)
            $query->where('users.gender', $filters['gender']);

        // ── Tier (on users) ─────────────────────────────────────────
        if (($filters['tier'] ?? null) !== null)
            $query->where('users.tier', $filters['tier']);

        // ── Profile-scoped filters ──────────────────────────────────
        $this->applyProfileFilters($query, $filters);

        return $query;
    }

    public function paginateAnyDistance(Builder $query, float $lat, float $lng): LengthAwarePaginator
    {
        // No caller-supplied sort — fixed default.
        $query->orderByDesc('users.last_active_at');

        $query->leftJoin('user_profiles', 'user_profiles.user_id', '=', 'users.id')
            ->select('users.*');

        $paginator = $query->paginate(self::PER_PAGE)->withQueryString();
        $paginator->getCollection()->transform(fn(User $u) => $this->appendDistance($u, $lat, $lng));

        return $paginator;
    }

    /**
     * @return array{items: \Illuminate\Support\Collection, page: int, last_page: int, total: int, from: ?int, to: ?int}
     */
    public function paginateWithinRadius(Builder $query, float $lat, float $lng, float $radius, int $page): array
    {
        $profiles = $query->limit(500)->get()
            ->map(fn(User $u) => $this->appendDistance($u, $lat, $lng))
            ->filter(fn(User $u) => $u->distance_km <= $radius)
            ->sortBy(fn(User $u) => $u->distance_km) // closest first
            ->values();

        $total = $profiles->count();
        $lastPage = max(1, (int) ceil($total / self::PER_PAGE));
        $page = min(max(1, $page), $lastPage);

        return [
            'items' => $profiles->slice(($page - 1) * self::PER_PAGE, self::PER_PAGE)->values(),
            'page' => $page,
            'last_page' => $lastPage,
            'total' => $total,
            'from' => $total ? ($page - 1) * self::PER_PAGE + 1 : null,
            'to' => $total ? min($page * self::PER_PAGE, $total) : null,
        ];
    }

    public function buildLinks(int $current, int $last): array
    {
        $links = [['url' => $current > 1 ? '?page=' . ($current - 1) : null, 'label' => '&laquo; Previous', 'active' => false]];
        for ($i = 1; $i <= $last; $i++) {
            $links[] = ['url' => '?page=' . $i, 'label' => (string) $i, 'active' => $i === $current];
        }
        $links[] = ['url' => $current < $last ? '?page=' . ($current + 1) : null, 'label' => 'Next &raquo;', 'active' => false];

        return $links;
    }

    public function appendDistance(User $user, float $lat, float $lng): User
    {
        $user->distance_km = $this->geo->haversineKm($lat, $lng, (float) $user->lat, (float) $user->lng);

        return $user;
    }

    // ------------------------------------------------------------------ //

    private function applyProfileFilters(Builder $query, array $filters): void
    {
        $profileFilters = array_filter([
            'ethnicity' => $filters['ethnicity'] ?? null,
            'body_type' => $filters['body_type'] ?? null,
            'incall' => $filters['incall'] ?? false,
            'outcall' => $filters['outcall'] ?? false,
        ]);

        $has = count($profileFilters) > 0 || ($filters['service'] ?? null);

        if (!$has) {
            return;
        }

        $query->whereHas('profile', function (Builder $q) use ($filters, $profileFilters) {
            foreach ($profileFilters as $col => $val) {
                $q->where($col, $val);
            }
            if ($filters['service'] ?? null) {
                $q->whereJsonContains('services', $filters['service']);
            }
        });
    }

    private function excludeBlocked(Builder $query, User $user): void
    {
        $blockedIds = DB::table('user_blocks')
            ->where('blocker_id', $user->id)->pluck('blocked_id')
            ->merge(DB::table('user_blocks')->where('blocked_id', $user->id)->pluck('blocker_id'))
            ->unique()->values()->all();

        if (!empty($blockedIds)) {
            $query->whereNotIn('users.id', $blockedIds);
        }
    }
}