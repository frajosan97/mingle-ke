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

class MessageSent implements ShouldBroadcast
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
        return 'message.sent';
    }

    public function broadcastWith(): array
    {
        $m = $this->message;
        $sender = $m->sender;

        // `attachments` is a JSON-cast array on the model; `attachmentList()`
        // normalizes it and is safe even if the column is null.
        $attachments = method_exists($m, 'attachmentList')
            ? $m->attachmentList()
            : (array) ($m->attachments ?? []);

        return [
            'id' => $m->id,
            'conversation_id' => $m->conversation_id,
            'sender_id' => $m->sender_id,
            'sender' => [
                'id' => $sender->id,
                'name' => $sender->name,
                'avatar' => $sender->avatar,
                'tier' => $sender->tier,
                'is_verified' => (bool) $sender->is_verified,
            ],
            'type' => $m->type,
            'body' => $m->body,
            'attachments' => $attachments,
            'coins_spent' => $m->coins_spent,
            'created_at' => optional($m->created_at)->toISOString(),
            'edited_at' => optional($m->edited_at)->toISOString(),
            'reads' => [],
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