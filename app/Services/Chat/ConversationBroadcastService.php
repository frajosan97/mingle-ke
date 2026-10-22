<?php

namespace App\Services\Chat;

use App\Events\ConversationUpdated;
use App\Events\MessageDeleted;
use App\Events\MessageRead as MessageReadEvent;
use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Message;

class ConversationBroadcastService
{
    public function broadcastNewMessage(Message $message, Conversation $conversation): void
    {
        $participants = ConversationParticipant::query()
            ->where('conversation_id', $conversation->id)
            ->get();

        foreach ($participants as $participant) {
            $participantUserId = (int) $participant->user_id;

            $otherUser = (int) $conversation->user_one_id === $participantUserId
                ? $conversation->userTwo
                : $conversation->userOne;

            broadcast(new ConversationUpdated(
                $participantUserId,
                $this->sidebarPayload(
                    $conversation,
                    $message,
                    $participant,
                    $otherUser,
                    $participantUserId,
                ),
            ));
        }

        broadcast(new MessageSent($message))->toOthers();
    }

    public function broadcastRead(Message $message, int $viewerId): void
    {
        broadcast(new MessageReadEvent($message, $viewerId))->toOthers();
    }

    public function broadcastDeleted(int $messageId, int $conversationId): void
    {
        broadcast(new MessageDeleted($messageId, $conversationId))->toOthers();
    }

    public function broadcastSidebarUpdate(int $userId, array $payload): void
    {
        broadcast(new ConversationUpdated($userId, $payload));
    }

    public function broadcastLastMessageStatus(
        Conversation $conversation,
        int $viewerId,
        string $status,
    ): void {
        $latest = Message::query()
            ->where('conversation_id', $conversation->id)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->first();

        if (!$latest || (int) $latest->sender_id === $viewerId) {
            return;
        }

        if ($latest->reads()->where('user_id', $viewerId)->exists()) {
            $status = 'read';
        }

        broadcast(new ConversationUpdated(
            (int) $latest->sender_id,
            ['id' => $conversation->id, 'lastMessageStatus' => $status],
        ));
    }

    private function sidebarPayload(
        Conversation $conversation,
        Message $message,
        ConversationParticipant $participant,
        $otherUser,
        int $participantUserId,
    ): array {
        return [
            'id' => $conversation->id,
            'name' => $otherUser?->name ?? 'Unknown',
            'lastMessage' => $conversation->last_message_preview,
            'time' => $message->created_at->format('H:i'),
            'lastMessageAt' => $message->created_at->toISOString(),
            'lastMessageSenderId' => (int) $message->sender_id,
            'lastMessageStatus' => (int) $message->sender_id === $participantUserId
                ? 'sent'
                : null,
            'unread' => (int) $participant->unread_count,
            'avatarUrl' => $otherUser?->avatar,
            'online' => (bool) ($otherUser?->last_active_at?->gt(now()->subMinutes(5)) ?? false),
            'verified' => (bool) ($otherUser?->is_verified ?? false),
            'otherUserId' => $otherUser?->id,
        ];
    }
}