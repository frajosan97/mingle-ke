<?php

namespace App\Http\Controllers;

use App\Http\Requests\EscortIndexRequest;
use App\Http\Requests\Settings\EscortOnboardingRequest;
use App\Http\Requests\Settings\EscortSubscriptionCheckoutRequest;
use App\Http\Requests\UpdateLocationRequest;
use App\Http\Resources\EscortSubscriptionPlanResource;
use App\Http\Resources\ProfileCardResource;
use App\Http\Resources\ProfileResource;
use App\Models\PricingPlan;
use App\Models\User;
use App\Models\UserImage;
use App\Services\Escort\EscortOnboardingService;
use App\Services\Escort\EscortSearchService;
use App\Services\EscortPaymentService;
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

    /*
    |--------------------------------------------------------------------------
    | Escort Discovery
    |--------------------------------------------------------------------------
    */

    /**
     * Display discoverable escort profiles.
     */
    public function index(EscortIndexRequest $request): Response
    {
        $user = $request->user();
        $filters = $request->filters();
        $coordinates = $this->locations->resolve($request);

        if (!$coordinates) {
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
            $coordinates['lat'],
            $coordinates['lng'],
            $user,
            (int) $request->input('page', 1),
        );

        return Inertia::render('escorts/index', [
            'profiles' => [
                'data' => ProfileCardResource::collection(
                    $results['data']
                )->resolve(),
                'links' => $results['links'],
                'meta' => $results['meta'],
            ],
            'filters' => $filters,
        ]);
    }

    /**
     * Display an individual escort profile.
     */
    public function show(Request $request, User $user): Response
    {
        $viewer = $request->user();

        $isOwner = $viewer?->is($user) ?? false;

        $user->loadMissing('profile');

        $isBlocked = $viewer !== null
            && !$isOwner
            && (
                $viewer->hasBlocked($user)
                || $viewer->isBlockedBy($user)
            );

        abort_if($isBlocked, 403);

        if (!$isOwner) {
            abort_unless(
                $user->canAppearInEscortListings(),
                404,
                'This profile is not available.',
            );
        }

        $user->loadMissing([
            'reviewsReceived' => fn($query) => $query
                ->latest()
                ->limit(10),
        ]);

        $suggestedProfiles = User::query()
            ->escorts()
            ->with('profile')
            ->whereKeyNot($user->getKey())
            ->inRandomOrder()
            ->limit(10)
            ->get()
            ->filter(
                fn(User $suggested) => $suggested->canAppearInEscortListings()
            )
            ->values();

        return Inertia::render('escorts/show', [
            'profile' => (new ProfileResource($user))->resolve(),
            'isOwner' => $isOwner,
            'canMessage' => $viewer !== null && !$isOwner,
            'isLiked' => $viewer !== null
                && !$isOwner
                && $viewer->hasLiked($user),
            'subscription' => $this->subscriptionData($user),
            'canAppearInListings' => $user->canAppearInEscortListings(),
            'suggestedProfiles' => ProfileCardResource::collection(
                $suggestedProfiles
            )->resolve(),
        ]);
    }

    /**
     * Like an escort profile.
     */
    public function like(Request $request, User $user): JsonResponse
    {
        $viewer = $request->user();

        abort_if($viewer === null, 401);
        abort_if($viewer->is($user), 422, 'You cannot like yourself.');

        $user->loadMissing('profile');

        abort_unless(
            $user->canAppearInEscortListings(),
            404,
            'This profile is not available.',
        );

        abort_if(
            $viewer->hasBlocked($user) || $viewer->isBlockedBy($user),
            403,
        );

        $like = $viewer->likes()->firstOrCreate([
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

    /*
    |--------------------------------------------------------------------------
    | Escort Management
    |--------------------------------------------------------------------------
    */

    /**
     * Display the escort management page.
     */
    public function manage(Request $request): Response
    {
        $user = $request->user();

        $user->loadMissing('profile');

        return Inertia::render('settings/escorts/index', [
            'isEscort' => $user->profile !== null,
            'isVerified' => (bool) ($user->profile?->is_approved ?? false),
            'subscription' => $this->subscriptionData($user),
            'canAppearInListings' => $user->canAppearInEscortListings(),
        ]);
    }

    /**
     * Display the escort onboarding form.
     */
    public function create(Request $request): Response
    {
        $user = $request->user();

        $user->loadMissing('profile');

        return Inertia::render('settings/escorts/create', [
            'profile' => $user->profile
                ? $this->profilePayload($user)
                : null,

            'subscription' => $this->subscriptionData($user),
            'canAppearInListings' => $user->canAppearInEscortListings(),
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
     * Update escort onboarding information.
     */
    public function update(EscortOnboardingRequest $request): RedirectResponse
    {
        return $this->store($request);
    }

    /*
    |--------------------------------------------------------------------------
    | Escort Subscription
    |--------------------------------------------------------------------------
    */

    /**
     * Display available escort listing subscription plans.
     */
    public function subscription(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if (!$user->profile()->exists()) {
            return redirect()->route('escorts.manage');
        }

        $plans = PricingPlan::query()
            ->ofType(PricingPlan::TYPE_ESCORT_LISTING)
            ->active()
            ->ordered()
            ->get();

        return Inertia::render('wallets/subscription', [
            'plans' => EscortSubscriptionPlanResource::collection(
                $plans
            )->resolve(),

            'phone' => $user->phone ?? '',
            'subscription' => $this->subscriptionData($user),
        ]);
    }

    /**
     * Start an escort subscription payment.
     */
    public function checkoutSubscription(
        EscortSubscriptionCheckoutRequest $request,
        EscortPaymentService $payments,
    ): RedirectResponse {
        $data = $request->validated();

        $result = $payments->startPurchase(
            $request->user(),
            (int) $data['plan_id'],
            (int) $data['days'],
            $data['phone'],
        );

        Inertia::flash('toast', [
            'type' => ($result['success'] ?? false) ? 'success' : 'error',
            'message' => $result['message'] ?? (
                ($result['success'] ?? false)
                ? 'M-PESA payment request sent.'
                : 'Unable to start your payment.'
            ),
        ]);

        return back();
    }

    /*
    |--------------------------------------------------------------------------
    | Location
    |--------------------------------------------------------------------------
    */

    /**
     * Update the user's location.
     */
    public function updateLocation(
        UpdateLocationRequest $request
    ): RedirectResponse {
        $this->locations->update(
            $request->user(),
            $request->validated(),
        );

        return back();
    }

    /*
    |--------------------------------------------------------------------------
    | Private Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Return the user's escort subscription information.
     */
    private function subscriptionData(User $user): array
    {
        return [
            'isActive' => $user->hasActiveEscortSubscription(),
            'isExpired' => $user->hasExpiredEscortSubscription(),
            'needsRenewal' => $user->needsEscortSubscriptionRenewal(),
            'startedAt' => $user->subscription_started_at?->toIso8601String(),
            'expiresAt' => $user->subscription_expires_at?->toIso8601String(),
            'plan' => $user->subscription_plan,
            'autoRenew' => (bool) $user->auto_renew,
        ];
    }

    /**
     * Prepare escort profile data for the onboarding form.
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