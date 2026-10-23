<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_one_id
 * @property int $user_two_id
 * @property Carbon|null $last_message_at
 * @property string|null $last_message_preview
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 *
 * @property-read User $userOne
 * @property-read User $userTwo
 * @property-read \Illuminate\Database\Eloquent\Collection<int, ConversationParticipant> $participants
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Message> $messages
 * @property-read Message|null $latestMessage
 */
#[Fillable([
    'user_one_id',
    'user_two_id',
    'last_message_at',
    'last_message_preview',
])]
class Conversation extends Model
{
    use SoftDeletes;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'last_message_at' => 'datetime',
        ];
    }

    // ==================================================================
    // INVARIANT: user_one_id < user_two_id
    // ==================================================================

    protected static function booted(): void
    {
        static::creating(function (Conversation $conversation): void {
            if ((int) $conversation->user_one_id === (int) $conversation->user_two_id) {
                throw new \InvalidArgumentException(
                    'A conversation requires two different users.',
                );
            }

            if ((int) $conversation->user_one_id > (int) $conversation->user_two_id) {
                [
                    $conversation->user_one_id,
                    $conversation->user_two_id,
                ] = [
                    $conversation->user_two_id,
                    $conversation->user_one_id,
                ];
            }
        });
    }


    // ==================================================================
    // RELATIONSHIPS
    // ==================================================================

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
        return $this->hasMany(Message::class)->orderBy('created_at');
    }

    public function latestMessage(): HasOne
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }

    // ==================================================================
    // HELPERS
    // ==================================================================
    public function otherUserFor(int|string $viewerId): ?User
    {
        return (string) $this->user_one_id === (string) $viewerId
            ? $this->userTwo
            : $this->userOne;
    }

    /** Participant row for a given user. */
    public function participantFor(int $userId): ?ConversationParticipant
    {
        return $this->participants->firstWhere('user_id', $userId)
            ?? $this->participants()->where('user_id', $userId)->first();
    }

    // ==================================================================
    // STATIC HELPERS
    // ==================================================================
    public static function between(int $a, int $b): self
    {
        [$one, $two] = $a < $b ? [$a, $b] : [$b, $a];

        $conversation = static::withTrashed()->firstOrCreate(
            ['user_one_id' => $one, 'user_two_id' => $two]
        );

        if ($conversation->trashed()) {
            $conversation->restore();
        }

        if ($conversation->wasRecentlyCreated) {
            $conversation->participants()->createMany([
                ['user_id' => $one],
                ['user_id' => $two],
            ]);
        }

        return $conversation;
    }

    // ==================================================================
    // SCOPES
    // ==================================================================

    public function scopeForUser($query, int $userId)
    {
        return $query->where(function ($q) use ($userId) {
            $q->where('user_one_id', $userId)
                ->orWhere('user_two_id', $userId);
        });
    }

    public function scopeOrderedByActivity($query)
    {
        return $query->orderByDesc('last_message_at');
    }
}