<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Request;

class LocationShareService
{
    public function forRequest(Request $request): array
    {
        $user = $request->user();

        return [
            'has_coords' => $user
                ? ($user->lat !== null && $user->lng !== null)
                : (session()->has('guest_lat') && session()->has('guest_lng')),
        ];
    }
}