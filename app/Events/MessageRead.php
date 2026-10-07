<?php

namespace App\Events;

use App\Models\Message;
use App\Models\User;
use App\Support\ConversationChannels;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageRead implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Message $message,
        public User $user,
        public ?string $readAt = null,
    ) {
    }

    /**
     * Broadcast to:
     *   1. The conversation channel — anyone with the thread open sees
     *      the tick transition in real time.
     *   2. The sender's personal channel — so the sender receives the
     *      read receipt even when they don't have the thread open.
     *
     * @return PrivateChannel[]
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel(
                ConversationChannels::conversation($this->message->conversation_id)
            ),
            new PrivateChannel(
                ConversationChannels::user($this->message->sender_id)
            ),
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.read';
    }

    public function broadcastWith(): array
    {
        return [
            'message_id' => $this->message->id,
            'conversation_id' => $this->message->conversation_id,
            'user_id' => $this->user->id,
            'read_at' => $this->readAt ?? now()->toISOString(),
        ];
    }
}