<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'conversation_id' => $this->conversation_id,
            'body' => $this->body,
            'created_at' => $this->created_at,
            'sender' => new UserResource($this->whenLoaded('sender')),
            'reads' => $this->whenLoaded('reads', fn() => $this->reads->map(fn($r) => [
                'user_id' => $r->user_id,
                'read_at' => $r->read_at,
            ])),
        ];
    }
}