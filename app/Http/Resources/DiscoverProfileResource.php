<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * @mixin User
 *
 * Expects the following join-selected columns on the User model:
 *   - profile_id            (null when the user has no escort profile)
 *   - services              (JSON)
 *   - cover_image           (storage path, nullable)
 *   - availability_status
 *   - is_available
 *   - rate_1hour
 *   - rating_avg
 * and the dynamically-attached `distance_km` float.
 */
class DiscoverProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var User $user */
        $user = $this->resource;

        $isEscort = $user->profile_id !== null;

        return [
            'id' => $user->id,
            'name' => $user->name,
            'age' => $user->age,
            'gender' => $user->gender,
            'bio' => $user->bio,
            'avatarUrl' => $user->avatar_url ?? Storage::url($user->avatar) ?? null,
            'distanceKm' => round((float) ($user->distance_km ?? 0), 1),
            'isEscort' => $isEscort,
            'services' => $isEscort ? ($user->services ?? []) : [],
            'available' => $isEscort && (bool) $user->is_available,
            'availabilityStatus' => $isEscort ? $user->availability_status : 'offline',
            'rate1Hour' => $isEscort ? $user->rate_1hour : null,
            'ratingAvg' => $isEscort ? (float) $user->rating_avg : 0.0,
            'verified' => (bool) $user->is_verified,
            'online' => $user->last_active_at?->gt(now()->subMinutes(5)) ?? false,
        ];
    }
}