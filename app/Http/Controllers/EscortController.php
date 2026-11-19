<?php

namespace App\Http\Controllers;

use App\Http\Requests\EscortIndexRequest;
use App\Http\Requests\Settings\EscortOnboardingRequest;
use App\Http\Requests\UpdateLocationRequest;
use App\Http\Resources\ProfileCardResource;
use App\Http\Resources\ProfileResource;
use App\Models\User;
use App\Models\UserImage;
use App\Services\Escort\EscortOnboardingService;
use App\Services\Escort\EscortSearchService;
use App\Services\LocationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EscortController extends Controller
{
    public function __construct(
        private readonly EscortSearchService $search,
        private readonly LocationService $locations,
        private readonly EscortOnboardingService $escortOnboarding,
    ) {
    }

    /**
     * Display discoverable escort profiles.
     */
    public function index(EscortIndexRequest $request): Response
    {
        $user = $request->user();
        $filters = $request->filters();
        $coords = $this->locations->resolve($request);

        if ($coords === null) {
            return Inertia::render('escorts/index', [
                'profiles' => [
                    'data' => [],
                    'links' => [],
                    'meta' => null,
                ],
                'filters' => $filters,
                'error' => 'Location required. Please allow location access.',
            ]);
        }

        $results = $this->search->getDiscoverResults(
            $filters,
            $coords['lat'],
            $coords['lng'],
            $user,
            (int) $request->input('page', 1),
        );

        return Inertia::render('escorts/index', [
            'profiles' => [
                'data' => ProfileCardResource::collection($results['data'])->resolve(),
                'links' => $results['links'],
                'meta' => $results['meta'],
            ],
            'filters' => $filters,
        ]);
    }

    /**
     * Show escort onboarding index page.
     */
    public function manage(Request $request): Response
    {
        $user = $request->user();
        $profile = $user->profile;

        return Inertia::render('settings/escorts/index', [
            'isEscort' => $profile !== null,
            'isVerified' => (bool) ($profile?->is_approved ?? false),
        ]);
    }

    /**
     * Show escort onboarding form.
     */
    public function create(Request $request): Response
    {
        $user = $request->user();
        $profile = $user->profile;

        return Inertia::render('settings/escorts/create', [
            'profile' => $profile
                ? $this->profilePayload($user)
                : null,
        ]);
    }

    /**
     * Save or update escort onboarding information.
     */
    public function store(EscortOnboardingRequest $request): RedirectResponse
    {
        $user = $request->user();
        $isNew = !$user->profile()->exists();

        $this->escortOnboarding->save(
            $user,
            $request->validated(),
            [
                'gallery' => $request->file('gallery', []),
                'videos' => $request->file('videos', []),
            ],
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $isNew
                ? __('Escort profile submitted for review.')
                : __('Escort profile updated.'),
        ]);

        return to_route('profile.edit');
    }

    /**
     * Display an escort profile.
     */
    public function show(Request $request, User $user): Response
    {
        $me = $request->user();

        $isOwner = $me?->is($user) ?? false;

        $isBlocked = $me !== null
            && !$isOwner
            && (
                $me->hasBlocked($user)
                || $me->isBlockedBy($user)
            );

        if (!$isOwner) {
            abort_unless(
                $user->profile()->approved()->exists(),
                404,
                'This profile is not available.',
            );
        }

        abort_if($isBlocked, 403);

        $user->loadMissing([
            'profile',
            'reviewsReceived' => fn($query) => $query
                ->latest()
                ->limit(10),
        ]);

        $suggestedProfiles = User::query()
            ->with('profile')
            ->whereKeyNot($user->getKey())
            ->whereHas('profile', fn($query) => $query->approved())
            ->inRandomOrder()
            ->limit(10)
            ->get();

        return Inertia::render('escorts/show', [
            'profile' => (new ProfileResource($user))->resolve(),
            'isOwner' => $isOwner,
            'canMessage' => $me !== null && !$isOwner && !$isBlocked,
            'isLiked' => $me !== null
                && !$isOwner
                && $me->hasLiked($user),
            'suggestedProfiles' => ProfileCardResource::collection(
                $suggestedProfiles
            )->resolve(),
        ]);
    }

    /**
     * Update escort onboarding information.
     */
    public function update(EscortOnboardingRequest $request): RedirectResponse
    {
        return $this->store($request);
    }

    /**
     * Like an escort profile.
     */
    public function like(Request $request, User $user): JsonResponse
    {
        $me = $request->user();

        abort_if($me === null, 401);
        abort_if($user->is($me), 422, 'You cannot like yourself.');

        abort_unless(
            $user->profile()->approved()->exists(),
            404,
            'This profile is not available.',
        );

        abort_if(
            $me->hasBlocked($user) || $me->isBlockedBy($user),
            403,
        );

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

    /**
     * Update user's location.
     */
    public function updateLocation(UpdateLocationRequest $request): RedirectResponse
    {
        $this->locations->update(
            $request->user(),
            $request->validated(),
        );

        return back();
    }

    /**
     * Prepare escort profile data for onboarding.
     */
    private function profilePayload(User $user): array
    {
        $profile = $user->profile;

        return [
            'orientation' => $profile->orientation,
            'height_cm' => $profile->height_cm,
            'weight_kg' => $profile->weight_kg,
            'body_type' => $profile->body_type,
            'hair_color' => $profile->hair_color,
            'eye_color' => $profile->eye_color,
            'ethnicity' => $profile->ethnicity,

            'services' => $profile->services ?? [],

            'smoking' => (bool) $profile->smoking,
            'drinking' => (bool) $profile->drinking,

            'rate_15min' => $profile->rate_15min,
            'rate_30min' => $profile->rate_30min,
            'rate_1hour' => $profile->rate_1hour,
            'rate_night' => $profile->rate_night,
            'currency' => $profile->currency ?? 'KES',

            'is_available' => (bool) $profile->is_available,
            'availability_status' => $profile->availability_status ?? 'offline',

            'incall' => (bool) $profile->incall,
            'outcall' => (bool) $profile->outcall,

            'cover_image_url' => $user->cover_image,

            'gallery_urls' => $user->images()
                ->approved()
                ->ordered()
                ->get()
                ->map(fn(UserImage $image) => $image->public_url)
                ->filter()
                ->values()
                ->all(),

            'video_urls' => $user->videos()
                ->approved()
                ->ordered()
                ->get()
                ->map(fn($video) => $video->public_url)
                ->filter()
                ->values()
                ->all(),

            'is_approved' => (bool) $profile->is_approved,
            'is_featured' => (bool) $profile->is_featured,
        ];
    }
}
