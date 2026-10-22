<?php

namespace App\Services\Chat;

use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Message;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class MessageService
{
    public function __construct(
        private AttachmentService $attachments,
        private ConversationBroadcastService $broadcaster,
        private PushNotificationService $push,
    ) {
    }

    /**
     * @param  UploadedFile[]  $files
     */
    public function send(
        Conversation $conversation,
        int $senderId,
        ?string $body,
        array $files,
        ?string $requestedType = null,
    ): Message {
        $storedPaths = [];

        try {
            $attachments = $this->attachments->store($conversation->id, $files);
            $storedPaths = array_column($attachments, 'path');

            $type = $attachments
                ? $this->attachments->determineMessageType($attachments)
                : ($requestedType ?? 'text');

            $message = DB::transaction(function () use ($conversation, $senderId, $body, $type, $attachments) {
                $message = Message::create([
                    'conversation_id' => $conversation->id,
                    'sender_id' => $senderId,
                    'type' => $type,
                    'body' => $body,
                    'attachments' => $attachments ?: null,
                ]);

                $preview = trim((string) $body);
                if ($preview === '') {
                    $preview = $this->attachments->preview($attachments, $type);
                }

                $conversation->update([
                    'last_message_at' => $message->created_at,
                    'last_message_preview' => $preview,
                ]);

                ConversationParticipant::query()
                    ->where('conversation_id', $conversation->id)
                    ->where('user_id', '!=', $senderId)
                    ->increment('unread_count');

                return $message;
            });
        } catch (\Throwable $e) {
            foreach ($storedPaths as $path) {
                Storage::disk('public')->delete($path);
            }
            throw $e;
        }

        $message->load('sender:id,name');
        $conversation->refresh()->load([
            'userOne:id,name,avatar,last_active_at,is_verified',
            'userTwo:id,name,avatar,last_active_at,is_verified',
        ]);

        $this->broadcaster->broadcastNewMessage($message, $conversation);
        $this->push->notifyRecipients($message, $conversation, $senderId);

        return $message;
    }

    public function delete(Message $message): void
    {
        $attachments = $message->attachments ?? [];
        $conversationId = $message->conversation_id;
        $messageId = $message->id;

        $message->delete();

        $this->attachments->deleteStored($attachments);
        $this->broadcaster->broadcastDeleted($messageId, $conversationId);
    }
}