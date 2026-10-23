<?php

namespace App\Services;

use App\Http\Resources\ConversationResource;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Support\Collection;

class ConversationShareService
{
    public const LIMIT = 50;

    public function forUser(User $user): array
    {
        return $this->conversations($user)
            ->map(fn(Conversation $c) => (new ConversationResource($c, [
                'viewer' => $user,
                'participant' => $c->participants->firstWhere('user_id', $user->id),
            ]))->resolve())
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
}