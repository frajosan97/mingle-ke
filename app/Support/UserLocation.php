<?php

namespace App\Support;

use Illuminate\Http\Request;

class UserLocation
{
    public static function from(Request $request): ?array
    {
        // 1. Logged-in user's stored coords (on users table, not profile).
        if ($user = $request->user()) {
            if ($user->lat != null && $user->lng != null) {
                return [
                    'lat' => (float) $user->lat,
                    'lng' => (float) $user->lng,
                    'source' => 'profile',
                ];
            }
        }

        // 2. Header injected by CaptureUserLocation middleware.
        if ($loc = $request->attributes->get('user_location')) {
            return $loc;
        }

        return null;
    }
}