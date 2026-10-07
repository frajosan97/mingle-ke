<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Message extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'conversation_id',
        'sender_id',
        'type',
        'body',
        'attachments',
        'coins_spent',
        'edited_at',
        'delivered_at',
    ];

    protected $casts = [
        'attachments' => 'array',
        'edited_at' => 'datetime',
        'delivered_at' => 'datetime',
        'coins_spent' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public const STATUS_SENT = 'sent';
    public const STATUS_DELIVERED = 'delivered';
    public const STATUS_READ = 'read';

    /* ── Relationships ── */

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function reads(): HasMany
    {
        return $this->hasMany(MessageRead::class);
    }

    public function readers()
    {
        return $this->belongsToMany(
            User::class,
            'message_reads',
            'message_id',
            'user_id',
        )->withPivot('read_at');
    }

    /* ── Helpers ── */

    public function isOwnedBy(User|int $user): bool
    {
        $id = $user instanceof User ? $user->id : $user;

        return $this->sender_id === $id;
    }

    public function markDelivered(): void
    {
        if ($this->delivered_at === null) {
            $this->forceFill(['delivered_at' => now()])->save();
        }
    }

    public function markReadBy(User|int $user): MessageRead
    {
        $id = $user instanceof User ? $user->id : $user;

        return $this->reads()->firstOrCreate(
            ['user_id' => $id],
            ['read_at' => now()],
        );
    }

    public function isDelivered(): bool
    {
        return $this->delivered_at !== null;
    }

    public function isReadBy(User|int $user): bool
    {
        $id = $user instanceof User ? $user->id : $user;

        return $this->reads()->where('user_id', $id)->exists();
    }

    public function isReadByAnyoneElse(): bool
    {
        return $this->reads()
            ->where('user_id', '!=', $this->sender_id)
            ->exists();
    }

    /**
     * Tick status from the viewer's perspective.
     * Uses the already-loaded `reads` relation when available — avoids
     * a query per message when serialising a thread.
     */
    public function statusFor(User|int $viewer): string
    {
        $id = $viewer instanceof User ? $viewer->id : $viewer;

        if ($this->sender_id !== $id) {
            return self::STATUS_SENT;
        }

        if ($this->relationLoaded('reads')) {
            $read = $this->reads->contains(fn($r) => $r->user_id !== $this->sender_id);
        } else {
            $read = $this->isReadByAnyoneElse();
        }

        if ($read) {
            return self::STATUS_READ;
        }

        return $this->isDelivered() ? self::STATUS_DELIVERED : self::STATUS_SENT;
    }

    /* ── Scopes ── */

    public function scopeForConversation($query, Conversation|int $conversation)
    {
        $id = $conversation instanceof Conversation
            ? $conversation->id
            : $conversation;

        return $query->where('conversation_id', $id);
    }

    public function scopeLatestFirst($query)
    {
        return $query->orderByDesc('created_at')->orderByDesc('id');
    }

    public function scopeChronological($query)
    {
        return $query->orderBy('created_at')->orderBy('id');
    }

    public function scopeUndelivered($query)
    {
        return $query->whereNull('delivered_at');
    }

    public function scopeDeliveredNotRead($query)
    {
        return $query->whereNotNull('delivered_at')
            ->whereDoesntHave('reads', function ($q) {
                $q->whereColumn('message_reads.user_id', '!=', 'messages.sender_id');
            });
    }
}