<?php

namespace App\Services\Chat;

use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Message;
use App\Models\User;
use App\Notifications\NewChatMessageNotification;
use Illuminate\Support\Facades\Log;

class PushNotificationService
{
    public function __construct(private AttachmentService $attachments)
    {
    }

    public function notifyRecipients(Message $message, Conversation $conversation, int $senderId): void
    {
        try {
            $recipientIds = ConversationParticipant::query()
                ->where('conversation_id', $conversation->id)
                ->where('user_id', '!=', $senderId)
                ->whereNull('deleted_at')          // ← skip users who left
                ->pluck('user_id');

            $preview = trim((string) $message->body);
            if ($preview === '') {
                $preview = $this->attachments->preview(
                    $message->attachments->all(),  // ← was: ($message->attachments ?? [])
                    $message->type,
                );
            }
            $preview = mb_substr($preview, 0, 120);

            $senderName = $message->sender?->name ?? 'Someone';

            foreach (User::whereIn('id', $recipientIds)->get() as $recipient) {
                if (!$recipient->pushSubscriptions()->exists()) {
                    continue;
                }

                $recipient->notify(new NewChatMessageNotification(
                    senderName: $senderName,
                    messagePreview: $preview,
                    conversationUrl: url('/conversations/' . $conversation->id),
                    conversationId: (int) $conversation->id,
                ));
            }
        } catch (\Throwable $e) {
            Log::warning('Chat push notification failed.', [
                'conversation_id' => $conversation->id,
                'message_id' => $message->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}