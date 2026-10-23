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

        // MessageService::send() owns the MessageSent broadcast — do not
        // broadcast again here or the sender/receiver see two events.
        $message = $this->messages->send(
            conversation: $conversation,
            senderId: (int) $request->user()->id,
            body: $request->validated('body'),
            files: $request->classifiedFiles(),
        );

        return (new MessageResource($message, [
            'viewerId' => (int) $request->user()->id,
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

        if ($participant->last_delivered_at !== null) {
            $query->where('created_at', '>', $participant->last_delivered_at);
        }

        $deliveredIds = $query->orderBy('created_at')->orderBy('id')->pluck('id');

        if ($deliveredIds->isEmpty()) {
            return response()->json(['ok' => true, 'changed' => false]);
        }

        $participant->markDelivered();

        $this->broadcaster->broadcastDeliveredMany($conversation, $userId, $deliveredIds);

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