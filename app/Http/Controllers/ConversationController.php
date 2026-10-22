<?php

namespace App\Http\Controllers;

use App\Events\ConversationUpdated;
use App\Models\Conversation;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ConversationController extends Controller
{
    /**
     * Display the conversations page.
     */
    public function index(): Response
    {
        return Inertia::render('conversations/index');
    }

    /**
     * Display a conversation and its messages.
     */
    public function show(
        Request $request,
        Conversation $conversation
    ): Response {
        $userId = (int) $request->user()->id;

        // Verify that the current user participates in this conversation.
        $participant = $conversation->participants()
            ->where('user_id', $userId)
            ->first();

        abort_unless($participant, 403);

        // Load both users without additional queries during rendering.
        $conversation->load([
            'userOne:id,name,avatar,last_active_at,is_verified',
            'userTwo:id,name,avatar,last_active_at,is_verified',
        ]);

        $otherUser = (int) $conversation->user_one_id === $userId
            ? $conversation->userTwo
            : $conversation->userOne;

        // Load the other participant's delivery state for outgoing messages.
        $otherParticipant = $conversation->participants()
            ->where('user_id', '!=', $userId)
            ->first();

        // Reset unread count immediately when the conversation is opened.
        if ($participant->unread_count > 0) {
            $participant->update([
                'unread_count' => 0,
                'last_read_at' => now(),
            ]);

            // Update this user's sidebar without overwriting other fields.
            broadcast(new ConversationUpdated($userId, [
                'id' => $conversation->id,
                'unread' => 0,
            ]));
        }

        // Load messages, senders, and read receipts efficiently.
        $messages = $conversation->messages()
            ->withTrashed()
            ->with([
                'sender:id,name',
                'reads:id,message_id,user_id,read_at',
            ])
            ->orderBy('created_at')
            ->orderBy('id')
            ->get()
            ->map(function ($message) use ($userId, $participant, $otherParticipant) {
                $isMine = (int) $message->sender_id === $userId;

                // For outgoing messages, use the recipient's delivery state.
                // For incoming messages, use the current user's delivery state.
                $deliveredAt = $isMine
                    ? $otherParticipant?->last_delivered_at
                    : $participant->last_delivered_at;

                $read = $message->reads->contains(
                    fn($receipt) =>
                        (int) $receipt->user_id !== (int) $message->sender_id
                );

                return [
                    'id' => $message->id,
                    'content' => $message->body,
                    'time' => $message->created_at->format('H:i'),
                    'createdAt' => $message->created_at->toISOString(),
                    'mine' => $isMine,
                    'read' => $read,
                    'delivered' => $deliveredAt !== null
                        && $message->created_at->lte($deliveredAt),
                    'type' => $message->type,
                    'attachments' => $message->attachments ?? [],
                    'deleted' => $message->trashed(),
                ];
            })
            ->values();

        return Inertia::render('conversations/show', [
            'id' => (string) $conversation->id,
            'name' => $otherUser?->name ?? 'Unknown',
            'avatarUrl' => $otherUser?->avatar,
            'otherUserId' => $otherUser?->id,
            'otherLastSeen' => $otherUser?->last_active_at?->toISOString(),
            'otherVerified' => (bool) ($otherUser?->is_verified ?? false),
            'messages' => $messages,
        ]);
    }
}