<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $blocker_id
 * @property int $blocked_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 *
 * @property-read User $blocker
 * @property-read User $blocked
 */
#[Fillable(['blocker_id', 'blocked_id'])]
class UserBlock extends Model
{
    use SoftDeletes;

    // ==================================================================
    // RELATIONSHIPS
    // ==================================================================

    public function blocker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'blocker_id');
    }

    public function blocked(): BelongsTo
    {
        return $this->belongsTo(User::class, 'blocked_id');
    }

    // ==================================================================
    // HELPERS
    // ==================================================================

    /**
     * Idempotent block: revives a previously soft-deleted row instead of
     * hitting the (blocker_id, blocked_id, deleted_at) unique constraint.
     */
    public static function block(int $blockerId, int $blockedId): self
    {
        $row = static::withTrashed()
            ->where('blocker_id', $blockerId)
            ->where('blocked_id', $blockedId)
            ->first();

        if ($row) {
            if ($row->trashed()) {
                $row->restore();
            }
            return $row;
        }

        return static::create([
            'blocker_id' => $blockerId,
            'blocked_id' => $blockedId,
        ]);
    }
}