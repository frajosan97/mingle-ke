<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $me = $request->user();
        $other = $me ? $this->otherUser($me) : null;

        return [
            'id' => $this->id,
            'user_one_id' => $this->user_one_id,
            'user_two_id' => $this->user_two_id,

            'user_one' => $this->whenLoaded('userOne', fn() => [
                'id' => $this->userOne->id,
                'name' => $this->userOne->name,
                'avatar' => $this->userOne->avatar,
                'tier' => $this->userOne->tier,
                'is_verified' => (bool) $this->userOne->is_verified,
                'last_active_at' => optional($this->userOne->last_active_at)->toISOString(),
            ]),

            'user_two' => $this->whenLoaded('userTwo', fn() => [
                'id' => $this->userTwo->id,
                'name' => $this->userTwo->name,
                'avatar' => $this->userTwo->avatar,
                'tier' => $this->userTwo->tier,
                'is_verified' => (bool) $this->userTwo->is_verified,
                'last_active_at' => optional($this->userTwo->last_active_at)->toISOString(),
            ]),

            // The peer, from the caller's perspective.
            'other_user' => $other ? [
                'id' => $other->id,
                'name' => $other->name,
                'avatar' => $other->avatar,
                'tier' => $other->tier,
                'is_verified' => (bool) $other->is_verified,
                'last_active_at' => optional($other->last_active_at)->toISOString(),
                'bio' => $other->bio,
                'area' => $other->area,
                'is_online' => method_exists($other, 'isOnline') ? $other->isOnline() : false,
            ] : null,

            'last_message_at' => optional($this->last_message_at)->toISOString(),
            'last_message_preview' => $this->last_message_preview,

            'latest_message' => $this->whenLoaded(
                'latestMessage',
                fn() =>
                    $this->latestMessage ? $this->latestMessagePayload($other) : null
            ),

            // Pivot values injected by ConversationService::query().
            'unread_count' => (int) ($this->unread_count ?? 0),
            'is_muted' => (bool) ($this->is_muted ?? false),
            'is_archived' => (bool) ($this->is_archived ?? false),

            // Only set by ConversationController::show() (API).
            'messages' => $this->when(
                isset($this->resource->messages),
                fn() => $this->resource->messages
            ),

            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
        ];
    }

    /**
     * Payload for the thread's most recent message, including the
     * metadata the frontend needs to render the tick:
     *
     *   - `delivered_at`      → double grey when set
     *   - `is_read_by_peer`   → double blue when true
     *
     * Both are only meaningful when the last message was sent by the
     * current viewer; the client decides whether to show a tick.
     */
    private function latestMessagePayload(?object $peer): array
    {
        $m = $this->latestMessage;

        return [
            'id' => $m->id,
            'sender_id' => $m->sender_id,
            'type' => $m->type,
            'body' => $m->body,
            'attachment' => $m->attachment,
            'created_at' => optional($m->created_at)->toISOString(),
            'delivered_at' => optional($m->delivered_at)->toISOString(),

            // Whether the peer has a read receipt for this message.
            // Requires `latestMessage.reads` to be eager-loaded;
            // otherwise falls back to `false` (shows as delivered).
            'is_read_by_peer' => $peer
                ? $m->reads->contains(fn($r) => $r->user_id === $peer->id)
                : false,
        ];
    }
}