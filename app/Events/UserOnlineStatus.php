<?php

namespace App\Events;

use App\Models\User;
use App\Support\ConversationChannels;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserOnlineStatus implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public User $user,
        public bool $isOnline,
        public ?string $lastActiveAt = null,
    ) {
    }

    public function broadcastOn(): array
    {
        // Broadcast to every peer, unconditionally. The recipient's
        // client decides whether to update their UI. Filtering by the
        // peer's own online status causes missed transitions when the
        // peer is idle, backgrounded, or their cache entry expired.
        return array_values(array_map(
            fn($id) => new PrivateChannel(ConversationChannels::user($id)),
            $this->user->conversationPeerIds()
        ));
    }

    public function broadcastAs(): string
    {
        return 'user.status';
    }

    public function broadcastWith(): array
    {
        return [
            'user_id' => $this->user->id,
            'is_online' => $this->isOnline,
            'last_active_at' => $this->lastActiveAt
                ?? optional($this->user->last_active_at)->toISOString(),
        ];
    }
}