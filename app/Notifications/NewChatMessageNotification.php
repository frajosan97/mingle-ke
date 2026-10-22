<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class NewChatMessageNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $senderName,
        public string $messagePreview,
        public string $conversationUrl,
        public int $conversationId,
    ) {
        Log::info('Chat push notification initialized.', [
            'sender' => $senderName,
            'conversation_id' => $conversationId,
        ]);
    }

    public function via(object $notifiable): array
    {
        Log::info('Chat push notification: via() reached.', [
            'recipient_id' => $notifiable->getKey(),
            'conversation_id' => $this->conversationId,
        ]);

        return [
            WebPushChannel::class,
        ];
    }

    public function toWebPush(
        object $notifiable,
        Notification $notification
    ): WebPushMessage {
        Log::info('Chat push notification: toWebPush() reached.', [
            'recipient_id' => $notifiable->getKey(),
            'conversation_id' => $this->conversationId,
            'preview' => $this->messagePreview,
        ]);

        return (new WebPushMessage())
            ->title("New message from {$this->senderName}")
            ->body($this->messagePreview)
            ->icon('/favicon.ico')
            ->tag("conversation-{$this->conversationId}")
            ->data([
                'url' => $this->conversationUrl,
                'conversation_id' => $this->conversationId,
                'type' => 'chat_message',
            ]);
    }
}
