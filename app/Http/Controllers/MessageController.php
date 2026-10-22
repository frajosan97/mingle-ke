<?php

namespace App\Http\Controllers;

use App\Events\ConversationUpdated;
use App\Events\MessageDeleted;
use App\Events\MessageRead as MessageReadEvent;
use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class MessageController extends Controller
{
    /**
     * Store a message with optional single or multiple attachments.
     */
    public function store(Request $request, Conversation $conversation)
    {
        $this->authorizeParticipant($conversation);

        $validated = $request->validate([
            'body' => [
                'nullable',
                'string',
                'max:5000',
                'required_without_all:attachment,attachments',
            ],

            'type' => [
                'nullable',
                'in:text,image,video,audio,file',
            ],

            // Backward compatibility with the existing frontend.
            'attachment' => [
                'nullable',
                'file',
                'max:10240',
                'mimes:jpg,jpeg,png,gif,webp,bmp,svg,mp4,mov,avi,webm,mp3,m4a,ogg,oga,wav,wave,aac,amr,3gp,pdf,txt,csv,doc,docx,xls,xlsx,ppt,pptx,zip',
            ],

            // Multiple attachments from the updated frontend.
            'attachments' => [
                'nullable',
                'array',
                'max:10',
            ],

            'attachments.*' => [
                'required',
                'file',
                'max:10240',
                'mimes:jpg,jpeg,png,gif,webp,bmp,svg,mp4,mov,avi,webm,mp3,m4a,ogg,oga,wav,wave,aac,amr,3gp,pdf,txt,csv,doc,docx,xls,xlsx,ppt,pptx,zip',
            ],
        ]);

        $files = [];

        if ($request->hasFile('attachment')) {
            $files[] = $request->file('attachment');
        }

        foreach ($request->file('attachments', []) as $file) {
            if ($file instanceof UploadedFile) {
                $files[] = $file;
            }
        }

        // An empty message is allowed only when an attachment exists.
        if (blank($validated['body'] ?? null) && count($files) === 0) {
            throw ValidationException::withMessages([
                'body' => 'Enter a message or attach a file.',
            ]);
        }

        $senderId = (int) auth()->id();
        $storedPaths = [];
        $attachments = [];
        $type = 'text';

        try {
            /*
             * Store files first and build the attachment metadata.
             * If the database transaction fails, the files are removed.
             */
            foreach ($files as $file) {
                $path = $file->store(
                    'messages/' . $conversation->id,
                    'public'
                );

                if (!$path) {
                    throw new \RuntimeException(
                        'The attachment could not be stored.'
                    );
                }

                $storedPaths[] = $path;

                $mime = $file->getMimeType()
                    ?: $file->getClientMimeType()
                    ?: 'application/octet-stream';

                $attachments[] = [
                    'name' => $file->getClientOriginalName(),
                    'path' => $path,
                    'mime' => $mime,
                    'size' => $file->getSize(),
                    'url' => asset('storage/' . $path),
                ];
            }

            if (count($attachments) > 0) {
                $type = $this->determineMessageType($attachments);
            } else {
                $type = $validated['type'] ?? 'text';
            }

            $message = DB::transaction(function () use ($conversation, $validated, $type, $attachments, $senderId) {
                $message = Message::create([
                    'conversation_id' => $conversation->id,
                    'sender_id' => $senderId,
                    'type' => $type,
                    'body' => $validated['body'] ?? null,
                    'attachments' => $attachments ?: null,
                ]);

                $preview = trim((string) ($validated['body'] ?? ''));

                if ($preview === '') {
                    $preview = $this->attachmentPreview($attachments, $type);
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
        } catch (\Throwable $exception) {
            foreach ($storedPaths as $path) {
                Storage::disk('public')->delete($path);
            }

            throw $exception;
        }

        $message->load('sender:id,name');

        $conversation->refresh()->load([
            'userOne:id,name,avatar,last_active_at,is_verified',
            'userTwo:id,name,avatar,last_active_at,is_verified',
        ]);

        $participants = ConversationParticipant::query()
            ->where('conversation_id', $conversation->id)
            ->get();

        foreach ($participants as $participant) {
            $participantUserId = (int) $participant->user_id;

            $otherUser = (int) $conversation->user_one_id === $participantUserId
                ? $conversation->userTwo
                : $conversation->userOne;

            $conversationData = [
                'id' => $conversation->id,
                'name' => $otherUser?->name ?? 'Unknown',
                'lastMessage' => $conversation->last_message_preview,
                'time' => $message->created_at->format('H:i'),
                'lastMessageAt' => $message->created_at->toISOString(),
                'lastMessageSenderId' => (int) $message->sender_id,

                'lastMessageStatus' => (int) $message->sender_id === $participantUserId
                    ? 'sent'
                    : null,

                'unread' => (int) $participant->unread_count,
                'avatarUrl' => $otherUser?->avatar,
                'online' => (bool) (
                    $otherUser?->last_active_at?->gt(
                        now()->subMinutes(5)
                    ) ?? false
                ),
                'verified' => (bool) ($otherUser?->is_verified ?? false),
                'otherUserId' => $otherUser?->id,
            ];

            broadcast(
                new ConversationUpdated(
                    $participantUserId,
                    $conversationData
                )
            );
        }

        broadcast(new MessageSent($message))->toOthers();

        return response()->json([
            'message' => $this->serializeMessage($message),
        ], 201);
    }

    /**
     * Determine the message type from its uploaded attachments.
     */
    protected function determineMessageType(array $attachments): string
    {
        $types = [];

        foreach ($attachments as $attachment) {
            $mime = strtolower($attachment['mime'] ?? '');

            $types[] = match (true) {
                str_starts_with($mime, 'image/') => 'image',
                str_starts_with($mime, 'video/') => 'video',
                str_starts_with($mime, 'audio/') => 'audio',
                default => 'file',
            };
        }

        $uniqueTypes = array_unique($types);

        // Mixed attachment types are represented as a general file message.
        return count($uniqueTypes) === 1
            ? $uniqueTypes[0]
            : 'file';
    }

    /**
     * Build a readable conversation preview for attachment messages.
     */
    protected function attachmentPreview(
        array $attachments,
        string $type
    ): string {
        $count = count($attachments);

        if ($count > 1) {
            return match ($type) {
                'image' => "📷 {$count} photos",
                'video' => "🎥 {$count} videos",
                'audio' => "🎤 {$count} audio messages",
                default => "📎 {$count} attachments",
            };
        }

        return match ($type) {
            'image' => '📷 Photo',
            'video' => '🎥 Video',
            'audio' => '🎤 Voice message',
            'file' => '📎 File',
            default => 'Message',
        };
    }

    /**
     * Mark incoming messages as read and clear the unread badge.
     */
    public function markRead(Request $request, Conversation $conversation)
    {
        $this->authorizeParticipant($conversation);

        $userId = (int) auth()->id();

        $unreadMessages = DB::transaction(function () use ($conversation, $userId) {
            $messages = Message::query()
                ->where('conversation_id', $conversation->id)
                ->where('sender_id', '!=', $userId)
                ->whereDoesntHave('reads', function ($query) use ($userId) {
                    $query->where('user_id', $userId);
                })
                ->get();

            foreach ($messages as $message) {
                $message->reads()->firstOrCreate(
                    ['user_id' => $userId],
                    ['read_at' => now()]
                );
            }

            ConversationParticipant::query()
                ->where('conversation_id', $conversation->id)
                ->where('user_id', $userId)
                ->update([
                    'unread_count' => 0,
                    'last_read_at' => now(),
                ]);

            return $messages;
        });

        foreach ($unreadMessages as $message) {
            broadcast(
                new MessageReadEvent($message, $userId)
            )->toOthers();
        }

        broadcast(
            new ConversationUpdated($userId, [
                'id' => $conversation->id,
                'unread' => 0,
            ])
        );

        $this->broadcastLastMessageStatus(
            $conversation,
            $userId,
            'read'
        );

        return response()->json([
            'ok' => true,
            'count' => $unreadMessages->count(),
        ]);
    }

    /**
     * Mark the conversation as delivered for the current participant.
     */
    public function markDelivered(Conversation $conversation)
    {
        $this->authorizeParticipant($conversation);

        $userId = (int) auth()->id();

        $participant = ConversationParticipant::query()
            ->where('conversation_id', $conversation->id)
            ->where('user_id', $userId)
            ->firstOrFail();

        if (
            !$participant->last_delivered_at ||
            $participant->last_delivered_at->lt(now()->subSeconds(2))
        ) {
            $participant->markDelivered();
        }

        $this->broadcastLastMessageStatus(
            $conversation,
            $userId,
            'delivered'
        );

        return response()->json([
            'ok' => true,
        ]);
    }

    /**
     * Update the sender's sidebar status for the latest message.
     */
    protected function broadcastLastMessageStatus(
        Conversation $conversation,
        int $viewerId,
        string $status
    ): void {
        $latestMessage = Message::query()
            ->where('conversation_id', $conversation->id)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->first();

        if (
            !$latestMessage ||
            (int) $latestMessage->sender_id === $viewerId
        ) {
            return;
        }

        $alreadyRead = $latestMessage->reads()
            ->where('user_id', $viewerId)
            ->exists();

        if ($alreadyRead) {
            $status = 'read';
        }

        broadcast(
            new ConversationUpdated(
                (int) $latestMessage->sender_id,
                [
                    'id' => $conversation->id,
                    'lastMessageStatus' => $status,
                ]
            )
        );
    }

    /**
     * Delete a message sent by the authenticated user.
     */
    public function destroy(Request $request, Message $message)
    {
        abort_unless(
            (int) $message->sender_id === (int) auth()->id(),
            403
        );

        $conversationId = $message->conversation_id;
        $messageId = $message->id;

        $attachments = $message->attachments ?? [];

        $message->delete();

        foreach ($attachments as $attachment) {
            if (!empty($attachment['path'])) {
                Storage::disk('public')->delete($attachment['path']);
            }
        }

        broadcast(
            new MessageDeleted($messageId, $conversationId)
        )->toOthers();

        return response()->json([
            'ok' => true,
        ]);
    }

    /**
     * Ensure the current user belongs to this conversation.
     */
    protected function authorizeParticipant(
        Conversation $conversation
    ): void {
        abort_unless(
            ConversationParticipant::query()
                ->where('conversation_id', $conversation->id)
                ->where('user_id', auth()->id())
                ->exists(),
            403
        );
    }

    /**
     * Return the message structure expected by the React frontend.
     */
    protected function serializeMessage(Message $message): array
    {
        return [
            'id' => $message->id,
            'conversation_id' => $message->conversation_id,
            'sender_id' => $message->sender_id,
            'sender_name' => $message->sender?->name ?? 'Unknown',
            'type' => $message->type,
            'body' => $message->body,
            'attachments' => $message->attachments ?? [],
            'created_at' => $message->created_at->toISOString(),
            'time' => $message->created_at->format('H:i'),
        ];
    }
}