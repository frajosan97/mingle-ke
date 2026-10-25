<?php

namespace App\Services\Chat;

use App\Events\MessageDeleted;
use App\Events\MessageDelivered;
use App\Events\MessageRead;
use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Message;
use Illuminate\Support\Collection;

class ConversationBroadcastService
{

    public function broadcastNewMessage(
        Message $message,
        Conversation $conversation,
    ): void {
        $participants = ConversationParticipant::query()
            ->where('conversation_id', $conversation->id)
            ->whereNull('deleted_at')
            ->get(['user_id']);

        foreach ($participants as $participant) {
            $userId = (int) $participant->user_id;
            $isSender = $userId === (int) $message->sender_id;

            broadcast(new MessageSent(
                message: $message,
                recipientId: $userId,
                includeConversationChannel: !$isSender,
            ));
        }
    }


    /**
     * @param  Collection<int, mixed>|array<int, mixed>  $messageIds
     */
    public function broadcastReadMany(
        Conversation $conversation,
        int $viewerId,
        Collection|array $messageIds,
    ): void {
        $this->broadcastStatusMany($conversation, $viewerId, $messageIds, 'read');
    }

    /**
     * @param  Collection<int, mixed>|array<int, mixed>  $messageIds
     */
    public function broadcastDeliveredMany(
        Conversation $conversation,
        int $viewerId,
        Collection|array $messageIds,
    ): void {
        $this->broadcastStatusMany($conversation, $viewerId, $messageIds, 'delivered');
    }

    public function broadcastRead(Message $message, int $viewerId): void
    {
        if ((int) $message->sender_id === $viewerId) {
            return;
        }
        broadcast(new MessageRead($message, $viewerId))->toOthers();
    }

    public function broadcastDelivered(Message $message, int $viewerId): void
    {
        if ((int) $message->sender_id === $viewerId) {
            return;
        }
        broadcast(new MessageDelivered($message, $viewerId))->toOthers();
    }

    public function broadcastDeleted(int $messageId, int $conversationId): void
    {
        broadcast(new MessageDeleted($messageId, $conversationId))->toOthers();
    }

    /**
     * @param  Collection<int, mixed>|array<int, mixed>  $messageIds
     */
    private function broadcastStatusMany(
        Conversation $conversation,
        int $viewerId,
        Collection|array $messageIds,
        string $status,
    ): void {
        /** @var Collection<int, int> $ids */
        $ids = collect($messageIds)
            ->map(fn($id) => (int) $id)
            ->filter(fn(int $id) => $id > 0)
            ->unique()
            ->values();

        if ($ids->isEmpty()) {
            return;
        }

        // Use the conversation relation so the analyser sees
        // Collection<int, Message>, not Collection<int, \stdClass>.
        $conversation->messages()
            ->whereIn('id', $ids->all())
            ->where('sender_id', '!=', $viewerId)
            ->get(['id', 'sender_id', 'conversation_id', 'created_at'])
            ->each(function (Message $message) use ($status, $viewerId): void {
                match ($status) {
                    'read' => $this->broadcastRead($message, $viewerId),
                    'delivered' => $this->broadcastDelivered($message, $viewerId),
                };
            });
    }
}