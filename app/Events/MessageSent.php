<?php

namespace App\Events;

use App\Http\Resources\MessageResource;
use App\Models\Message;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Message $message,
        public int $recipientId,
        public bool $includeConversationChannel = true,
    ) {
    }

    public function broadcastOn(): array
    {
        $channels = [];

        if ($this->includeConversationChannel) {
            $channels[] = new PrivateChannel(
                'conversation.' . $this->message->conversation_id
            );
        }

        $channels[] = new PrivateChannel('user.' . $this->recipientId);

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'MessageSent';
    }

    public function broadcastWith(): array
    {
        $message = $this->message->loadMissing([
            'sender:id,name',
            'attachments',
        ]);

        return [
            'message' => (new MessageResource($message, [
                'viewerId' => $this->recipientId,
            ]))->resolve(),
        ];
    }
}
