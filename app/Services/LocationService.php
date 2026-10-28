<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Request;

class LocationService
{
    /**
     * Persist location for an authenticated user, or stash it for a guest.
     *
     * @param  array{lat: float|int|string, lng: float|int|string}  $coords
     */
    public function update(?User $user, array $coords): void
    {
        if ($user) {
            $user->forceFill([
                'lat' => (float) $coords['lat'],
                'lng' => (float) $coords['lng'],
                'last_active_at' => now(),
            ])->save();
            $user->refresh();

            return;
        }

        session([
            'guest_lat' => (float) $coords['lat'],
            'guest_lng' => (float) $coords['lng'],
        ]);
    }

    /**
     * Resolve [lat, lng] for the current request context (user or guest).
     * Returns null when either coordinate is missing.
     *
     * @return array{lat: float, lng: float}|null
     */
    public function resolve(Request $request): ?array
    {
        $user = $request->user();

        $lat = $user?->lat ?? session('guest_lat');
        $lng = $user?->lng ?? session('guest_lng');

        if ($lat === null || $lng === null) {
            return null;
        }

        return ['lat' => (float) $lat, 'lng' => (float) $lng];
    }

    /**
     * Whether the current request context has usable coordinates.
     */
    public function hasCoords(Request $request): bool
    {
        return $this->resolve($request) !== null;
    }
}