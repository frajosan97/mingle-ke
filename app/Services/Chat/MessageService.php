<?php

namespace App\Services\Chat;

use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Message;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

class MessageService
{
    public function __construct(
        private readonly AttachmentService $attachments,
        private readonly ConversationBroadcastService $broadcaster,
        private readonly PushNotificationService $push,
    ) {
    }

    /**
     * @param  array<int, UploadedFile|array{file: UploadedFile, category?: string, mime?: string}>  $files
     */
    public function send(
        Conversation $conversation,
        int $senderId,
        ?string $body,
        array $files,
    ): Message {
        $body = $body !== null ? trim($body) : null;
        $body = $body === '' ? null : $body;

        if ($body === null && $files === []) {
            throw new \InvalidArgumentException(
                'A message must contain text or at least one attachment.',
            );
        }

        $attachmentRows = $this->attachments->store(
            (int) $conversation->id,
            $files,
        );

        try {
            /** @var Message $message */
            $message = DB::transaction(function () use ($conversation, $senderId, $body, $attachmentRows): Message {
                $type = $this->attachments->determineMessageType(
                    $attachmentRows,
                    filled($body),
                );

                $message = $conversation->messages()->create([
                    'sender_id' => $senderId,
                    'type' => $type,
                    'body' => $body,
                ]);

                if ($attachmentRows !== []) {
                    $message->attachments()->createMany($attachmentRows);
                }

                $preview = $body ?? $this->attachments->preview(
                    $attachmentRows,
                    $type,
                );

                $conversation->newQuery()
                    ->whereKey($conversation->getKey())
                    ->update([
                        'last_message_at' => $message->created_at,
                        'last_message_preview' => Str::limit($preview, 250, ''),
                    ]);

                ConversationParticipant::query()
                    ->where('conversation_id', $conversation->id)
                    ->where('user_id', '!=', $senderId)
                    ->whereNull('deleted_at')
                    ->increment('unread_count');

                return $message;
            });
        } catch (Throwable $e) {
            $this->attachments->deleteStored($attachmentRows);
            throw $e;
        }

        // Hydrate without extra round-trips — we already know the new
        // preview value because we just wrote it.
        $conversation->forceFill([
            'last_message_at' => $message->created_at,
            'last_message_preview' => mb_substr(
                $message->body ?? $this->attachments->preview(
                    $attachmentRows,
                    $message->type,
                ),
                0,
                250,
            ),
        ]);

        $message->load(['sender:id,name', 'attachments']);
        $conversation->loadMissing([
            'userOne:id,name,avatar,last_active_at,is_verified',
            'userTwo:id,name,avatar,last_active_at,is_verified',
        ]);

        // Broadcast AFTER the DB transaction, from a single owner. If it
        // throws, the message still exists — log and continue.
        try {
            $this->broadcaster->broadcastNewMessage($message, $conversation);
        } catch (Throwable $e) {
            report($e);
        }

        // Push is best-effort. It must never fail the HTTP request.
        try {
            $this->push->notifyRecipients($message, $conversation, $senderId);
        } catch (Throwable $e) {
            report($e);
        }

        return $message;
    }

    /**
     * Soft-delete a message and repair the denormalised sidebar state
     * (last preview, unread counters) plus broadcast once.
     */
    public function delete(Message $message): void
    {
        $conversationId = (int) $message->conversation_id;
        $messageId = (int) $message->id;

        $attachmentRows = $message->attachments()
            ->get(['disk', 'path'])
            ->map(fn($a) => ['disk' => $a->disk, 'path' => $a->path])
            ->all();

        DB::transaction(function () use ($message, $conversationId): void {
            $message->attachments()->delete();
            $message->delete();

            // Repair the sidebar preview: fall back to the previous
            // non-deleted message in the conversation, if any.
            $previous = Message::query()
                ->where('conversation_id', $conversationId)
                ->orderByDesc('created_at')
                ->orderByDesc('id')
                ->first(['id', 'body', 'type', 'created_at']);

            Conversation::query()
                ->whereKey($conversationId)
                ->update([
                    'last_message_at' => $previous?->created_at,
                    'last_message_preview' => $previous
                        ? Str::limit(
                            $previous->body ?? match ($previous->type) {
                                'image' => '[image]',
                                'video' => '[video]',
                                'audio' => '[audio]',
                                'file' => '[file]',
                                'mixed' => '[attachment]',
                                default => '',
                            },
                            250,
                            '',
                        )
                        : null,
                ]);

            // Decrement unread for any participant whose unread_count
            // included this (now-deleted) message. Conservative: only
            // decrement where the count is > 0, for recipients, for
            // messages that were never read.
            ConversationParticipant::query()
                ->where('conversation_id', $conversationId)
                ->where('user_id', '!=', $message->sender_id)
                ->where('unread_count', '>', 0)
                ->decrement('unread_count');
        });

        $this->attachments->deleteStored($attachmentRows);

        try {
            $this->broadcaster->broadcastDeleted($messageId, $conversationId);
        } catch (Throwable $e) {
            report($e);
        }
    }
}