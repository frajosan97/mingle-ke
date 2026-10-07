<?php

namespace App\Notifications;

use App\Models\Message;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;
use NotificationChannels\WebPush\WebPushMessage;

class NewMessageNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public int $messageId)
    {
    }

    public function via($notifiable): array
    {
        return [WebPushChannel::class];
    }

    public function toWebPush($notifiable, $notification): WebPushMessage
    {
        $message = Message::with('sender:id,name,avatar')->find($this->messageId);

        // Message may have been deleted between dispatch and send.
        if (!$message) {
            return (new WebPushMessage)
                ->title('New message')
                ->body('You have a new message.')
                ->tag('message-deleted')
                ->data(['url' => '/conversations']);
        }

        $sender = $message->sender;
        $name = $sender?->name ?? 'Someone';

        $body = $message->body
            ?: match ($message->type) {
                'image' => '📷 Photo',
                'audio' => '🎤 Voice message',
                'video' => '🎥 Video',
                'file' => '📎 Attachment',
                default => 'New message',
            };

        return (new WebPushMessage)
            ->title($name)
            ->icon($sender?->avatar ?: '/icons/icon-192.png')
            ->body(\Str::limit($body, 120))
            ->tag("conversation-{$message->conversation_id}")
            ->renotify()
            ->data([
                'url' => '/conversations/' . $message->conversation_id,
                'conversation_id' => $message->conversation_id,
                'message_id' => $message->id,
            ])
            ->options(['TTL' => 3600]);
    }
}