<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProfileCardResource;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DiscoverController extends Controller
{
    private const KM_PER_DEGREE = 111.045;
    private const PER_PAGE = 20;

    public function index(Request $request): Response
    {
        $user = $request->user();
        $lat = $user?->lat ?? session('guest_lat');
        $lng = $user?->lng ?? session('guest_lng');

        if ($lat === null || $lng === null) {
            return Inertia::render('discover/index', [
                'profiles' => ['data' => [], 'links' => [], 'meta' => null],
                'filters' => $this->filtersFromRequest($request),
                'error' => 'Location required. Please allow location access.',
            ]);
        }

        $lat = (float) $lat;
        $lng = (float) $lng;
        $filters = $this->filtersFromRequest($request);
        $radius = $filters['radius'];
        $sort = $filters['sort'];

        // 1. Base Query: Users with location, with their profile loaded
        $query = User::query()
            ->with('profile')
            ->whereNotNull('users.lat')
            ->whereNotNull('users.lng');

        // 2. Profile approval logic (must be approved, OR have no profile at all)
        $query->where(function ($q) {
            $q->whereDoesntHave('profile')
                ->orWhereHas('profile', function ($q2) {
                    $q2->where('is_approved', true)->whereNull('deleted_at');
                });
        });

        if ($user) {
            $query->where('users.id', '!=', $user->id);
            $this->excludeBlocked($query, $user);
        }

        // 3. Geo Bounding Box (Fast index usage)
        if ($radius !== null) {
            $box = min($radius * 2, 2000);
            $latDelta = $box / self::KM_PER_DEGREE;
            $lngDelta = $box / (self::KM_PER_DEGREE * max(cos(deg2rad($lat)), 0.01));

            $query->whereBetween('users.lat', [$lat - $latDelta, $lat + $latDelta])
                ->whereBetween('users.lng', [$lng - $lngDelta, $lng + $lngDelta]);
        }

        // 4. Apply Filters
        if ($filters['age_min'] !== null)
            $query->where('users.age', '>=', $filters['age_min']);
        if ($filters['age_max'] !== null)
            $query->where('users.age', '<=', $filters['age_max']);
        if ($filters['gender'] !== null)
            $query->where('users.gender', $filters['gender']);
        if ($filters['verified_only'])
            $query->where('users.is_verified', true);

        // Profile-specific filters
        $profileFilters = array_filter([
            'is_available' => $filters['available_only'],
            'ethnicity' => $filters['ethnicity'],
            'body_type' => $filters['body_type'],
            'incall' => $filters['incall'],
            'outcall' => $filters['outcall'],
        ]);

        $hasProfileFilters = count($profileFilters) > 0 || $filters['service'] || $filters['price_min'] || $filters['price_max'];

        if ($hasProfileFilters) {
            $query->whereHas('profile', function ($q) use ($filters, $profileFilters) {
                foreach ($profileFilters as $col => $val) {
                    if ($col === 'is_available') {
                        $q->where('is_available', true)
                            ->whereIn('availability_status', ['online', 'incall', 'outcall']);
                    } else {
                        $q->where($col, $val);
                    }
                }
                if ($filters['service'])
                    $q->whereJsonContains('services', $filters['service']);
                if ($filters['price_min'] !== null)
                    $q->where('rate_1hour', '>=', $filters['price_min']);
                if ($filters['price_max'] !== null)
                    $q->where('rate_1hour', '<=', $filters['price_max']);
            });
        }

        // 5. Any Distance (Paginate purely at DB level)
        if ($radius === null) {
            match ($sort) {
                'price_asc' => $query->orderBy('user_profiles.rate_1hour'),
                'price_desc' => $query->orderByDesc('user_profiles.rate_1hour'),
                'rating' => $query->orderByDesc('user_profiles.rating_avg'),
                'newest' => $query->orderByDesc('users.last_active_at'),
                default => $query->orderByDesc('users.last_active_at'),
            };

            // Need to join to sort by profile columns
            $query->leftJoin('user_profiles', 'user_profiles.user_id', '=', 'users.id')
                ->select('users.*');

            $paginator = $query->paginate(self::PER_PAGE)->withQueryString();
            $paginator->getCollection()->transform(fn($u) => $this->appendDistance($u, $lat, $lng));

            return Inertia::render('discover/index', [
                'profiles' => [
                    'data' => ProfileCardResource::collection($paginator->items())->resolve(),
                    'links' => $paginator->linkCollection(),
                    'meta' => [
                        'current_page' => $paginator->currentPage(),
                        'last_page' => $paginator->lastPage(),
                        'per_page' => $paginator->perPage(),
                        'total' => $paginator->total(),
                        'from' => $paginator->firstItem(),
                        'to' => $paginator->lastItem(),
                    ],
                ],
                'filters' => $filters,
            ]);
        }

        // 6. Radius Set (Fetch, sort by exact distance in PHP, manually paginate)
        $rows = $query->limit(500)->get();
        $profiles = $rows
            ->map(fn($u) => $this->appendDistance($u, $lat, $lng))
            ->filter(fn($u) => $u->distance_km <= $radius)
            ->sortBy(fn($u) => $sort === 'distance_desc' ? -$u->distance_km : $u->distance_km)
            ->values();

        $page = max(1, (int) $request->input('page', 1));
        $total = $profiles->count();
        $lastPage = max(1, (int) ceil($total / self::PER_PAGE));
        $page = min($page, $lastPage);
        $items = $profiles->slice(($page - 1) * self::PER_PAGE, self::PER_PAGE)->values();

        return Inertia::render('discover/index', [
            'profiles' => [
                'data' => ProfileCardResource::collection($items)->resolve(),
                'links' => $this->buildLinks($page, $lastPage),
                'meta' => [
                    'current_page' => $page,
                    'last_page' => $lastPage,
                    'per_page' => self::PER_PAGE,
                    'total' => $total,
                    'from' => $total ? ($page - 1) * self::PER_PAGE + 1 : null,
                    'to' => $total ? min($page * self::PER_PAGE, $total) : null,
                ],
            ],
            'filters' => $filters,
        ]);
    }

    private function appendDistance(User $user, float $lat, float $lng): User
    {
        $user->distance_km = $this->haversineKm($lat, $lng, (float) $user->lat, (float) $user->lng);
        return $user;
    }

    private function haversineKm(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;
        return 6371 * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    private function buildLinks(int $current, int $last): array
    {
        $links = [];
        $links[] = ['url' => $current > 1 ? '?page=' . ($current - 1) : null, 'label' => '&laquo; Previous', 'active' => false];
        for ($i = 1; $i <= $last; $i++) {
            $links[] = ['url' => '?page=' . $i, 'label' => (string) $i, 'active' => $i === $current];
        }
        $links[] = ['url' => $current < $last ? '?page=' . ($current + 1) : null, 'label' => 'Next &raquo;', 'active' => false];
        return $links;
    }

    private function excludeBlocked($query, User $user): void
    {
        $blockedIds = DB::table('user_blocks')
            ->where('blocker_id', $user->id)->pluck('blocked_id')
            ->merge(DB::table('user_blocks')->where('blocked_id', $user->id)->pluck('blocker_id'))
            ->unique()->values()->all();

        if (!empty($blockedIds)) {
            $query->whereNotIn('users.id', $blockedIds);
        }
    }

    private function filtersFromRequest(Request $request): array
    {
        return [
            'radius' => $request->filled('radius') && $request->radius !== 'any' ? (float) $request->radius : null,
            'age_min' => $request->filled('age_min') ? (int) $request->age_min : null,
            'age_max' => $request->filled('age_max') ? (int) $request->age_max : null,
            'gender' => $request->input('gender') ?: null,
            'service' => $request->input('service') ?: null,
            'ethnicity' => $request->input('ethnicity') ?: null,
            'body_type' => $request->input('body_type') ?: null,
            'price_min' => $request->filled('price_min') ? (int) $request->price_min : null,
            'price_max' => $request->filled('price_max') ? (int) $request->price_max : null,
            'available_only' => $request->boolean('available_only'),
            'verified_only' => $request->boolean('verified_only'),
            'incall' => $request->boolean('incall'),
            'outcall' => $request->boolean('outcall'),
            'sort' => $request->input('sort', 'distance'),
        ];
    }

    public function like(Request $request, User $user)
    {
        $me = $request->user();
        abort_if(!$me, 401);
        abort_if($user->id === $me->id, 422);

        if ($user->profile()->exists()) {
            abort_unless($user->profile()->approved()->exists(), 404, 'This profile is not available.');
        }

        abort_if($me->hasBlocked($user) || $me->isBlockedBy($user), 403);

        $conversation = Conversation::query()
            ->where(fn($q) => $q->where('user_one_id', $me->id)->where('user_two_id', $user->id))
            ->orWhere(fn($q) => $q->where('user_one_id', $user->id)->where('user_two_id', $me->id))
            ->first();

        if (!$conversation) {
            $conversation = DB::transaction(function () use ($me, $user) {
                $conv = Conversation::create([
                    'user_one_id' => min($me->id, $user->id),
                    'user_two_id' => max($me->id, $user->id),
                    'last_message_at' => now(),
                ]);

                ConversationParticipant::insert([
                    ['conversation_id' => $conv->id, 'user_id' => $me->id, 'unread_count' => 0, 'created_at' => now(), 'updated_at' => now()],
                    ['conversation_id' => $conv->id, 'user_id' => $user->id, 'unread_count' => 0, 'created_at' => now(), 'updated_at' => now()],
                ]);

                return $conv;
            });
        }

        return redirect()->route('conversations.show', $conversation->id);
    }

    public function updateLocation(Request $request)
    {
        $validated = $request->validate([
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lng' => ['required', 'numeric', 'between:-180,180'],
        ]);

        if ($user = $request->user()) {
            $user->forceFill([
                'lat' => (float) $validated['lat'],
                'lng' => (float) $validated['lng'],
                'last_active_at' => now(),
            ])->save();
            $user->refresh();
        } else {
            session([
                'guest_lat' => (float) $validated['lat'],
                'guest_lng' => (float) $validated['lng'],
            ]);
        }

        return back();
    }
}