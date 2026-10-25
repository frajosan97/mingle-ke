<?php

use App\Models\ConversationParticipant;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| User Channels
|--------------------------------------------------------------------------
|
| Used for private sidebar events:
| MessageSent, MessageRead, MessageDelivered, etc.
|
*/

Broadcast::channel('user.{userId}', function ($user, $userId) {
    return $user !== null
        && !$user->trashed()
        && (int) $user->id === (int) $userId;
});

/*
|--------------------------------------------------------------------------
| Private Conversation Channel
|--------------------------------------------------------------------------
|
| Only active participants can receive conversation events.
|
*/

Broadcast::channel(
    'conversation.{conversationId}',
    function ($user, $conversationId) {
        if ($user === null || $user->trashed()) {
            return false;
        }

        return ConversationParticipant::query()
            ->where('conversation_id', $conversationId)
            ->where('user_id', $user->id)
            ->whereNull('deleted_at')
            ->exists();
    }
);

/*
|--------------------------------------------------------------------------
| Conversation Presence Channel
|--------------------------------------------------------------------------
|
| Only active participants may join and appear in presence membership.
|
*/

Broadcast::channel(
    'conversation-presence.{conversationId}',
    function ($user, $conversationId) {
        if ($user === null || $user->trashed()) {
            return false;
        }

        $isParticipant = ConversationParticipant::query()
            ->where('conversation_id', $conversationId)
            ->where('user_id', $user->id)
            ->whereNull('deleted_at')
            ->exists();

        if (!$isParticipant) {
            return false;
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
        ];
    }
);

Broadcast::channel('online-users', function ($user) {
    if (!$user || $user->trashed()) {
        return false;
    }

    return [
        'id' => (int) $user->id,
        'name' => $user->name,
    ];
});