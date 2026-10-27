<?php

namespace App\Http\Resources;

use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
{
    private const ONLINE_WINDOW_MINUTES = 5;

    public function __construct(Conversation $resource, private array $options)
    {
        parent::__construct($resource);
    }

    public function toArray(Request $request): array
    {
        $conversation = $this->resource;
        $viewer = $this->options['viewer'];
        $mode = $this->options['mode'] ?? 'list';
        $participant = $this->options['participant'] ?? null;
        $lastMessage = $this->options['lastMessage'] ?? $conversation->latestMessage;
        $otherUser = $conversation->otherUserFor($viewer->id);
        $otherParticipant = $otherUser
            ? $conversation->participants->firstWhere('user_id', $otherUser->id)
            : null;

        // Data required by chat header
        $base = [
            'id' => (int) $conversation->id,
            'name' => $otherUser?->name ?? 'Unknown',
            'avatarUrl' => $otherUser->avatar_url ? $this->avatarUrl($otherUser->avatar_url) : null,
            'online' => $this->isOnline($otherUser),
            'verified' => (bool) ($otherUser?->is_verified ?? false),
            'otherUserId' => $otherUser?->id,
        ];

        if ($mode === 'header') {
            return $base;
        }

        if ($lastMessage) {
            $buildLastMessage = [
                'lastMessageId' => $lastMessage?->id ?? null,
                'lastMessage' => $lastMessage->body ?? '',
                'lastMessageAt' => $lastMessage->created_at?->toISOString() ?? null,
                'lastMessageSenderId' => $lastMessage?->sender_id,
                'lastMessageStatus' => $this->status($lastMessage, $viewer, $otherParticipant),
                'time' => $lastMessage->created_at?->diffForHumans(short: true) ?? '',
                'unread' => (int) ($participant->unread_count ?? 0),
            ];
        }

        return array_merge($base, $buildLastMessage ?? []);
    }

    public function toBroadcastPayload(): array
    {
        $lastMessage = $this->options['lastMessage'] ?? $this->resource->messages->first();
        $array = $this->toArray(request());
        $array['time'] = $lastMessage?->created_at?->format('H:i') ?? '';
        return $array;
    }

    private function avatarUrl(?string $avatar): ?string
    {
        if (!is_string($avatar) || $avatar === '')
            return null;
        if (str_starts_with($avatar, 'http://') || str_starts_with($avatar, 'https://'))
            return $avatar;
        if (str_starts_with($avatar, '/'))
            return $avatar;
        return asset('storage/' . ltrim($avatar, '/'));
    }

    private function isOnline(?User $user): bool
    {
        return (bool) ($user?->last_active_at?->gt(
            now()->subMinutes(self::ONLINE_WINDOW_MINUTES)
        ) ?? false);
    }

    private function status(
        ?Message $lastMessage,
        User $viewer,
        ?ConversationParticipant $otherParticipant
    ): ?string {
        if (!$lastMessage || (string) $lastMessage->sender_id !== (string) $viewer->id) {
            return null;
        }

        if (!$otherParticipant) {
            return 'sent';
        }

        return $lastMessage->tickStateFor($otherParticipant->user_id);
    }
}