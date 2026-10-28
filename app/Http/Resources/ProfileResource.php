<?php

namespace App\Http\Resources;

use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * @mixin User
 */
class ProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var User $user */
        $user = $this->resource;

        /** @var UserProfile|null $profile */
        $profile = $user->relationLoaded('profile') ? $user->profile : null;
        $isEscort = $profile !== null;

        return [
            // ── Identity ─────────────────────────────────────────────
            'id' => $user->id,
            'name' => $user->name,
            'age' => $user->age,
            'gender' => $user->gender,
            'bio' => $user->bio,
            'avatarUrl' => $user->avatar_url,
            'locationName' => $this->shortArea($user->area),
            'area' => $user->area,
            'lat' => $user->lat,
            'lng' => $user->lng,

            // ── Presence / trust ─────────────────────────────────────
            'isEscort' => $isEscort,
            'isVip' => $isEscort && $user->tier === 'premium',
            'verified' => (bool) $user->is_verified,
            'online' => $user->last_active_at?->gt(now()->subMinutes(5)) ?? false,
            'memberSince' => $user->created_at?->toIso8601String(),

            // ── Escort profile (null when not an escort) ─────────────
            'profile' => $isEscort ? $this->profilePayload($profile) : null,

            // ── Reviews (only if eager-loaded) ───────────────────────
            'reviews' => $user->relationLoaded('reviewsReceived')
                ? $user->reviewsReceived->map(fn($r) => [
                    'id' => $r->id,
                    'rating' => (int) $r->rating,
                    'comment' => $r->comment,
                    'reviewerName' => $r->reviewer?->name,
                    'createdAt' => $r->created_at?->toIso8601String(),
                ])->values()
                : [],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function profilePayload(UserProfile $profile): array
    {
        return [
            // Physical
            'orientation' => $profile->orientation,
            'heightCm' => $profile->height_cm,
            'weightKg' => $profile->weight_kg,
            'bodyType' => $profile->body_type,
            'hairColor' => $profile->hair_color,
            'eyeColor' => $profile->eye_color,
            'ethnicity' => $profile->ethnicity,
            'smoking' => (bool) $profile->smoking,
            'drinking' => (bool) $profile->drinking,

            // Offering
            'services' => $profile->services ?? [],
            'incall' => (bool) $profile->incall,
            'outcall' => (bool) $profile->outcall,
            'currency' => $profile->currency,

            // Rates
            'rates' => [
                '15min' => $profile->rate_15min,
                '30min' => $profile->rate_30min,
                '1hour' => $profile->rate_1hour,
                'night' => $profile->rate_night,
            ],

            // Availability
            'isAvailable' => (bool) $profile->is_available,
            'availabilityStatus' => $profile->availability_status ?? 'offline',

            // Media
            'coverImageUrl' => $profile->cover_image
                ? Storage::url($profile->cover_image)
                : null,
            'gallery' => collect($profile->gallery ?? [])
                ->map(fn($path) => Storage::url($path))
                ->values()
                ->all(),

            // Stats / moderation
            'isApproved' => (bool) $profile->is_approved,
            'isFeatured' => (bool) $profile->is_featured,
            'profileViews' => (int) $profile->profile_views,
            'ratingCount' => (int) $profile->rating_count,
            'ratingAvg' => (float) $profile->rating_avg,
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