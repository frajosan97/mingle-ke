<?php

use App\Models\ConversationParticipant;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| User Channels
|--------------------------------------------------------------------------
|
| Used for real-time conversation list updates (MessageSent, MessageRead,
| MessageDelivered are all broadcast to user.{id} for the sidebar).
|
*/

Broadcast::channel('user.{userId}', function ($user, $userId) {
    return $user !== null
        && !$user->trashed()
        && (int) $user->id === (int) $userId;
});

/*
|--------------------------------------------------------------------------
| Conversation Channels
|--------------------------------------------------------------------------
|
| Active participants only. Soft-deleted participants ("left" the
| conversation) must NOT receive message events.
|
*/

Broadcast::channel('conversation.{conversationId}', function ($user, $conversationId) {
    return ConversationParticipant::query()
        ->where('conversation_id', $conversationId)
        ->where('user_id', $user->id)
        ->whereNull('deleted_at')
        ->exists();
});

/*
|--------------------------------------------------------------------------
| Presence Conversation Channels
|--------------------------------------------------------------------------
|
| Same rule as the conversation channel: soft-deleted participants are
| not present.
|
*/

Broadcast::channel('presence-conversation.{conversationId}', function ($user, $conversationId) {
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
});