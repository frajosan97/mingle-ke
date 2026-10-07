<?php

namespace App\Http\Controllers\Api;

use App\Events\MessageDeleted;
use App\Events\MessageRead;
use App\Events\MessageSent;
use App\Events\MessageUpdated;
use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Notifications\NewMessageNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class MessageController extends Controller
{
    /** Per-file size limits in KB, by user tier. */
    private const ATTACHMENT_LIMITS = [
        'regular' => 10 * 1024,
        'premium' => 25 * 1024,
        'vvip' => 50 * 1024,
    ];

    /** Max number of files per message, by user tier. */
    private const MAX_FILES = [
        'regular' => 5,
        'premium' => 10,
        'vvip' => 20,
    ];

    /** GET /api/conversations/{conversation}/messages */
    public function index(Request $request, Conversation $conversation)
    {
        $user = $request->user();
        abort_unless($conversation->hasUser($user), 403);

        $paginator = Message::query()
            ->forConversation($conversation)
            ->with([
                'sender:id,name,avatar,tier,is_verified',
                'reads:id,message_id,user_id,read_at',
            ])
            ->latestFirst()
            ->paginate(50);

        // Normalize attachments on each message so the frontend receives
        // { url, name, mime, size } instead of raw storage paths.
        $paginator->getCollection()->transform(function (Message $m) {
            return $this->decorateMessage($m);
        });

        return response()->json($paginator);
    }

    /** POST /api/conversations/{conversation}/messages */
    public function store(Request $request, Conversation $conversation)
    {
        Log::info($request);
        $user = $request->user();
        abort_unless($conversation->hasUser($user), 403);

        $tier = $user->tier ?? 'regular';
        $maxKb = self::ATTACHMENT_LIMITS[$tier] ?? self::ATTACHMENT_LIMITS['regular'];
        $maxNum = self::MAX_FILES[$tier] ?? self::MAX_FILES['regular'];

        // Accept both `attachments[]` (array) and `attachment` (single),
        // for safety during frontend/backend desync.
        $files = $request->file('attachments');

        if ($files === null) {
            $single = $request->file('attachment');
            $files = $single ? [$single] : [];
        } elseif (!is_array($files)) {
            $files = [$files];
        }

        $files = array_values(array_filter($files));

        if (count($files) > $maxNum) {
            throw ValidationException::withMessages([
                'attachments' => "You can attach up to {$maxNum} files.",
            ]);
        }

        foreach ($files as $file) {
            if ($file->getSize() > $maxKb * 1024) {
                throw ValidationException::withMessages([
                    'attachments' => sprintf(
                        '"%s" is too large. Max %d MB.',
                        $file->getClientOriginalName(),
                        intdiv($maxKb, 1024),
                    ),
                ]);
            }
        }

        $data = $request->validate([
            'type' => ['sometimes', 'in:text,image,file,audio,video'],
            'body' => ['nullable', 'string', 'max:5000'],
            'coins_spent' => ['sometimes', 'integer', 'min:0'],
        ]);

        if (empty($data['body']) && count($files) === 0) {
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

        // Store files and build metadata array.
        $stored = [];
        foreach ($files as $file) {
            $stored[] = [
                'path' => $file->store('conversations/attachments', 'public'),
                'name' => $file->getClientOriginalName(),
                'mime' => $file->getClientMimeType(),
                'size' => $file->getSize(),
            ];
        }

        $type = $data['type'] ?? $this->inferType($stored[0]['mime'] ?? null);

        $message = DB::transaction(function () use ($conversation, $user, $data, $type, $stored, $coins) {
            if ($coins > 0) {
                $user->decrement('coins', $coins);
            }

            $message = $conversation->messages()->create([
                'sender_id' => $user->id,
                'type' => $type,
                'body' => $data['body'] ?? null,
                'attachments' => $stored ?: null,
                'coins_spent' => $coins,
            ]);

            $conversation->update([
                'last_message_at' => $message->created_at,
                'last_message_preview' => $this->buildPreview(
                    $data['body'] ?? null,
                    $stored,
                ),
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

        // ── Push notification to the recipient ──
        $this->notifyRecipient($conversation, $message, $user);

        return response()->json([
            'message' => $this->decorateMessage($message),
            'coins' => $user->fresh()->coins,
        ], 201);
    }

    /** GET /api/messages/{message} */
    public function show(Request $request, Message $message)
    {
        $user = $request->user();
        abort_unless($message->conversation->hasUser($user), 403);

        $message->load([
            'sender:id,name,avatar,tier',
            'reads:id,message_id,user_id,read_at',
        ]);

        return response()->json([
            'message' => $this->decorateMessage($message),
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

        return response()->json([
            'message' => $this->decorateMessage($message->fresh()),
        ]);
    }

    /** DELETE /api/messages/{message} */
    public function destroy(Request $request, Message $message)
    {
        $user = $request->user();
        abort_unless($message->isOwnedBy($user), 403);

        // Optionally delete files:
        // Storage::disk('public')->delete(
        //     collect($message->attachments ?? [])->pluck('path')->all()
        // );

        $message->delete();
        broadcast(new MessageDeleted($message))->toOthers();

        return response()->json(['message' => 'Message deleted.']);
    }

    /** POST /api/messages/{message}/read */
    public function read(Request $request, Message $message)
    {
        $user = $request->user();
        abort_unless($message->conversation->hasUser($user), 403);

        if ($message->sender_id === $user->id) {
            return response()->json(['ok' => true, 'self' => true]);
        }

        $message->markDelivered();
        $read = $message->markReadBy($user);

        $message->conversation
            ->participants()
            ->where('user_id', $user->id)
            ->update([
                'unread_count' => 0,
                'last_read_at' => now(),
                'last_delivered_at' => now(),
            ]);

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

    /* ────────────────────────────────────────────────
     |  Helpers
     * ──────────────────────────────────────────────── */

    /**
     * Send a Web Push notification to the other participant.
     * Skipped when they appear to be actively viewing the conversation.
     */
    private function notifyRecipient(
        Conversation $conversation,
        Message $message,
        User $sender,
    ): void {
        // Resolve the recipient. Done again outside the tx so we're not
        // holding a stale in-transaction reference.
        $recipient = $conversation->otherUser($sender);

        if (!$recipient || $recipient->id === $sender->id) {
            return;
        }

        // Skip if recipient recently read this thread AND is recently active.
        $participant = $conversation->participants()
            ->where('user_id', $recipient->id)
            ->first();

        $recentlyRead = $participant?->last_read_at
            && $participant->last_read_at->gt(now()->subSeconds(30));

        $recentlyActive = $recipient->last_active_at
            && $recipient->last_active_at->gt(now()->subSeconds(30));

        if ($recentlyRead && $recentlyActive) {
            return;
        }

        // Nothing to push to — skip early (avoids queue round-trip).
        if ($recipient->pushSubscriptions()->count() === 0) {
            return;
        }

        try {
            $recipient->notify(new NewMessageNotification($message->id));
        } catch (\Throwable $e) {
            // Never let a push failure break message sending.
            Log::warning('Web push failed', [
                'message_id' => $message->id,
                'recipient_id' => $recipient->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function inferType(?string $mime): string
    {
        if (!$mime) {
            return 'text';
        }

        return match (true) {
            str_starts_with($mime, 'image/') => 'image',
            str_starts_with($mime, 'video/') => 'video',
            str_starts_with($mime, 'audio/') => 'audio',
            default => 'file',
        };
    }

    private function buildPreview(?string $body, array $stored): string
    {
        $body = trim((string) $body);
        if ($body !== '') {
            return (string) str($body)->limit(120);
        }

        $count = count($stored);

        return match (true) {
            $count === 0 => '',
            $count === 1 => '[attachment]',
            default => "[{$count} attachments]",
        };
    }

    /**
     * Normalize a Message for the frontend:
     *  - converts each stored attachment's `path` into a public `url`
     *  - keeps the original keys (name, mime, size) intact
     *
     * The frontend's optimistic render already uses `attachments` as an
     * array of { url, name, mime, size }, so the shape matches 1:1.
     */
    private function decorateMessage(Message $message): Message
    {
        $raw = $message->attachments ?? [];

        $normalized = collect($raw)
            ->map(function ($a) {
                if (isset($a['url'])) {
                    return $a;
                }

                // Build the public URL manually — bypasses Storage::url().
                $url = isset($a['path'])
                    ? asset('storage/' . ltrim($a['path'], '/'))
                    : null;

                return [
                    'url' => $url,
                    'name' => $a['name'] ?? '',
                    'mime' => $a['mime'] ?? '',
                    'size' => $a['size'] ?? 0,
                ];
            })
            ->values()
            ->all();

        $message->setAttribute('attachments', $normalized);

        return $message;
    }
}