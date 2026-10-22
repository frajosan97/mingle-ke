<?php

namespace App\Services;

use App\Data\SharedConversationData;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Support\Collection;

class ConversationShareService
{
    public const LIMIT = 50;

    /**
     * @return array<int, array<string, mixed>>
     */
    public function forUser(User $user): array
    {
        return $this->conversations($user)
            ->map(fn(Conversation $c) => $this->transform($c, $user)->toArray())
            ->values()
            ->all();
    }

    private function conversations(User $user): Collection
    {
        return Conversation::query()
            ->where(function ($query) use ($user) {
                $query->where('user_one_id', $user->id)
                    ->orWhere('user_two_id', $user->id);
            })
            ->whereHas('participants', function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->where('is_archived', false);
            })
            ->with([
                'userOne:id,name,avatar,last_active_at,is_verified',
                'userTwo:id,name,avatar,last_active_at,is_verified',
                'participants',
                'messages' => fn($q) => $q->latest('created_at')->limit(1),
            ])
            ->orderByDesc('last_message_at')
            ->limit(self::LIMIT)
            ->get();
    }

    private function transform(Conversation $conversation, User $user): SharedConversationData
    {
        $otherUser = (string) $conversation->user_one_id === (string) $user->id
            ? $conversation->userTwo
            : $conversation->userOne;

        $myParticipant = $conversation->participants->firstWhere('user_id', $user->id);

        $otherParticipant = $otherUser
            ? $conversation->participants->firstWhere('user_id', $otherUser->id)
            : null;

        $lastMessage = $conversation->messages->first();
        $lastMessageSenderId = $lastMessage?->sender_id;

        return new SharedConversationData(
            id: $conversation->id,
            name: $otherUser?->name ?? 'Unknown',
            lastMessage: $conversation->last_message_preview ?? '',
            lastMessageAt: $conversation->last_message_at?->toISOString(),
            lastMessageSenderId: $lastMessageSenderId,
            lastMessageStatus: $this->status($lastMessage, $user, $otherParticipant),
            time: $conversation->last_message_at?->diffForHumans(short: true) ?? '',
            unread: $myParticipant?->unread_count ?? 0,
            avatarUrl: $otherUser?->avatar,
            online: $otherUser?->last_active_at?->gt(now()->subMinutes(5)) ?? false,
            verified: (bool) $otherUser?->is_verified,
            otherUserId: $otherUser?->id,
        );
    }

    private function status($lastMessage, User $user, $otherParticipant): ?string
    {
        if (!$lastMessage || (string) $lastMessage->sender_id !== (string) $user->id) {
            return null;
        }

        if (!$otherParticipant || !$lastMessage->created_at) {
            return 'sent';
        }

        $createdAt = $lastMessage->created_at;

        if ($otherParticipant->last_read_at && $otherParticipant->last_read_at >= $createdAt) {
            return 'read';
        }

        if ($otherParticipant->last_delivered_at && $otherParticipant->last_delivered_at >= $createdAt) {
            return 'delivered';
        }

        return 'sent';
    }
}