<?php
// app/Http/Middleware/CaptureUserLocation.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CaptureUserLocation
{
    public function handle(Request $request, Closure $next): Response
    {
        $raw = $request->header('X-User-Location');

        if ($raw) {
            [$lat, $lng, $source] = array_pad(explode(',', $raw, 3), 3, null);

            $lat = is_numeric($lat) ? (float) $lat : null;
            $lng = is_numeric($lng) ? (float) $lng : null;

            if (
                $lat !== null && $lng !== null
                && $lat >= -90 && $lat <= 90
                && $lng >= -180 && $lng <= 180
            ) {
                $location = [
                    'lat' => $lat,
                    'lng' => $lng,
                    'source' => $source ?: 'unknown',
                ];

                // 1. Keep it in attributes for raw access
                $request->attributes->set('user_location', $location);

                // 2. ALSO merge into the request so validate() sees it.
                //    Only fill missing fields — don't overwrite an explicit body.
                $request->mergeIfMissing([
                    'lat' => $lat,
                    'lng' => $lng,
                    'location_source' => $location['source'],
                ]);
            }
        }

        return $next($request);
    }
}