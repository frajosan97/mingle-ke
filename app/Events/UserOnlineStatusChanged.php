<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserOnlineStatusChanged implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $userId,
        public string $name,
        public bool $isOnline,
        public ?string $lastSeen = null,
    ) {
    }

    public function broadcastOn(): array
    {
        return [new PresenceChannel('online-users')];
    }

    public function broadcastAs(): string
    {
        return 'UserOnlineStatusChanged';
    }

    public function broadcastWith(): array
    {
        return [
            'user_id' => $this->userId,
            'name' => $this->name,
            'is_online' => $this->isOnline,
            'last_seen' => $this->lastSeen,
        ];
    }
}