<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Support\Facades\DB;

/**
 * @phpstan-type DiscoverFilters array{
 *     radius?: float|int|null,
 *     county?: string|null,
 *     town?: string|null,
 *     age_min?: int|null,
 *     age_max?: int|null,
 *     gender?: string|null,
 *     tier?: string|null,
 *     ethnicity?: string|null,
 *     body_type?: string|null,
 *     incall?: bool|null,
 *     outcall?: bool|null,
 *     service?: string|null
 * }
 */
class EscortSearchService
{
    public const PER_PAGE = 20;

    private const EARTH_RADIUS_KM = 6371.0;

    public function __construct(
        private readonly GeoService $geo
    ) {
    }

    /**
     * Get paginated discovery results.
     */
    public function getDiscoverResults(
        array $filters,
        float $lat,
        float $lng,
        ?User $viewer,
        int $page = 1
    ): array {
        $page = max(1, $page);

        $query = $this->buildQuery(
            $filters,
            $lat,
            $lng,
            $viewer
        );

        $radius = $filters['radius'] ?? null;

        $paginator = $radius === null
            ? $this->paginateAnyDistance($query, $page)
            : $this->paginateWithinRadius(
                $query,
                $lat,
                $lng,
                (float) $radius,
                $page
            );

        return $this->formatPaginated(
            $paginator,
            $lat,
            $lng
        );
    }

    /**
     * Build the base discovery query.
     *
     * @return EloquentBuilder<User>
     */
    public function buildQuery(
        array $filters,
        float $lat,
        float $lng,
        ?User $viewer
    ): EloquentBuilder {
        /** @var EloquentBuilder<User> $query */
        $query = User::query()
            ->select('users.*')
            ->with('profile')
            ->whereNotNull('users.lat')
            ->whereNotNull('users.lng');

        $this->filterByProfileStatus($query);

        if ($viewer !== null) {
            $query->where('users.id', '!=', $viewer->id);

            $this->excludeBlocked($query, $viewer);
        }

        $this->applyRadiusFilter($query, $filters, $lat, $lng);
        $this->applyCountyFilter($query, $filters);
        $this->applyTownFilter($query, $filters);
        $this->applyDemographicsFilter($query, $filters);
        $this->applyTierFilter($query, $filters);
        $this->applyProfileFilters($query, $filters);

        return $query;
    }

    /**
     * Paginate results without a radius restriction.
     *
     * @param EloquentBuilder<User> $query
     */
    public function paginateAnyDistance(
        EloquentBuilder $query,
        int $page = 1
    ): LengthAwarePaginator {
        $query
            ->orderByRaw($this->priorityOrderSql())
            ->orderByRaw(
                'CASE WHEN users.last_active_at IS NULL THEN 1 ELSE 0 END ASC'
            )
            ->orderByDesc('users.last_active_at')
            ->orderByDesc('users.id');

        return $query
            ->paginate(
                self::PER_PAGE,
                ['users.*'],
                'page',
                max(1, $page)
            )
            ->withQueryString();
    }

    /**
     * Paginate results within a selected radius.
     *
     * @param EloquentBuilder<User> $query
     */
    public function paginateWithinRadius(
        EloquentBuilder $query,
        float $lat,
        float $lng,
        float $radius,
        int $page = 1
    ): LengthAwarePaginator {
        if ($radius <= 0) {
            $query->whereRaw('1 = 0');

            return $query
                ->paginate(
                    self::PER_PAGE,
                    ['users.*'],
                    'page',
                    max(1, $page)
                )
                ->withQueryString();
        }

        $haversine = $this->haversineSql();

        $distanceBindings = [
            $lat,
            $lng,
            $lat,
        ];

        $query
            ->whereRaw(
                "{$haversine} <= ?",
                [...$distanceBindings, $radius]
            )
            ->orderByRaw($this->priorityOrderSql())
            ->orderByRaw($haversine, $distanceBindings)
            ->orderByRaw(
                'CASE WHEN users.last_active_at IS NULL THEN 1 ELSE 0 END ASC'
            )
            ->orderByDesc('users.last_active_at')
            ->orderByDesc('users.id');

        return $query
            ->paginate(
                self::PER_PAGE,
                ['users.*'],
                'page',
                max(1, $page)
            )
            ->withQueryString();
    }

    /**
     * Format paginator output.
     */
    private function formatPaginated(
        LengthAwarePaginator $paginator,
        float $lat,
        float $lng
    ): array {
        $items = $paginator->getCollection()
            ->map(fn(User $user) => $this->appendDistance(
                $user,
                $lat,
                $lng
            ))
            ->values();

        return [
            'data' => $items,
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

    /**
     * Attach calculated distance to a user.
     */
    public function appendDistance(
        User $user,
        float $lat,
        float $lng
    ): User {
        $user->distance_km = $this->geo->haversineKm(
            $lat,
            $lng,
            (float) $user->lat,
            (float) $user->lng
        );

        return $user;
    }

    // ---------------------------------------------------------
    // Profile status
    // ---------------------------------------------------------

    /**
     * Only show users without a profile or with an approved profile.
     *
     * @param EloquentBuilder<User> $query
     */
    private function filterByProfileStatus(
        EloquentBuilder $query
    ): void {
        $query->where(function (EloquentBuilder $q) {
            $q->whereDoesntHave('profile')
                ->orWhereHas(
                    'profile',
                    function (EloquentBuilder $profile) {
                        $profile
                            ->where('is_approved', true)
                            ->whereNull('deleted_at');
                    }
                );
        });
    }

    // ---------------------------------------------------------
    // Location filters
    // ---------------------------------------------------------

    /**
     * Apply approximate rectangular radius filtering.
     *
     * @param EloquentBuilder<User> $query
     */
    private function applyRadiusFilter(
        EloquentBuilder $query,
        array $filters,
        float $lat,
        float $lng
    ): void {
        if (!isset($filters['radius'])) {
            return;
        }

        $radius = (float) $filters['radius'];

        if ($radius <= 0) {
            $query->whereRaw('1 = 0');

            return;
        }

        $deltas = $this->geo->boundingBoxDeltas($lat, $radius);

        $query
            ->whereBetween('users.lat', [
                max(-90, $lat - $deltas['lat']),
                min(90, $lat + $deltas['lat']),
            ])
            ->whereBetween('users.lng', [
                max(-180, $lng - $deltas['lng']),
                min(180, $lng + $deltas['lng']),
            ]);
    }

    /**
     * Filter by county name.
     *
     * @param EloquentBuilder<User> $query
     */
    private function applyCountyFilter(
        EloquentBuilder $query,
        array $filters
    ): void {
        if (empty($filters['county'])) {
            return;
        }

        /** @var QueryBuilder $countyIds */
        $countyIds = DB::table('counties')
            ->select('id')
            ->where('name', $filters['county']);

        $query->whereIn('users.county_id', $countyIds);
    }

    /**
     * Filter by town name and optionally county.
     *
     * @param EloquentBuilder<User> $query
     */
    private function applyTownFilter(
        EloquentBuilder $query,
        array $filters
    ): void {
        if (empty($filters['town'])) {
            return;
        }

        /** @var QueryBuilder $townIds */
        $townIds = DB::table('towns')
            ->select('id')
            ->where('name', $filters['town']);

        if (!empty($filters['county'])) {
            /** @var QueryBuilder $countyIds */
            $countyIds = DB::table('counties')
                ->select('id')
                ->where('name', $filters['county']);

            $townIds->whereIn('county_id', $countyIds);
        }

        $query->whereIn('users.town_id', $townIds);
    }

    // ---------------------------------------------------------
    // Demographic filters
    // ---------------------------------------------------------

    /**
     * Filter by age and gender.
     *
     * @param EloquentBuilder<User> $query
     */
    private function applyDemographicsFilter(
        EloquentBuilder $query,
        array $filters
    ): void {
        if (($filters['age_min'] ?? null) !== null) {
            $query->where(
                'users.age',
                '>=',
                (int) $filters['age_min']
            );
        }

        if (($filters['age_max'] ?? null) !== null) {
            $query->where(
                'users.age',
                '<=',
                (int) $filters['age_max']
            );
        }

        if (!empty($filters['gender'])) {
            $query->where('users.gender', $filters['gender']);
        }
    }

    /**
     * Filter by account tier.
     *
     * @param EloquentBuilder<User> $query
     */
    private function applyTierFilter(
        EloquentBuilder $query,
        array $filters
    ): void {
        if (!empty($filters['tier'])) {
            $query->where('users.tier', $filters['tier']);
        }
    }

    /**
     * Filter by profile attributes.
     *
     * Explicit false values are preserved.
     *
     * @param EloquentBuilder<User> $query
     */
    private function applyProfileFilters(
        EloquentBuilder $query,
        array $filters
    ): void {
        $hasProfileFilters =
            ($filters['ethnicity'] ?? null) !== null ||
            ($filters['body_type'] ?? null) !== null ||
            ($filters['incall'] ?? null) !== null ||
            ($filters['outcall'] ?? null) !== null ||
            !empty($filters['service']);

        if (!$hasProfileFilters) {
            return;
        }

        $query->whereHas(
            'profile',
            function (EloquentBuilder $profile) use ($filters) {
                foreach (
                    ['ethnicity', 'body_type', 'incall', 'outcall']
                    as $column
                ) {
                    if (($filters[$column] ?? null) !== null) {
                        $profile->where($column, $filters[$column]);
                    }
                }

                if (!empty($filters['service'])) {
                    $profile->whereJsonContains(
                        'services',
                        $filters['service']
                    );
                }
            }
        );
    }

    // ---------------------------------------------------------
    // Block filters
    // ---------------------------------------------------------

    /**
     * Exclude users who blocked the viewer or were blocked by the viewer.
     *
     * @param EloquentBuilder<User> $query
     */
    private function excludeBlocked(
        EloquentBuilder $query,
        User $viewer
    ): void {
        $query->whereNotIn(
            'users.id',
            $this->blockedUserIds($viewer)
        );
    }

    /**
     * Get IDs of users involved in either direction of a block.
     */
    private function blockedUserIds(User $viewer): QueryBuilder
    {
        $blockedByViewer = DB::table('user_blocks')
            ->select('blocked_id')
            ->where('blocker_id', $viewer->id);

        $blockedViewer = DB::table('user_blocks')
            ->select('blocker_id')
            ->where('blocked_id', $viewer->id);

        return $blockedByViewer->union($blockedViewer);
    }

    // ---------------------------------------------------------
    // Ordering and distance
    // ---------------------------------------------------------

    /**
     * Premium accounts rank ahead of regular accounts.
     */
    private function priorityOrderSql(): string
    {
        return "CASE
            WHEN users.tier = 'premium' THEN 0
            WHEN users.tier = 'regular' THEN 1
            ELSE 2
        END ASC";
    }

    /**
     * Haversine distance in kilometres.
     *
     * Coordinates are bound separately to prevent SQL interpolation.
     */
    private function haversineSql(): string
    {
        return '(' . self::EARTH_RADIUS_KM . ' * ACOS(
            LEAST(1, GREATEST(-1,
                COS(RADIANS(?)) *
                COS(RADIANS(users.lat)) *
                COS(RADIANS(users.lng) - RADIANS(?)) +
                SIN(RADIANS(?)) *
                SIN(RADIANS(users.lat))
            ))
        ))';
    }
}
