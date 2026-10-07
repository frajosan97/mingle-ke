<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\DB;

class Conversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_one_id',
        'user_two_id',
        'last_message_at',
        'last_message_preview',
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
    ];

    /* ─────────────────────────────────────────────
     |  Relationships
     * ───────────────────────────────────────────── */

    public function userOne(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_one_id');
    }

    public function userTwo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_two_id');
    }

    public function participants(): HasMany
    {
        return $this->hasMany(ConversationParticipant::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function latestMessage(): HasOne
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }

    /* ─────────────────────────────────────────────
     |  Helpers
     * ───────────────────────────────────────────── */

    public function otherUser(User $user): User
    {
        return $this->user_one_id === $user->id
            ? $this->userTwo
            : $this->userOne;
    }

    public function hasUser(User|int $user): bool
    {
        $id = $user instanceof User ? $user->id : $user;

        return $id === $this->user_one_id || $id === $this->user_two_id;
    }

    public function participantFor(User|int $user): ?ConversationParticipant
    {
        $id = $user instanceof User ? $user->id : $user;

        return $this->participants()->where('user_id', $id)->first();
    }

    /**
     * Find or create the canonical 1:1 conversation between two users.
     * Deterministic ordering prevents duplicate pairs.
     */
    public static function between(User|int $a, User|int $b): self
    {
        $idA = $a instanceof User ? $a->id : $a;
        $idB = $b instanceof User ? $b->id : $b;

        [$one, $two] = $idA < $idB ? [$idA, $idB] : [$idB, $idA];

        $conversation = static::firstOrCreate([
            'user_one_id' => $one,
            'user_two_id' => $two,
        ]);

        // Ensure both participant rows exist so the inbox query never
        // has to lazily create them. Two upserts, single round trip each.
        if ($conversation->wasRecentlyCreated) {
            ConversationParticipant::insert([
                [
                    'conversation_id' => $conversation->id,
                    'user_id' => $one,
                    'unread_count' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'conversation_id' => $conversation->id,
                    'user_id' => $two,
                    'unread_count' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }

        return $conversation;
    }

    /* ─────────────────────────────────────────────
     |  Tick-state transitions (bulk, no recursion)
     * ───────────────────────────────────────────── */

    /**
     * Mark every incoming message as delivered (double grey tick).
     * Idempotent, bulk UPDATE — no per-row loop.
     */
    public function markDeliveredFor(User|int $user): void
    {
        $id = $user instanceof User ? $user->id : $user;
        $now = now();

        $this->messages()
            ->where('sender_id', '!=', $id)
            ->whereNull('delivered_at')
            ->update(['delivered_at' => $now]);

        $this->participants()
            ->where('user_id', $id)
            ->update(['last_delivered_at' => $now]);
    }

    /**
     * Mark every incoming message as read (double blue tick) + reset unread.
     * Uses a single bulk INSERT ... SELECT so it's O(1) queries instead of
     * O(n) per message.
     */
    public function markReadFor(User|int $user): void
    {
        $id = $user instanceof User ? $user->id : $user;
        $now = now();

        // READ implies DELIVERED.
        $this->markDeliveredFor($id);

        // Bulk insert read receipts for every unread incoming message.
        // INSERT INTO message_reads (message_id, user_id, read_at)
        //   SELECT id, ?, ? FROM messages
        //   WHERE conversation_id = ? AND sender_id != ?
        //     AND id NOT IN (SELECT message_id FROM message_reads WHERE user_id = ?)
        $incomingIds = $this->messages()
            ->where('sender_id', '!=', $id)
            ->whereDoesntHave('reads', fn($q) => $q->where('user_id', $id))
            ->pluck('id');

        if ($incomingIds->isNotEmpty()) {
            DB::table('message_reads')->insert(
                $incomingIds->map(fn($mid) => [
                    'message_id' => $mid,
                    'user_id' => $id,
                    'read_at' => $now,
                ])->all()
            );
        }

        // Reset the participant row directly — no model callback.
        $this->participants()
            ->where('user_id', $id)
            ->update([
                'unread_count' => 0,
                'last_read_at' => $now,
                'last_delivered_at' => $now,
            ]);
    }

    /* ─────────────────────────────────────────────
     |  Scopes
     * ───────────────────────────────────────────── */

    public function scopeForUser($query, User|int $user)
    {
        $id = $user instanceof User ? $user->id : $user;

        return $query->where(function ($q) use ($id) {
            $q->where('user_one_id', $id)
                ->orWhere('user_two_id', $id);
        });
    }

    public function scopeRecent($query)
    {
        return $query->orderByDesc('last_message_at');
    }
}