<?php

namespace App\Services;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ConversationService
{
    public function query(Request $request, User $user): LengthAwarePaginator
    {
        $search = $request->string('search')->toString();
        $archived = $request->has('archived') ? $request->boolean('archived') : false;
        $muted = $request->has('muted') ? $request->boolean('muted') : null;

        $participantSub = DB::table('conversation_participants')
            ->select('conversation_id', 'unread_count', 'is_muted', 'is_archived', 'last_read_at')
            ->where('user_id', $user->id);

        return Conversation::query()
            ->select('conversations.*')
            ->joinSub($participantSub, 'p', 'p.conversation_id', '=', 'conversations.id')
            ->with([
                'userOne:id,name,avatar,tier,is_verified,last_active_at,bio,area',
                'userTwo:id,name,avatar,tier,is_verified,last_active_at,bio,area',
                'latestMessage' => fn($q) => $q
                    ->select(
                        'messages.id',
                        'messages.conversation_id',
                        'messages.sender_id',
                        'messages.type',
                        'messages.body',
                        'messages.attachments',
                        'messages.created_at',
                        'messages.delivered_at',
                    )
                    ->with('reads:id,message_id,user_id,read_at'),
            ])
            ->addSelect(['p.unread_count', 'p.is_muted', 'p.is_archived'])
            ->when($archived === false, fn($q) => $q->where('p.is_archived', false))
            ->when($archived === true, fn($q) => $q->where('p.is_archived', true))
            ->when($muted === true, fn($q) => $q->where('p.is_muted', true))
            ->when($muted === false, fn($q) => $q->where('p.is_muted', false))
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($w) use ($search) {
                    $w->where('conversations.last_message_preview', 'like', "%{$search}%")
                        ->orWhereHas('userOne', fn($u) => $u->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('userTwo', fn($u) => $u->where('name', 'like', "%{$search}%"));
                });
            })
            ->orderByDesc('conversations.last_message_at')
            ->orderByDesc('conversations.id')
            ->paginate(30)
            ->withQueryString();
    }

    public function startBetween(User $me, User $other): Conversation
    {
        return Conversation::between($me, $other);
    }

    public function latestMessages(Conversation $conversation, int $limit = 50): array
    {
        return Message::query()
            ->forConversation($conversation)
            ->with([
                'sender:id,name,avatar,tier,is_verified',
                'reads:id,message_id,user_id,read_at',
            ])
            ->latestFirst()
            ->limit($limit)
            ->get()
            ->reverse()
            ->values()
            ->all();
    }

    public function delete(Conversation $conversation): void
    {
        DB::transaction(function () use ($conversation) {
            $conversation->messages()->delete();
            $conversation->participants()->delete();
            $conversation->delete();
        });
    }
}