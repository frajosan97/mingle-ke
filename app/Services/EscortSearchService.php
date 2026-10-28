<?php

namespace App\Services;

use App\Models\County;
use App\Models\Town;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Support\Facades\DB;
use Illuminate\Pagination\LengthAwarePaginator as Paginator;

class EscortSearchService
{
    public const PER_PAGE = 20;

    /** Earth radius in km. */
    private const EARTH_RADIUS_KM = 6371.0;

    /**
     * Hard cap on rows fetched in the "within radius" path when the DB
     * cannot compute distance natively. Guards against pathological queries.
     */
    private const MAX_RADIUS_CANDIDATES = 5000;

    public function __construct(private readonly GeoService $geo)
    {
    }

    public function getDiscoverResults(
        array $filters,
        float $lat,
        float $lng,
        ?User $viewer,
        int $page = 1
    ): array {
        $query = $this->buildQuery($filters, $lat, $lng, $viewer);

        $paginator = ($filters['radius'] ?? null) === null
            ? $this->paginateAnyDistance($query, $lat, $lng, $page)
            : $this->paginateWithinRadius($query, $lat, $lng, (float) $filters['radius'], $page);

        return $this->formatPaginated($paginator, $lat, $lng);
    }

    public function buildQuery(
        array $filters,
        float $lat,
        float $lng,
        ?User $viewer
    ): EloquentBuilder {
        $query = User::query()
            ->with('profile')
            ->whereNotNull('users.lat')
            ->whereNotNull('users.lng');

        $this->filterByProfileStatus($query);

        if ($viewer) {
            $query->where('users.id', '!=', $viewer->id);
            $this->excludeBlocked($query, $viewer);
        }

        $this->applyRadiusFilter($query, $filters, $lat, $lng);
        $countyId = $this->applyCountyFilter($query, $filters);
        $this->applyTownFilter($query, $filters, $countyId);
        $this->applyDemographicsFilter($query, $filters);
        $this->applyTierFilter($query, $filters);
        $this->applyProfileFilters($query, $filters);

        return $query;
    }

    /**
     * "Any distance" path: premium first, then most-recently active.
     * Distance is not a sort key here (no radius filter was given),
     * but is still attached to each returned model for display.
     */
    public function paginateAnyDistance(
        EloquentBuilder $query,
        float $lat,
        float $lng,
        int $page = 1
    ): LengthAwarePaginator {
        $query->leftJoin('user_profiles', 'user_profiles.user_id', '=', 'users.id')
            ->select('users.*')
            ->orderByRaw($this->priorityOrderSql())       // premium=0, regular=1, other=2
            ->orderByDesc('users.last_active_at')
            ->orderBy('users.id');                         // stable tie-breaker

        return $query->paginate(self::PER_PAGE, ['*'], 'page', $page)->withQueryString();
    }

    /**
     * "Within radius" path: premium first, then closest within each tier,
     * then most-recently active, then id. Paginated by the DB — never
     * loads the full result set into memory.
     */
    public function paginateWithinRadius(
        EloquentBuilder $query,
        float $lat,
        float $lng,
        float $radius,
        int $page = 1
    ): LengthAwarePaginator {
        $haversine = $this->haversineSql($lat, $lng);

        // If the DB can compute distance natively we can apply the true
        // circular filter directly. Otherwise the bounding-box pre-filter
        // already applied in buildQuery()/applyRadiusFilter() narrows the
        // scan, and we refine with the haversine expression below.
        if ($this->supportsNativeDistance()) {
            $query->whereRaw("{$haversine} <= ?", [$radius]);
        } else {
            $query->whereRaw("{$haversine} <= ?", [$radius])
                ->limit(self::MAX_RADIUS_CANDIDATES); // safety cap for non-native engines
        }

        $query->leftJoin('user_profiles', 'user_profiles.user_id', '=', 'users.id')
            ->select('users.*')
            ->orderByRaw($this->priorityOrderSql())     // premium first
            ->orderByRaw("{$haversine} ASC")            // then closest within tier
            ->orderByDesc('users.last_active_at')       // stable tie-breaker
            ->orderBy('users.id');

        // NOTE: ->limit() interacts with paginate() — Laravel applies its own
        // limit. When using the safety cap we therefore paginate manually.
        if ($this->supportsNativeDistance()) {
            return $query->paginate(self::PER_PAGE, ['*'], 'page', $page)->withQueryString();
        }

        return $this->paginateCapped($query, $page);
    }

    /**
     * Manual pagination for the non-native-distance fallback, where we
     * cap the candidate set with ->limit(MAX_RADIUS_CANDIDATES).
     */
    private function paginateCapped(EloquentBuilder $query, int $page): LengthAwarePaginator
    {
        $page = max(1, $page);
        $offset = ($page - 1) * self::PER_PAGE;

        // Count is bounded by the cap, so this stays cheap.
        $total = (clone $query)->toBase()->getCountForPagination();

        $items = $query->forPage($page, self::PER_PAGE)->get();

        return new Paginator(
            $items,
            $total,
            self::PER_PAGE,
            $page,
            ['path' => request()->url(), 'query' => request()->query()]
        );
    }

    private function formatPaginated(LengthAwarePaginator $paginator, float $lat, float $lng): array
    {
        $items = $paginator->getCollection()
            ->map(fn($u) => $this->appendDistance($u, $lat, $lng));

        return [
            'data' => $items->values(),
            'links' => $paginator->linkCollection()->toArray(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ];
    }

    public function appendDistance($user, float $lat, float $lng)
    {
        $user->distance_km = $this->geo->haversineKm($lat, $lng, (float) $user->lat, (float) $user->lng);
        return $user;
    }

    // -----------------------------------------------------------------
    // Filters
    // -----------------------------------------------------------------

    private function filterByProfileStatus(EloquentBuilder $query): void
    {
        $query->where(function ($q) {
            $q->whereDoesntHave('profile')
                ->orWhereHas('profile', fn($q2) => $q2
                    ->where('is_approved', true)
                    ->whereNull('deleted_at'));
        });
    }

    private function applyRadiusFilter(EloquentBuilder $query, array $filters, float $lat, float $lng): void
    {
        if (($filters['radius'] ?? null) === null) {
            return;
        }

        // Coarse bounding-box pre-filter (rectangle). The true circular
        // filter is applied in paginateWithinRadius() via haversine.
        $d = $this->geo->boundingBoxDeltas($lat, (float) $filters['radius']);

        $query->whereBetween('users.lat', [$lat - $d['lat'], $lat + $d['lat']])
            ->whereBetween('users.lng', [$lng - $d['lng'], $lng + $d['lng']]);
    }

    private function applyCountyFilter(EloquentBuilder $query, array $filters): ?int
    {
        if (($filters['county'] ?? null) === null) {
            return null;
        }

        $countyId = County::where('name', $filters['county'])->value('id');

        if ($countyId !== null) {
            $query->where('users.county_id', $countyId);
        } else {
            $query->whereRaw('1 = 0');
        }

        return $countyId;
    }

    private function applyTownFilter(EloquentBuilder $query, array $filters, ?int $countyId): void
    {
        if (($filters['town'] ?? null) === null) {
            return;
        }

        $townId = Town::query()
            ->where('name', $filters['town'])
            ->when($countyId !== null, fn($q) => $q->where('county_id', $countyId))
            ->value('id');

        if ($townId !== null) {
            $query->where('users.town_id', $townId);
        } else {
            $query->whereRaw('1 = 0');
        }
    }

    private function applyDemographicsFilter(EloquentBuilder $query, array $filters): void
    {
        if (($filters['age_min'] ?? null) !== null) {
            $query->where('users.age', '>=', $filters['age_min']);
        }
        if (($filters['age_max'] ?? null) !== null) {
            $query->where('users.age', '<=', $filters['age_max']);
        }
        if (($filters['gender'] ?? null) !== null) {
            $query->where('users.gender', $filters['gender']);
        }
    }

    private function applyTierFilter(EloquentBuilder $query, array $filters): void
    {
        if (($filters['tier'] ?? null) !== null) {
            $query->where('users.tier', $filters['tier']);
        }
    }

    private function applyProfileFilters(EloquentBuilder $query, array $filters): void
    {
        $profileFilters = array_filter([
            'ethnicity' => $filters['ethnicity'] ?? null,
            'body_type' => $filters['body_type'] ?? null,
            'incall' => $filters['incall'] ?? false,
            'outcall' => $filters['outcall'] ?? false,
        ]);

        if (count($profileFilters) === 0 && !($filters['service'] ?? null)) {
            return;
        }

        $query->whereHas('profile', function ($q) use ($filters, $profileFilters) {
            foreach ($profileFilters as $col => $val) {
                $q->where($col, $val);
            }
            if ($filters['service'] ?? null) {
                $q->whereJsonContains('services', $filters['service']);
            }
        });
    }

    private function excludeBlocked(EloquentBuilder $query, User $user): void
    {
        $blockedIds = DB::table('user_blocks')
            ->where('blocker_id', $user->id)
            ->pluck('blocked_id')
            ->merge(
                DB::table('user_blocks')
                    ->where('blocked_id', $user->id)
                    ->pluck('blocker_id')
            )
            ->unique()
            ->values()
            ->all();

        if (!empty($blockedIds)) {
            $query->whereNotIn('users.id', $blockedIds);
        }
    }

    // -----------------------------------------------------------------
    // Ordering / distance helpers
    // -----------------------------------------------------------------

    /**
     * Single source of truth for tier priority. Mirrors priorityOrderSql().
     * Used only where PHP-side ranking is unavoidable (kept for parity).
     */
    private function priorityRank($user): int
    {
        return match ($user->tier) {
            'premium' => 0,
            'regular' => 1,
            default => 2,
        };
    }

    private function priorityOrderSql(): string
    {
        return "CASE
            WHEN users.tier = 'premium' THEN 0
            WHEN users.tier = 'regular' THEN 1
            ELSE 2
        END ASC";
    }

    /**
     * SQL haversine expression (km). Works on MySQL/MariaDB/Postgres/SQLite
     * since it only uses standard math functions.
     *
     * If you're on MySQL 8+ with a spatial POINT column you can swap this
     * for ST_Distance_Sphere() and gain indexability.
     */
    private function haversineSql(float $lat, float $lng): string
    {
        $lat = (float) $lat;
        $lng = (float) $lng;
        $r = self::EARTH_RADIUS_KM;

        // 6371 * acos( cos(radians(:lat)) * cos(radians(lat)) *
        //             cos(radians(lng) - radians(:lng)) +
        //             sin(radians(:lat)) * sin(radians(lat)) )
        return "({$r} * ACOS(
            LEAST(1, GREATEST(-1,
                COS(RADIANS({$lat})) * COS(RADIANS(users.lat)) *
                COS(RADIANS(users.lng) - RADIANS({$lng})) +
                SIN(RADIANS({$lat})) * SIN(RADIANS(users.lat))
            ))
        ))";
    }

    /**
     * Whether the current DB driver can compute spatial distance natively.
     * MySQL 8+ / MariaDB 10.4+ → true; otherwise falls back to the
     * bounded-candidate manual pagination path.
     */
    private function supportsNativeDistance(): bool
    {
        $driver = DB::connection()->getDriverName();

        if ($driver !== 'mysql' && $driver !== 'mariadb') {
            return false;
        }

        return version_compare($this->dbServerVersion(), '8.0.0', '>=');
    }

    private function dbServerVersion(): string
    {
        try {
            $row = DB::selectOne('SELECT VERSION() AS v');
            return (string) ($row->v ?? '0.0.0');
        } catch (\Throwable) {
            return '0.0.0';
        }
    }
}