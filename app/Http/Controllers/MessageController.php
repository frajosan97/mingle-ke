<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMessageRequest;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Message;
use App\Services\Chat\ConversationBroadcastService;
use App\Services\Chat\MessageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MessageController extends Controller
{
    public function __construct(
        private MessageService $messages,
        private ConversationBroadcastService $broadcaster,
    ) {
    }

    public function store(StoreMessageRequest $request, Conversation $conversation)
    {
        $this->authorize('participate', $conversation);

        $message = $this->messages->send(
            conversation: $conversation,
            senderId: (int) $request->user()->id,
            body: $request->input('body'),
            files: $request->uploadedFiles(),
            requestedType: $request->input('type'),
        );

        return (new MessageResource($message))
            ->response()
            ->setStatusCode(201);
    }

    public function markRead(Request $request, Conversation $conversation)
    {
        $this->authorize('participate', $conversation);

        $userId = (int) $request->user()->id;

        $unread = DB::transaction(function () use ($conversation, $userId) {
            $messages = Message::query()
                ->where('conversation_id', $conversation->id)
                ->where('sender_id', '!=', $userId)
                ->whereDoesntHave('reads', fn($q) => $q->where('user_id', $userId))
                ->get();

            foreach ($messages as $message) {
                $message->reads()->firstOrCreate(
                    ['user_id' => $userId],
                    ['read_at' => now()],
                );
            }

            ConversationParticipant::query()
                ->where('conversation_id', $conversation->id)
                ->where('user_id', $userId)
                ->update(['unread_count' => 0, 'last_read_at' => now()]);

            return $messages;
        });

        foreach ($unread as $message) {
            $this->broadcaster->broadcastRead($message, $userId);
        }

        $this->broadcaster->broadcastSidebarUpdate($userId, [
            'id' => $conversation->id,
            'unread' => 0,
        ]);

        $this->broadcaster->broadcastLastMessageStatus($conversation, $userId, 'read');

        return response()->json(['ok' => true, 'count' => $unread->count()]);
    }

    public function markDelivered(Conversation $conversation)
    {
        $this->authorize('participate', $conversation);

        $userId = (int) auth()->id();

        $participant = ConversationParticipant::query()
            ->where('conversation_id', $conversation->id)
            ->where('user_id', $userId)
            ->firstOrFail();

        if (
            !$participant->last_delivered_at
            || $participant->last_delivered_at->lt(now()->subSeconds(2))
        ) {
            $participant->markDelivered();
        }

        $this->broadcaster->broadcastLastMessageStatus($conversation, $userId, 'delivered');

        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, Message $message)
    {
        abort_unless((int) $message->sender_id === (int) $request->user()->id, 403);

        $this->messages->delete($message);

        return response()->json(['ok' => true]);
    }
}