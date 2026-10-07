<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class UserController extends Controller
{
    /** Columns safe to expose in the public discovery list. */
    private const PUBLIC_COLUMNS = [
        'id',
        'name',
        'avatar',
        'tier',
        'is_verified',
        'area',
        'bio',
        'age',
        'gender',
        'last_active_at',
    ];

    /** Columns safe to expose on a single-profile view. */
    private const PROFILE_COLUMNS = [
        'id',
        'name',
        'avatar',
        'tier',
        'is_verified',
        'area',
        'bio',
        'age',
        'gender',
        'last_active_at',
    ];

    /**
     * GET /api/users
     * Discovery: ?search=  ?area=  ?verified=1  ?tier=premium|vvip
     *            ?near=lat,lng,radius_km
     */
    public function index(Request $request)
    {
        $me = $request->user();

        // Build the select list once. If `near` is active we append the
        // distance column, but never the raw lat/lng.
        $select = self::PUBLIC_COLUMNS;

        $query = User::query()
            ->where('id', '!=', $me->id)
            ->select($select);

        // ── Filters ──
        if ($search = $request->string('search')->trim()->toString()) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($area = $request->string('area')->trim()->toString()) {
            $query->where('area', $area);
        }

        if ($request->boolean('verified')) {
            $query->where('is_verified', true);
        }

        if ($tier = $request->string('tier')->toString()) {
            $query->whereIn('tier', ['regular', 'premium', 'vvip'])
                ->where('tier', $tier);
        }

        // ── Nearby sort ──
        $near = $request->string('near')->toString();
        $nearApplied = false;

        if ($near) {
            $parts = explode(',', $near);

            if (
                count($parts) === 3
                && is_numeric($parts[0])
                && is_numeric($parts[1])
                && is_numeric($parts[2])
            ) {
                [$lat, $lng, $radius] = array_map('floatval', $parts);

                // Only add the distance column — never expose lat/lng.
                $query->addSelect(
                    \DB::raw(
                        '(6371 * acos(cos(radians(?)) * cos(radians(lat)) * cos(radians(lng) - radians(?)) + sin(radians(?)) * sin(radians(lat)))) AS distance_km'
                    )
                )->addBinding([$lat, $lng, $lat], 'select');

                $query->whereNotNull('lat')
                    ->whereNotNull('lng')
                    ->having('distance_km', '<=', $radius)
                    ->orderBy('distance_km');

                $nearApplied = true;
            }
        }

        if (!$nearApplied) {
            $query->orderByDesc('last_active_at')
                ->orderByDesc('id');
        }

        return response()->json($query->paginate(20));
    }

    /**
     * GET /api/users/{user}
     */
    public function show(Request $request, User $user)
    {
        $me = $request->user();

        if ($user->id === $me->id) {
            return response()->json([
                'user' => $user->only(self::PROFILE_COLUMNS + ['phone', 'lat', 'lng']),
                'online' => Cache::has("user.online.{$user->id}"),
            ]);
        }

        return response()->json([
            'user' => $user->only(self::PROFILE_COLUMNS),
            'online' => Cache::has("user.online.{$user->id}"),
        ]);
    }

    /**
     * PATCH /api/me
     * Update own profile.
     */
    public function updateMe(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
            'avatar' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'string', 'max:20'],
            'bio' => ['sometimes', 'nullable', 'string', 'max:500'],
            'age' => ['sometimes', 'integer', 'min:13', 'max:120'],
            'gender' => ['sometimes', 'in:male,female,other'],
            'lat' => ['sometimes', 'numeric', 'between:-90,90'],
            'lng' => ['sometimes', 'numeric', 'between:-180,180'],
            'area' => ['sometimes', 'string', 'max:100'],
        ]);

        $user->update($data);

        return response()->json([
            'user' => $user->fresh()->only(array_merge(
                self::PROFILE_COLUMNS,
                ['phone', 'lat', 'lng', 'coins', 'subscription_expires_at'],
            ))
        ]);
    }

    /**
     * POST /api/me/heartbeat
     * Touch last_active_at. Delegates to the presence system's cache so
     * the two don't drift apart.
     */
    public function heartbeat(Request $request)
    {
        $user = $request->user();

        // Mirror PresenceController's TTL so both endpoints agree.
        Cache::put("user.online.{$user->id}", true, 120);

        // Throttle DB writes: only update if it's been > 30s.
        $stale = !$user->last_active_at
            || $user->last_active_at->lt(now()->subSeconds(30));

        if ($stale) {
            $user->forceFill(['last_active_at' => now()])->save();
        }

        return response()->json([
            'ok' => true,
            'last_active_at' => $user->last_active_at?->toISOString(),
        ]);
    }

    /**
     * POST /api/user/location
     */
    public function updateLocation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lng' => ['required', 'numeric', 'between:-180,180'],
            'accuracy' => ['nullable', 'numeric', 'min:0'],
        ]);

        $user = $request->user();

        $user->forceFill([
            'lat' => $validated['lat'],
            'lng' => $validated['lng'],
            'last_active_at' => now(),
        ])->save();

        return response()->json([
            'ok' => true,
            'user' => [
                'lat' => $user->lat,
                'lng' => $user->lng,
            ],
        ]);
    }
}