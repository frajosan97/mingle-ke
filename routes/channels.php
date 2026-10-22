<?php

use App\Models\ConversationParticipant;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| User Channels
|--------------------------------------------------------------------------
|
| Allow users to receive private events sent to their own channel.
| Used for real-time conversation list and unread-count updates.
|
*/
Broadcast::channel('user.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

/*
|--------------------------------------------------------------------------
| Conversation Channels
|--------------------------------------------------------------------------
|
| Allow only conversation participants to receive private messages,
| read receipts, delivery updates, and message deletion events.
|
*/
Broadcast::channel('conversation.{conversationId}', function ($user, $conversationId) {
    return ConversationParticipant::query()
        ->where('conversation_id', $conversationId)
        ->where('user_id', $user->id)
        ->exists();
});

/*
|--------------------------------------------------------------------------
| Presence Conversation Channels
|--------------------------------------------------------------------------
|
| Allow participants to join a presence channel and share the basic
| identity information needed to display who is currently online.
|
*/
Broadcast::channel('presence-conversation.{conversationId}', function ($user, $conversationId) {
    $isParticipant = ConversationParticipant::query()
        ->where('conversation_id', $conversationId)
        ->where('user_id', $user->id)
        ->exists();

    if (!$isParticipant) {
        return false;
    }

    return [
        'id' => $user->id,
        'name' => $user->name,
    ];
});