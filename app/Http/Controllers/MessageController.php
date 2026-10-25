<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMessageRequest;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Message;
use App\Models\MessageRead;
use App\Services\Chat\ConversationBroadcastService;
use App\Services\Chat\MessageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MessageController extends Controller
{
    public function __construct(
        private readonly MessageService $messages,
        private readonly ConversationBroadcastService $broadcaster,
    ) {
    }

    public function store(StoreMessageRequest $request, Conversation $conversation)
    {
        $this->authorize('participate', $conversation);

        $userId = (int) $request->user()->id;

        // MessageService::send() owns the MessageSent broadcast — do not
        // broadcast again here or the sender/receiver see two events.
        $message = $this->messages->send(
            conversation: $conversation,
            senderId: $userId,
            body: $request->validated('body'),
            files: $request->classifiedFiles(),
        );

        // Recipient participant — supplies recipientId and the preloaded
        // delivery watermark so the resource needs no per-message query.
        $recipientParticipant = $conversation->participants()
            ->where('user_id', '!=', $userId)
            ->whereNull('deleted_at')
            ->first();

        return (new MessageResource($message, [
            'viewerId' => $userId,
            'recipientId' => $recipientParticipant?->user_id,
            'recipientDeliveredAt' => $recipientParticipant?->last_delivered_at,
        ]))->response()->setStatusCode(201);
    }

    public function markRead(Request $request, Conversation $conversation)
    {
        $this->authorize('participate', $conversation);

        $userId = (int) $request->user()->id;

        $unreadIds = Message::query()
            ->where('conversation_id', $conversation->id)
            ->where('sender_id', '!=', $userId)
            ->whereDoesntHave('reads', fn($q) => $q->where('user_id', $userId))
            ->pluck('id');

        if ($unreadIds->isEmpty()) {
            return response()->json(['ok' => true, 'count' => 0]);
        }

        $now = now();

        $inserted = DB::transaction(function () use ($unreadIds, $conversation, $userId, $now) {
            $rows = $unreadIds->map(fn($id) => [
                'message_id' => $id,
                'user_id' => $userId,
                'read_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ])->all();

            $count = MessageRead::insertOrIgnore($rows);

            ConversationParticipant::query()
                ->where('conversation_id', $conversation->id)
                ->where('user_id', $userId)
                ->whereNull('deleted_at')
                ->update([
                    'unread_count' => 0,
                    'last_read_at' => $now,
                ]);

            return $count;
        });

        if ($inserted > 0) {
            // Delegate to the broadcaster; it hydrates Message instances
            // from the conversation relation (typed, no \stdClass).
            $this->broadcaster->broadcastReadMany($conversation, $userId, $unreadIds);
        }

        return response()->json(['ok' => true, 'count' => $inserted]);
    }

    public function markDelivered(Request $request, Conversation $conversation)
    {
        $this->authorize('participate', $conversation);

        $userId = (int) $request->user()->id;

        $participant = $conversation->participantFor($userId);
        abort_if($participant === null, 403);

        $query = Message::query()
            ->where('conversation_id', $conversation->id)
            ->where('sender_id', '!=', $userId);

        // Watermark is a low-water-mark: only consider messages newer than
        // what this user has already acked. Captured BEFORE advancing it.
        if ($participant->last_delivered_at !== null) {
            $query->where('created_at', '>', $participant->last_delivered_at);
        }

        $delivered = $query->orderBy('created_at')->orderBy('id')->get();

        if ($delivered->isEmpty()) {
            return response()->json(['ok' => true, 'changed' => false]);
        }

        // Advance to the ACKED MESSAGE'S timestamp — NOT now(). now() would
        // mark messages sent between the last ack and this request as
        // delivered even though the client never received them.
        $participant->update([
            'last_delivered_at' => $delivered->last()->created_at,
        ]);

        $this->broadcaster->broadcastDeliveredMany(
            $conversation,
            $userId,
            $delivered->pluck('id'),
        );

        return response()->json(['ok' => true, 'changed' => true]);
    }

    public function destroy(Request $request, Message $message)
    {
        $this->authorize('participate', $message->conversation);

        abort_unless(
            (int) $message->sender_id === (int) $request->user()->id,
            403,
            'You can only delete your own messages.',
        );

        // MessageService::delete() owns the MessageDeleted broadcast.
        $this->messages->delete($message);

        return response()->json(['ok' => true]);
    }
}