<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EscortResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'avatar' => $this->avatar,
            'tier' => $this->tier,
            'is_verified' => (bool) $this->is_verified,
            'area' => $this->area,
            'bio' => $this->bio,
            'age' => $this->age,
            'gender' => $this->gender,
            'last_active_at' => optional($this->last_active_at)->toISOString(),

            // Present only when the caller supplied coords.
            'distance_km' => $this->when(
                isset($this->distance_km),
                fn() => round((float) $this->distance_km, 2)
            ),

            // Public profile subset — only if loaded.
            'profile' => $this->whenLoaded('profile', fn() => $this->profile ? [
                'headline' => $this->profile->headline ?? null,
                'occupation' => $this->profile->occupation ?? null,
                'languages' => $this->profile->languages ?? null,
                'photos' => $this->profile->photos ?? null,
            ] : null),
        ];
    }
}