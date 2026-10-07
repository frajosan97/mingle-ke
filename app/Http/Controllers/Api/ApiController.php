<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\EscortResource;
use App\Models\User;
use App\Services\GeocoderService;
use App\Support\UserLocation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ApiController extends Controller
{
    /**
     * GET /api/escorts
     * Public discovery list. Optionally sorted by distance if the caller
     * provides coordinates via `UserLocation`.
     */
    public function escorts(Request $request)
    {
        try {
            $loc = UserLocation::from($request);

            $query = User::query()
                ->select([
                    'users.id',
                    'users.name',
                    'users.avatar',
                    'users.tier',
                    'users.is_verified',
                    'users.area',
                    'users.bio',
                    'users.age',
                    'users.gender',
                    'users.last_active_at',
                    // lat/lng are NOT selected — distance_km is derived below.
                ])
                ->with([
                    // Only the profile fields that are public.
                    'profile:id,user_id,headline,occupation,languages,photos',
                ]);

            // Exclude the caller from their own discovery list.
            if ($authId = $request->user()?->id) {
                $query->where('users.id', '!=', $authId);
            }

            // Distance sort — only when the caller supplied valid coords.
            if (
                is_array($loc)
                && isset($loc['lat'], $loc['lng'])
                && is_numeric($loc['lat'])
                && is_numeric($loc['lng'])
            ) {
                $lat = (float) $loc['lat'];
                $lng = (float) $loc['lng'];

                $query
                    ->addSelect(\DB::raw(
                        '(6371 * acos(LEAST(1, GREATEST(-1,
                            cos(radians(?)) * cos(radians(users.lat)) *
                            cos(radians(users.lng) - radians(?)) +
                            sin(radians(?)) * sin(radians(users.lat))
                        )))) AS distance_km'
                    ))
                    ->addBinding([$lat, $lng, $lat], 'select')
                    ->whereNotNull('users.lat')
                    ->whereNotNull('users.lng')
                    ->orderBy('distance_km')
                    ->orderByDesc('users.last_active_at');
            } else {
                // Fallback: freshest users first.
                $query->orderByDesc('users.last_active_at')
                    ->orderByDesc('users.id');
            }

            // Optional filters (safe defaults).
            if ($search = $request->string('search')->trim()->toString()) {
                $query->where('users.name', 'like', "%{$search}%");
            }
            if ($tier = $request->string('tier')->toString()) {
                $query->whereIn('users.tier', ['regular', 'premium', 'vvip'])
                    ->where('users.tier', $tier);
            }
            if ($request->boolean('verified')) {
                $query->where('users.is_verified', true);
            }

            $paginated = $query->paginate(24)->withQueryString();

            return EscortResource::collection($paginated);
        } catch (\Throwable $th) {
            Log::error('Failed to load escorts', [
                'err' => $th->getMessage(),
                'trace' => $th->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to load escorts.',
            ], 500);
        }
    }

    /**
     * GET /api/geocode/area?lat=..&lng=..
     */
    public function areaFromCoords(Request $request, GeocoderService $geocoderService)
    {
        $validated = $request->validate([
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lng' => ['required', 'numeric', 'between:-180,180'],
        ]);

        try {
            $area = $geocoderService->areaName(
                (float) $validated['lat'],
                (float) $validated['lng'],
            );

            return response()->json([
                'area' => $area,
            ]);
        } catch (\Throwable $th) {
            return response()->json([
                'area' => null,
                'message' => 'Could not resolve area.',
            ], 502);
        }
    }
}