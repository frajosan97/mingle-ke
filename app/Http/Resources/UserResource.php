<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'avatar' => $this->avatar,
            'tier' => $this->tier,
            'is_verified' => (bool) $this->is_verified,
            'last_active_at' => $this->last_active_at,
            'bio' => $this->when(isset($this->bio), $this->bio),
            'area' => $this->when(isset($this->area), $this->area),
        ];
    }
}