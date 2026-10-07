<?php

namespace App\Events;

use App\Models\Conversation;
use App\Models\Message;
use App\Support\ConversationChannels;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Message $message)
    {
    }

    /**
     * @return PrivateChannel[]
     */
    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel(
                ConversationChannels::conversation($this->message->conversation_id)
            ),
        ];

        $recipientId = $this->recipientId();

        if ($recipientId !== null) {
            $channels[] = new PrivateChannel(
                ConversationChannels::user($recipientId)
            );
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'message.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->message->id,
            'conversation_id' => $this->message->conversation_id,
            'body' => $this->message->body,
            'edited_at' => optional($this->message->edited_at)->toISOString(),
            // `attachments` intentionally omitted — edits don't change files.
            // If you ever allow attachment replacement on edit, add:
            // 'attachments' => $this->message->attachmentList(),
        ];
    }

    private function recipientId(): ?int
    {
        $conversation = $this->message->relationLoaded('conversation')
            ? $this->message->conversation
            : Conversation::find($this->message->conversation_id);

        if (!$conversation) {
            return null;
        }

        return $conversation->user_one_id === $this->message->sender_id
            ? $conversation->user_two_id
            : $conversation->user_one_id;
    }
}