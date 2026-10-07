<?php

namespace App\Events;

use App\Models\Conversation;
use App\Models\User;
use App\Support\ConversationChannels;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ConversationRead implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Conversation $conversation,
        public User $user,
    ) {
    }

    /**
     * Broadcast to:
     *   1. The conversation channel — so any participant currently
     *      viewing the thread sees the read confirmation.
     *   2. The peer's personal channel — so the sender receives the
     *      read receipt even if they've navigated away from the thread.
     *
     * @return PrivateChannel[]
     */
    public function broadcastOn(): array
    {
        $reader = $this->user;

        $peerId = $this->conversation->user_one_id === $reader->id
            ? $this->conversation->user_two_id
            : $this->conversation->user_one_id;

        return [
            new PrivateChannel(
                ConversationChannels::conversation($this->conversation->id)
            ),
            new PrivateChannel(
                ConversationChannels::user($peerId)
            ),
        ];
    }

    public function broadcastAs(): string
    {
        return 'conversation.read';
    }

    public function broadcastWith(): array
    {
        return [
            'conversation_id' => $this->conversation->id,
            'user_id' => $this->user->id,
            'read_at' => now()->toISOString(),
        ];
    }
}