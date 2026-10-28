<?php

namespace App\Http\Controllers;

use App\Http\Requests\EscortIndexRequest;
use App\Http\Requests\UpdateLocationRequest;
use App\Http\Resources\ProfileCardResource;
use App\Http\Resources\ProfileResource;
use App\Models\User;
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

        $results = $this->search->getDiscoverResults(
            $filters,
            $coords['lat'],
            $coords['lng'],
            $user,
            (int) $request->input('page', 1)
        );

        return Inertia::render('escort/index', [
            'profiles' => [
                'data' => ProfileCardResource::collection($results['data'])->resolve(),
                'links' => $results['links'],
                'meta' => $results['meta'],
            ],
            'filters' => $filters,
        ]);
    }

    public function show(Request $request, User $user): Response
    {
        $me = $request->user();
        $isOwner = $me !== null && $user->id === $me->id;
        $isBlocked = $me !== null && !$isOwner && ($me->hasBlocked($user) || $me->isBlockedBy($user));

        if (!$isOwner) {
            abort_unless($user->profile()->approved()->exists(), 404, 'This profile is not available.');
        }
        abort_if($isBlocked, 403);

        $user->loadMissing(['profile', 'reviewsReceived' => fn($q) => $q->latest()->limit(10)]);

        $suggestedProfiles = User::with('profile')
            ->where('id', '!=', $user->id)
            ->whereHas('profile', fn($q) => $q->approved())
            ->inRandomOrder()
            ->take(10)
            ->get();

        return Inertia::render('escort/show', [
            'profile' => (new ProfileResource($user))->resolve(),
            'isOwner' => $isOwner,
            'canMessage' => $me !== null && !$isOwner && !$isBlocked,
            'isLiked' => $me !== null && !$isOwner && $me->hasLiked($user),
            'suggestedProfiles' => ProfileCardResource::collection($suggestedProfiles)->resolve(),
        ]);
    }

    public function like(Request $request, User $user): JsonResponse
    {
        $me = $request->user();
        abort_if(!$me, 401);
        abort_if($user->id === $me->id, 422, 'You cannot like yourself.');

        if ($user->profile()->exists()) {
            abort_unless($user->profile()->approved()->exists(), 404, 'This profile is not available.');
        }

        abort_if($me->hasBlocked($user) || $me->isBlockedBy($user), 403);

        $like = $me->likes()->firstOrCreate(['liked_user_id' => $user->id]);

        return response()->json([
            'success' => true,
            'liked' => true,
            'message' => $like->wasRecentlyCreated ? 'Profile liked.' : 'Profile already liked.',
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