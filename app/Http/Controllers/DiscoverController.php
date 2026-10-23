<?php

namespace App\Http\Controllers;

use App\Http\Resources\DiscoverProfileResource;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DiscoverController extends Controller
{
    private const KM_PER_DEGREE = 111.045;

    public function index(Request $request)
    {
        $user = $request->user();

        // Resolve location: user coords win, otherwise fall back to guest session.
        // Use null checks (??), NOT truthiness — 0.0 is a valid coordinate
        // (equator / prime meridian) and would otherwise be treated as "missing".
        $lat = $user?->lat ?? session('guest_lat');
        $lng = $user?->lng ?? session('guest_lng');

        if ($lat === null || $lng === null) {
            return Inertia::render('discover/index', [
                'profiles' => [],
                'filters' => $this->filtersFromRequest($request),
                'error' => 'Location required. Please allow location access.',
            ]);
        }

        $lat = (float) $lat;
        $lng = (float) $lng;

        $radiusKm = (float) $request->input('radius', 50);
        $latDelta = $radiusKm / self::KM_PER_DEGREE;
        $lngDelta = $radiusKm / (self::KM_PER_DEGREE * max(cos(deg2rad($lat)), 0.01));

        // ── LEFT JOIN so social/dating users (no profile row) appear too ──
        $query = User::query()
            ->leftJoin('user_profiles', 'user_profiles.user_id', '=', 'users.id')
            ->whereNotNull('users.lat')
            ->whereNotNull('users.lng')
            // Only exclude users whose profile exists AND is explicitly
            // unapproved or soft-deleted. Users without a profile have
            // NULL on both → pass the filter.
            ->where(function ($q) {
                $q->whereNull('user_profiles.id')                    // no profile at all → social/dating user
                    ->orWhere(function ($q2) {
                        $q2->where('user_profiles.is_approved', true)
                            ->whereNull('user_profiles.deleted_at');
                    });
            })
            ->select([
                'users.id',
                'users.name',
                'users.age',
                'users.gender',
                'users.bio',
                'users.avatar',
                'users.is_verified',
                'users.last_active_at',
                'users.lat',
                'users.lng',
                'user_profiles.id as profile_id',
                'user_profiles.services',
                'user_profiles.cover_image',
                'user_profiles.availability_status',
                'user_profiles.is_available',
                'user_profiles.rate_1hour',
                'user_profiles.rating_avg',
            ])
            ->whereBetween('users.lat', [$lat - $latDelta, $lat + $latDelta])
            ->whereBetween('users.lng', [$lng - $lngDelta, $lng + $lngDelta]);

        if ($user) {
            $query->where('users.id', '!=', $user->id);
        }

        // ── Filters ─────────────────────────────────────────────────
        if ($request->filled('age_min')) {
            $query->where('users.age', '>=', (int) $request->age_min);
        }
        if ($request->filled('age_max')) {
            $query->where('users.age', '<=', (int) $request->age_max);
        }
        if ($request->filled('gender')) {
            $query->where('users.gender', $request->gender);
        }

        // Availability only makes sense for escorts — auto-excludes social users
        if ($request->boolean('available_only')) {
            $query->whereNotNull('user_profiles.id')
                ->where('user_profiles.is_available', true)
                ->whereIn('user_profiles.availability_status', ['online', 'incall', 'outcall']);
        }

        // Service only exists on profiles — auto-excludes social users
        if ($request->filled('service')) {
            $query->whereNotNull('user_profiles.id')
                ->whereJsonContains('user_profiles.services', $request->service);
        }

        if ($user) {
            $this->excludeBlocked($query, $user);
        }

        $rows = $query->limit(500)->get();

        $profiles = $rows
            ->map(function ($u) use ($lat, $lng) {
                /** @var User $u */
                $u->distance_km = $this->haversineKm($lat, $lng, (float) $u->lat, (float) $u->lng);
                return $u;
            })
            ->filter(fn($u) => $u->distance_km <= $radiusKm)
            ->sortBy('distance_km')
            ->take(30)
            ->values();

        return Inertia::render('discover/index', [
            'profiles' => DiscoverProfileResource::collection($profiles)->resolve(),
            'filters' => $this->filtersFromRequest($request),
        ]);
    }

    public function like(Request $request, User $user)
    {
        $me = $request->user();
        abort_if(!$me, 401);
        abort_if($user->id === $me->id, 422);

        // Escorts with a listing are allowed; social users are allowed.
        // BUT: if the user HAS a profile and it's unapproved/deleted,
        // block the like — they're not meant to be discoverable yet.
        if ($user->profile()->exists()) {
            abort_unless(
                $user->profile()->approved()->exists(),
                404,
                'This profile is not available.'
            );
        }

        abort_if($me->hasBlocked($user) || $me->isBlockedBy($user), 403);

        $conversation = Conversation::query()
            ->where(function ($q) use ($me, $user) {
                $q->where('user_one_id', $me->id)->where('user_two_id', $user->id);
            })
            ->orWhere(function ($q) use ($me, $user) {
                $q->where('user_one_id', $user->id)->where('user_two_id', $me->id);
            })
            ->first();

        if (!$conversation) {
            $conversation = DB::transaction(function () use ($me, $user) {
                $conv = Conversation::create([
                    'user_one_id' => min($me->id, $user->id),
                    'user_two_id' => max($me->id, $user->id),
                    'last_message_at' => now(),
                    'last_message_preview' => null,
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

    private function haversineKm(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return 6371 * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    private function filtersFromRequest(Request $request): array
    {
        return [
            'radius' => (float) $request->input('radius', 50),
            'age_min' => $request->input('age_min'),
            'age_max' => $request->input('age_max'),
            'service' => $request->input('service'),
            'gender' => $request->input('gender'),
            'available_only' => $request->boolean('available_only'),
        ];
    }
}