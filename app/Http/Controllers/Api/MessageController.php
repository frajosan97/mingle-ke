<?php

namespace App\Http\Controllers\Api;

use App\Events\MessageDeleted;
use App\Events\MessageRead;
use App\Events\MessageSent;
use App\Events\MessageUpdated;
use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MessageController extends Controller
{
    private const ATTACHMENT_LIMITS = [
        'regular' => 10 * 1024,
        'premium' => 25 * 1024,
        'vvip' => 50 * 1024,
    ];

    /** GET /api/conversations/{conversation}/messages */
    public function index(Request $request, Conversation $conversation)
    {
        $user = $request->user();
        abort_unless($conversation->hasUser($user), 403);

        return response()->json(
            Message::query()
                ->forConversation($conversation)
                ->with([
                    'sender:id,name,avatar,tier,is_verified',
                    'reads:id,message_id,user_id,read_at',
                ])
                ->latestFirst()
                ->paginate(50)
        );
    }

    /** POST /api/conversations/{conversation}/messages */
    public function store(Request $request, Conversation $conversation)
    {
        $user = $request->user();
        abort_unless($conversation->hasUser($user), 403);

        $maxKb = self::ATTACHMENT_LIMITS[$user->tier] ?? self::ATTACHMENT_LIMITS['regular'];

        $data = $request->validate([
            'type' => ['sometimes', 'in:text,image,file,audio,video'],
            'body' => ['nullable', 'string', 'max:5000'],
            'attachment' => ['nullable', 'file', 'max:' . $maxKb],
            'coins_spent' => ['sometimes', 'integer', 'min:0'],
        ]);

        if (empty($data['body']) && !$request->hasFile('attachment')) {
            throw ValidationException::withMessages([
                'body' => 'Message body or attachment is required.',
            ]);
        }

        $coins = (int) ($data['coins_spent'] ?? 0);
        if ($coins > 0 && $user->coins < $coins) {
            return response()->json([
                'message' => 'Not enough coins.',
                'coins' => $user->coins,
            ], 402);
        }

        $attachmentPath = $request->hasFile('attachment')
            ? $request->file('attachment')->store('conversations/attachments', 'public')
            : null;

        $message = DB::transaction(function () use ($conversation, $user, $data, $attachmentPath, $coins) {
            if ($coins > 0) {
                $user->decrement('coins', $coins);
            }

            $message = $conversation->messages()->create([
                'sender_id' => $user->id,
                'type' => $data['type'] ?? 'text',
                'body' => $data['body'] ?? null,
                'attachment' => $attachmentPath,
                'coins_spent' => $coins,
            ]);

            $conversation->update([
                'last_message_at' => $message->created_at,
                'last_message_preview' => str($data['body'] ?? '[attachment]')->limit(120),
            ]);

            $other = $conversation->otherUser($user);

            $conversation->participants()
                ->where('user_id', $user->id)
                ->update([
                    'unread_count' => 0,
                    'last_read_at' => now(),
                    'last_delivered_at' => now(),
                ]);

            $conversation->participants()
                ->where('user_id', $other->id)
                ->increment('unread_count');

            $user->update(['last_active_at' => now()]);

            return $message;
        });

        $message->load('sender:id,name,avatar,tier,is_verified');

        broadcast(new MessageSent($message))->toOthers();

        return response()->json([
            'message' => $message,
            'coins' => $user->fresh()->coins,
        ], 201);
    }

    /** GET /api/messages/{message} */
    public function show(Request $request, Message $message)
    {
        $user = $request->user();
        abort_unless($message->conversation->hasUser($user), 403);

        return response()->json([
            'message' => $message->load([
                'sender:id,name,avatar,tier',
                'reads:id,message_id,user_id,read_at',
            ]),
        ]);
    }

    /** PATCH /api/messages/{message} */
    public function update(Request $request, Message $message)
    {
        $user = $request->user();
        abort_unless($message->isOwnedBy($user), 403, 'You can only edit your own messages.');

        $data = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
        ]);

        $message->update([
            'body' => $data['body'],
            'edited_at' => now(),
        ]);

        broadcast(new MessageUpdated($message))->toOthers();

        return response()->json(['message' => $message->fresh()]);
    }

    /** DELETE /api/messages/{message} */
    public function destroy(Request $request, Message $message)
    {
        $user = $request->user();
        abort_unless($message->isOwnedBy($user), 403);

        $message->delete();
        broadcast(new MessageDeleted($message))->toOthers();

        return response()->json(['message' => 'Message deleted.']);
    }

    /** POST /api/messages/{message}/read */
    public function read(Request $request, Message $message)
    {
        $user = $request->user();
        abort_unless($message->conversation->hasUser($user), 403);

        // Reader is not the sender — otherwise nothing to do.
        if ($message->sender_id === $user->id) {
            return response()->json(['ok' => true, 'self' => true]);
        }

        $message->markDelivered();
        $read = $message->markReadBy($user);

        // ⭐ Reset the reader's unread count for the entire conversation.
        $message->conversation
            ->participants()
            ->where('user_id', $user->id)
            ->update([
                'unread_count' => 0,
                'last_read_at' => now(),
                'last_delivered_at' => now(),
            ]);

        // Exclude the reader's socket — the receipt is for the sender.
        broadcast(new MessageRead(
            $message,
            $user,
            optional($read->read_at)->toISOString(),
        ))->toOthers();

        return response()->json(['read' => $read]);
    }

    /** POST /api/messages/{message}/delivered */
    public function delivered(Request $request, Message $message)
    {
        $user = $request->user();
        abort_unless($message->conversation->hasUser($user), 403);

        if ($message->sender_id !== $user->id) {
            $message->markDelivered();
        }

        return response()->json(['ok' => true]);
    }
}