<?php

namespace App\Services;

use App\Http\Resources\ConversationResource;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ConversationService
{
    public const SHARE_LIMIT = 50;

    // ---------------------------------------------------------------
    // Read — sidebar list
    // ---------------------------------------------------------------

    public function forUser(User $user): array
    {
        return $this->conversationsFor($user)
            ->map(fn(Conversation $c) => (new ConversationResource($c, [
                'viewer' => $user,
                'participant' => $c->participants->firstWhere('user_id', $user->id),
            ]))->resolve())
            ->values()
            ->all();
    }

    private function conversationsFor(User $user): Collection
    {
        return Conversation::query()
            ->where(fn($q) => $q->where('user_one_id', $user->id)
                ->orWhere('user_two_id', $user->id))
            ->whereHas('participants', fn($q) => $q
                ->where('user_id', $user->id)
                ->where('is_archived', false))
            ->with([
                'userOne:id,name,avatar,last_active_at,is_verified',
                'userTwo:id,name,avatar,last_active_at,is_verified',
                'participants',
                'messages' => fn($q) => $q->latest('created_at')->limit(1),
            ])
            ->orderByDesc('last_message_at')
            ->limit(self::SHARE_LIMIT)
            ->get();
    }

    // ---------------------------------------------------------------
    // Read — single conversation view (used by ConversationController::show)
    // ---------------------------------------------------------------

    /**
     * Load everything needed to render conversations/show for a viewer.
     *
     * @return array{
     *     id: string,
     *     name: string,
     *     avatarUrl: ?string,
     *     otherUserId: int|string|null,
     *     otherLastSeen: ?string,
     *     otherVerified: bool,
     *     messages: array
     * }
     *
     * @throws \Symfony\Component\HttpKernel\Exception\HttpException
     */
    public function openFor(Conversation $conversation, User $viewer): array
    {
        $viewerId = (int) $viewer->id;

        $participant = $conversation->participants()
            ->where('user_id', $viewerId)
            ->whereNull('deleted_at')
            ->first();

        abort_unless($participant, 403);

        $conversation->load([
            'userOne:id,name,avatar,last_active_at,is_verified',
            'userTwo:id,name,avatar,last_active_at,is_verified',
        ]);

        $recipient = $conversation->participants()
            ->where('user_id', '!=', $viewerId)
            ->whereNull('deleted_at')
            ->first();

        $this->markRead($participant);

        $messages = $conversation->messages()
            ->withTrashed()
            ->with([
                'sender:id,name',
                'reads:id,message_id,user_id',
                'attachments',
            ])
            ->orderBy('created_at')
            ->orderBy('id')
            ->get()
            ->map(fn($message) => (new MessageResource($message, [
                'viewerId' => $viewerId,
                'recipientId' => $recipient?->user_id,
                'recipientDeliveredAt' => $recipient?->last_delivered_at,
            ]))->resolve())
            ->values()
            ->all();

        $header = (new ConversationResource($conversation, [
            'viewer' => $viewer,
            'mode' => 'header',
        ]))->resolve();

        return [
            'id' => (string) $conversation->id,
            'name' => $header['name'],
            'avatarUrl' => $header['avatarUrl'],
            'otherUserId' => $header['otherUserId'],
            'otherLastSeen' => $conversation
                ->otherUserFor($viewerId)?->last_active_at?->toISOString(),
            'otherVerified' => $header['verified'],
            'messages' => $messages,
        ];
    }

    public function markRead(ConversationParticipant $participant): void
    {
        if ($participant->unread_count > 0) {
            $participant->update([
                'unread_count' => 0,
                'last_read_at' => now(),
            ]);
        }
    }

    // ---------------------------------------------------------------
    // Write — start a conversation
    // ---------------------------------------------------------------

    public function findOrCreateBetween(User $a, User $b): Conversation
    {
        $existing = Conversation::query()
            ->where(fn($q) => $q->where('user_one_id', $a->id)->where('user_two_id', $b->id))
            ->orWhere(fn($q) => $q->where('user_one_id', $b->id)->where('user_two_id', $a->id))
            ->first();

        if ($existing) {
            return $existing;
        }

        return DB::transaction(function () use ($a, $b) {
            $conv = Conversation::create([
                'user_one_id' => min($a->id, $b->id),
                'user_two_id' => max($a->id, $b->id),
                'last_message_at' => now(),
            ]);

            ConversationParticipant::insert([
                ['conversation_id' => $conv->id, 'user_id' => $a->id, 'unread_count' => 0, 'created_at' => now(), 'updated_at' => now()],
                ['conversation_id' => $conv->id, 'user_id' => $b->id, 'unread_count' => 0, 'created_at' => now(), 'updated_at' => now()],
            ]);

            return $conv;
        });
    }
}