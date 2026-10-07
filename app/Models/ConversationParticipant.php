<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConversationParticipant extends Model
{
    use HasFactory;

    protected $fillable = [
        'conversation_id',
        'user_id',
        'unread_count',
        'last_read_at',
        'last_delivered_at',
        'is_muted',
        'is_archived',
    ];

    protected $casts = [
        'last_read_at' => 'datetime',
        'last_delivered_at' => 'datetime',
        'is_muted' => 'boolean',
        'is_archived' => 'boolean',
        'unread_count' => 'integer',
    ];

    /* ─────────────────────────────────────────────
     |  Relationships
     * ───────────────────────────────────────────── */

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /* ─────────────────────────────────────────────
     |  State transitions — pure, no back-references.
     |
     |  These methods update ONLY this row. To also blue-tick the
     |  messages, call Conversation::markReadFor() (which updates
     |  this row too).
     * ───────────────────────────────────────────── */

    public function markRead(): void
    {
        $now = now();

        $this->forceFill([
            'unread_count' => 0,
            'last_read_at' => $now,
            'last_delivered_at' => $this->last_delivered_at ?? $now,
        ])->save();
    }

    public function markDelivered(): void
    {
        $this->forceFill(['last_delivered_at' => now()])->save();
    }

    public function incrementUnread(int $by = 1): void
    {
        $this->increment('unread_count', $by);
    }

    public function mute(): void
    {
        $this->update(['is_muted' => true]);
    }
    public function unmute(): void
    {
        $this->update(['is_muted' => false]);
    }
    public function archive(): void
    {
        $this->update(['is_archived' => true]);
    }
    public function unarchive(): void
    {
        $this->update(['is_archived' => false]);
    }
}