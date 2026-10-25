<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property int $conversation_id
 * @property int $sender_id
 * @property string $type   // text|image|video|audio|file|mixed
 * @property string|null $body
 * @property int|null $coins_spent
 * @property Carbon|null $edited_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 *
 * @property-read string $preview
 * @property-read bool $is_edited
 * @property-read Conversation $conversation
 * @property-read User $sender
 * @property-read \Illuminate\Database\Eloquent\Collection<int, MessageAttachment> $attachments
 * @property-read \Illuminate\Database\Eloquent\Collection<int, MessageRead> $reads
 * @property-read \Illuminate\Database\Eloquent\Collection<int, User> $readers
 */
#[Fillable([
    'conversation_id',
    'sender_id',
    'type',
    'body',
    'coins_spent',
    'edited_at',
])]
class Message extends Model
{
    use SoftDeletes;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'edited_at' => 'datetime',
            'coins_spent' => 'integer',
        ];
    }

    // ==================================================================
    // RELATIONSHIPS
    // ==================================================================

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(MessageAttachment::class)->orderBy('position');
    }

    public function reads(): HasMany
    {
        return $this->hasMany(MessageRead::class);
    }

    public function readers(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'message_reads',
            'message_id',
            'user_id'
        )->withPivot('read_at');
    }

    // ==================================================================
    // ACCESSORS
    // ==================================================================
    public function getPreviewAttribute(): string
    {
        if ($this->body !== null && $this->body !== '') {
            return Str::limit($this->body, 250);
        }

        return match ($this->type) {
            'image' => '[image]',
            'video' => '[video]',
            'audio' => '[audio]',
            'file' => '[file]',
            'mixed' => '[attachment]',
            default => '',
        };
    }

    public function getIsEditedAttribute(): bool
    {
        return $this->edited_at !== null;
    }

    // ==================================================================
    // HELPERS
    // ==================================================================
    public function markReadBy(int $userId): void
    {
        $this->reads()->firstOrCreate(
            ['user_id' => $userId],
            ['read_at' => now()]
        );
    }

    public function isReadBy(int $userId): bool
    {
        return $this->relationLoaded('reads')
            ? $this->reads->contains('user_id', $userId)
            : $this->reads()->where('user_id', $userId)->exists();
    }

    // ==================================================================
    // SCOPES
    // ==================================================================

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeForMessage($query, int $messageId)
    {
        return $query->where('message_id', $messageId);
    }

    public function tickStateFor(
        int $recipientId,
        ?\Carbon\CarbonInterface $recipientDeliveredAt = null
    ): string {
        if ($this->isReadBy($recipientId)) {
            return 'read';
        }

        // Use the preloaded watermark when available (avoids N+1 in show()/index()).
        $deliveredAt = ConversationParticipant::query()
            ->where('conversation_id', $this->conversation_id)
            ->where('user_id', $recipientId)
            ->whereNull('deleted_at')
            ->value('last_delivered_at');

        if ($deliveredAt === null) {
            return 'sent';
        }

        // Must be a real timestamp — guard against null created_at (unsaved model).
        if ($this->created_at === null) {
            return 'sent';
        }

        // return $deliveredAt >= $this->created_at ? 'delivered' : 'sent';
        return $deliveredAt > $this->created_at
            ? 'delivered'
            : 'sent';
    }
}