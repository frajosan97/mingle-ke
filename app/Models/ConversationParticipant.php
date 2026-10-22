<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $conversation_id
 * @property int $user_id
 * @property int $unread_count
 * @property Carbon|null $last_read_at
 * @property Carbon|null $last_delivered_at
 * @property bool $is_muted
 * @property bool $is_archived
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @property-read Conversation $conversation
 * @property-read User $user
 */
#[Fillable([
    'conversation_id',
    'user_id',
    'unread_count',
    'last_read_at',
    'last_delivered_at',
    'is_muted',
    'is_archived',
])]
class ConversationParticipant extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'last_read_at' => 'datetime',
            'last_delivered_at' => 'datetime',
            'unread_count' => 'integer',
            'is_muted' => 'boolean',
            'is_archived' => 'boolean',
        ];
    }

    // ==================================================================
    // RELATIONSHIPS
    // ==================================================================

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ==================================================================
    // HELPERS
    // ==================================================================

    /** Whether a given message has been delivered to this participant. */
    public function hasDelivered(Message $message): bool
    {
        return $this->last_delivered_at
            && $message->created_at <= $this->last_delivered_at;
    }

    /** Advance the delivery watermark to now. */
    public function markDelivered(): void
    {
        $this->update(['last_delivered_at' => now()]);
    }

    /** Clear unread count and advance the read marker. */
    public function markRead(): void
    {
        $this->update([
            'last_read_at' => now(),
            'unread_count' => 0,
        ]);
    }
}