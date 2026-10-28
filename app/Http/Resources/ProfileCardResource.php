<?php

namespace App\Http\Resources;

use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
class ProfileCardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var User $user */
        $user = $this->resource;

        /** @var UserProfile|null $profile */
        $profile = $user->relationLoaded('profile') ? $user->profile : null;
        $isEscort = $profile !== null;

        $me = $request->user();

        return [
            'id' => $user->id,
            'name' => $user->name,
            'age' => $user->age,
            'gender' => $user->gender,
            'bio' => $user->bio,
            'avatarUrl' => $user->avatar_url,
            'distanceKm' => round((float) ($user->distance_km ?? 0), 1),
            'locationName' => $this->shortArea($user->area),
            'isEscort' => $isEscort,
            'isVip' => $isEscort && $user->tier === 'premium',

            // Escort details
            'services' => $isEscort ? ($profile->services ?? []) : [],
            'available' => $isEscort && (bool) $profile->is_available,
            'availabilityStatus' => $isEscort
                ? ($profile->availability_status ?? 'offline')
                : 'offline',
            'rate1Hour' => $isEscort ? $profile->rate_1hour : null,
            'ratingAvg' => $isEscort ? (float) $profile->rating_avg : 0.0,

            // Trust / activity
            'verified' => (bool) $user->is_verified,
            'online' => $user->last_active_at?->gt(now()->subMinutes(5)) ?? false,

            // Relationship state
            'isLiked' => $me ? $me->hasLiked($user) : false,
        ];
    }

    private function shortArea(?string $area): string
    {
        if (!$area) {
            return 'Kenya';
        }
        return trim(explode(',', $area)[0]);
    }
}