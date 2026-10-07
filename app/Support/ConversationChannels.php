<?php

namespace App\Support;

/**
 * Canonical broadcast channel names for the conversation system.
 * Mirrors channel authorization in routes/channels.php and the
 * subscription names in resources/js.
 */
final class ConversationChannels
{
    public static function conversation(int|string $conversationId): string
    {
        return "conversation.{$conversationId}";
    }

    public static function user(int|string $userId): string
    {
        return "user.{$userId}";
    }
}