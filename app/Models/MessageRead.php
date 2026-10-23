<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $message_id
 * @property int $user_id
 * @property Carbon $read_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 *
 * @property-read Message $message
 * @property-read User $user
 */
#[Fillable(['message_id', 'user_id', 'read_at'])]
class MessageRead extends Model
{
    use SoftDeletes;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    // ==================================================================
    // RELATIONSHIPS
    // ==================================================================

    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}