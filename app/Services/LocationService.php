<?php

namespace App\Services;

use Illuminate\Http\Request;
use Stevebauman\Location\Facades\Location;

class LocationService
{
    /**
     * Resolve approximate coordinates from the request IP.
     * Returns ['latitude' => float, 'longitude' => float] or null on failure.
     */
    public function fromRequest(Request $request): ?array
    {
        try {
            $ip = $request->ip();

            // Local dev: 127.0.0.1 resolves to nothing useful.
            if (in_array($ip, ['127.0.0.1', '::1'], true)) {
                return null;
            }

            $position = Location::get($ip);

            if (!$position || !$position->latitude || !$position->longitude) {
                return null;
            }

            return [
                'lat' => (float) $position->latitude,
                'lng' => (float) $position->longitude,
            ];
        } catch (\Throwable $e) {
            \Log::warning('IP geolocation failed', ['error' => $e->getMessage()]);
            return null;
        }
    }
}