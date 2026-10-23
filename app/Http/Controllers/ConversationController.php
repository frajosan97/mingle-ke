<?php

namespace App\Http\Controllers;

use App\Http\Resources\ConversationResource;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ConversationController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('conversations/index');
    }

    public function show(Request $request, Conversation $conversation): Response
    {
        $userId = (int) $request->user()->id;

        $participant = $conversation->participants()
            ->where('user_id', $userId)
            ->whereNull('deleted_at')
            ->first();

        abort_unless($participant, 403);

        $conversation->load([
            'userOne:id,name,avatar,last_active_at,is_verified',
            'userTwo:id,name,avatar,last_active_at,is_verified',
        ]);

        $recipientParticipant = $conversation->participants()
            ->where('user_id', '!=', $userId)
            ->whereNull('deleted_at')
            ->first();

        $recipientId = $recipientParticipant?->user_id;
        $recipientDeliveredAt = $recipientParticipant?->last_delivered_at;

        if ($participant->unread_count > 0) {
            $participant->update([
                'unread_count' => 0,
                'last_read_at' => now(),
            ]);
        }

        $messages = $conversation->messages()
            ->withTrashed()
            ->with([
                'sender:id,name',
                'reads:id,message_id,user_id',
                'attachments',
            ])
            ->orderBy('created_at')
            ->orderBy('id')
            ->get()
            ->map(fn(Message $message) => (new MessageResource($message, [
                'viewerId' => $userId,
                'recipientId' => $recipientId,
                'recipientDeliveredAt' => $recipientDeliveredAt,
            ]))->resolve())
            ->values();

        $header = (new ConversationResource($conversation, [
            'viewer' => $request->user(),
            'mode' => 'header',
        ]))->resolve();

        return Inertia::render('conversations/show', [
            'id' => (string) $conversation->id,
            'name' => $header['name'],
            'avatarUrl' => $header['avatarUrl'],
            'otherUserId' => $header['otherUserId'],
            'otherLastSeen' => $conversation
                ->otherUserFor($userId)?->last_active_at?->toISOString(),
            'otherVerified' => $header['verified'],
            'messages' => $messages,
        ]);
    }
}