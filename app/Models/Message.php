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
 * @property string $type
 * @property string|null $body
 * @property array|null $attachments
 * @property int|null $coins_spent
 * @property Carbon|null $edited_at
 * @property Carbon|null $deleted_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @property-read string $preview
 * @property-read bool $is_edited
 * @property-read Conversation $conversation
 * @property-read User $sender
 * @property-read \Illuminate\Database\Eloquent\Collection<int, MessageRead> $reads
 * @property-read \Illuminate\Database\Eloquent\Collection<int, User> $readers
 */
#[Fillable([
    'conversation_id',
    'sender_id',
    'type',
    'body',
    'attachments',
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
            'attachments' => 'array',
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

    /** Short preview for inbox listings. */
    public function getPreviewAttribute(): string
    {
        return Str::limit(
            $this->body ?? '[' . $this->type . ']',
            250
        );
    }

    public function getIsEditedAttribute(): bool
    {
        return $this->edited_at !== null;
    }

    // ==================================================================
    // HELPERS
    // ==================================================================

    /**
     * Tick state from the sender's perspective for a given recipient:
     *   sent      → single ✓
     *   delivered → grey ✓✓
     *   read      → blue ✓✓
     */
    public function tickStateFor(int $recipientId): string
    {
        if ($this->reads()->where('user_id', $recipientId)->exists()) {
            return 'read';
        }

        $participant = $this->conversation
            ->participants()
            ->where('user_id', $recipientId)
            ->first();

        if ($participant && $participant->hasDelivered($this)) {
            return 'delivered';
        }

        return 'sent';
    }

    /** Insert a read receipt if it does not exist yet (idempotent). */
    public function markReadBy(int $userId): void
    {
        $this->reads()->firstOrCreate(
            ['user_id' => $userId],
            ['read_at' => now()]
        );
    }

    // ==================================================================
    // SCOPES
    // ==================================================================

    public function scopeVisible($query)
    {
        return $query->whereNull('deleted_at');
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }
}