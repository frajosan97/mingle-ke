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
            'sender_id' => $this->sender_id,
            'sender_name' => $this->sender?->name ?? 'Unknown',
            'type' => $this->type,
            'body' => $this->body,
            'attachments' => $this->attachments ?? [],
            'created_at' => $this->created_at->toISOString(),
            'time' => $this->created_at->format('H:i'),
        ];
    }
}