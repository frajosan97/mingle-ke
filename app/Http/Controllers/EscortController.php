<?php

namespace App\Http\Controllers;

use App\Http\Requests\EscortIndexRequest;
use App\Http\Requests\UpdateLocationRequest;
use App\Http\Resources\ProfileCardResource;
use App\Http\Resources\ProfileResource;
use App\Models\User;
use App\Services\ConversationService;
use App\Services\EscortSearchService;
use App\Services\LocationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EscortController extends Controller
{
    public function __construct(
        private readonly EscortSearchService $search,
        private readonly ConversationService $conversations,
        private readonly LocationService $locations,
    ) {
    }

    public function index(EscortIndexRequest $request): Response
    {
        $user = $request->user();
        $filters = $request->filters();
        $coords = $this->locations->resolve($request);

        if ($coords === null) {
            return Inertia::render('escort/index', [
                'profiles' => ['data' => [], 'links' => [], 'meta' => null],
                'filters' => $filters,
                'error' => 'Location required. Please allow location access.',
            ]);
        }

        [$lat, $lng] = [$coords['lat'], $coords['lng']];

        $query = $this->search->buildQuery($filters, $lat, $lng, $user);

        // Any-distance: pure DB pagination
        if ($filters['radius'] === null) {
            $paginator = $this->search->paginateAnyDistance($query, $lat, $lng);

            return Inertia::render('escort/index', [
                'profiles' => [
                    'data' => ProfileCardResource::collection($paginator->items())->resolve(),
                    'links' => $this->search->buildLinks(
                        $paginator->currentPage(),
                        $paginator->lastPage(),
                    ),
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

        // Radius mode
        $result = $this->search->paginateWithinRadius(
            $query,
            $lat,
            $lng,
            (float) $filters['radius'],
            max(1, (int) $request->input('page', 1)),
        );

        return Inertia::render('escort/index', [
            'profiles' => [
                'data' => ProfileCardResource::collection($result['items'])->resolve(),
                'links' => $this->search->buildLinks($result['page'], $result['last_page']),
                'meta' => [
                    'current_page' => $result['page'],
                    'last_page' => $result['last_page'],
                    'per_page' => EscortSearchService::PER_PAGE,
                    'total' => $result['total'],
                    'from' => $result['from'],
                    'to' => $result['to'],
                ],
            ],
            'filters' => $filters,
        ]);
    }

    /**
     * Display a single escort profile.
     */
    public function show(Request $request, User $user): Response
    {
        $me = $request->user();
        $isOwner = $me !== null && $user->id === $me->id;

        // Non-owners may only view approved profiles.
        if (!$isOwner) {
            abort_unless(
                $user->profile()->approved()->exists(),
                404,
                'This profile is not available.',
            );
        }

        // Respect blocks in both directions (never for yourself).
        if ($me !== null && !$isOwner) {
            abort_if(
                $me->hasBlocked($user) || $me->isBlockedBy($user),
                403,
            );
        }

        // Load the escort profile (gallery lives here) + recent reviews.
        $user->loadMissing([
            'profile',
            'reviewsReceived' => fn($q) => $q->latest()->limit(10),
        ]);

        // Fetch 10 random other escorts to show in the desktop sidebar
        $suggestedProfiles = User::with('profile')
            ->where('id', '!=', $user->id)
            ->whereHas('profile', fn($q) => $q->approved())
            ->inRandomOrder()
            ->take(10)
            ->get();

        return Inertia::render('escort/show', [
            // Detail page uses the full resource
            'profile' => (new ProfileResource($user))->resolve(),
            'isOwner' => $isOwner,
            'canMessage' => $me !== null
                && !$isOwner
                && !$me->hasBlocked($user)
                && !$me->isBlockedBy($user),
            'isLiked' => $me !== null
                && !$isOwner
                && $me->hasLiked($user),

            // Pass the sidebar profiles, using the card resource for lightweight payload
            'suggestedProfiles' => ProfileCardResource::collection($suggestedProfiles)->resolve(),
        ]);
    }

    /**
     * Record a like from the current user to the given user.
     * Idempotent — liking twice is a no-op (still returns success).
     */
    public function like(Request $request, User $user): JsonResponse
    {
        $me = $request->user();
        abort_if(!$me, 401);
        abort_if($user->id === $me->id, 422, 'You cannot like yourself.');

        if ($user->profile()->exists()) {
            abort_unless(
                $user->profile()->approved()->exists(),
                404,
                'This profile is not available.',
            );
        }

        abort_if($me->hasBlocked($user) || $me->isBlockedBy($user), 403);

        // Idempotent: create the like if it doesn't already exist.
        $like = $me->likes()->firstOrCreate([
            'liked_user_id' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'liked' => true,
            'message' => $like->wasRecentlyCreated
                ? 'Profile liked.'
                : 'Profile already liked.',
            'data' => [
                'user_id' => $user->id,
                'liked_at' => $like->created_at?->toIso8601String(),
            ],
        ]);
    }

    public function updateLocation(UpdateLocationRequest $request)
    {
        $this->locations->update($request->user(), $request->validated());

        return back();
    }
}