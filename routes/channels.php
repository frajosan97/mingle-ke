<?php

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('user.{userId}', function (User $user, int $userId) {
    return (int) $user->id === $userId;
});

Broadcast::channel('conversation.{conversationId}', function (User $user, int $conversationId) {
    return Conversation::query()
        ->where('id', $conversationId)
        ->forUser($user)
        ->exists();
});