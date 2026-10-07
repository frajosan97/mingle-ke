<?php

namespace App\Events;

use App\Models\Conversation;
use App\Models\User;
use App\Support\ConversationChannels;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ConversationTyping implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Conversation $conversation,
        public User $user,
        public bool $isTyping = true,
    ) {
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel(
                ConversationChannels::conversation($this->conversation->id)
            ),
        ];
    }

    public function broadcastAs(): string
    {
        return 'conversation.typing';
    }

    public function broadcastWith(): array
    {
        return [
            'conversation_id' => $this->conversation->id,
            'user_id' => $this->user->id,
            'user_name' => $this->user->name,
            'is_typing' => $this->isTyping,
        ];
    }
}