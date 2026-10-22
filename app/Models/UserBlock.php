<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $blocker_id
 * @property int $blocked_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @property-read User $blocker
 * @property-read User $blocked
 */
#[Fillable(['blocker_id', 'blocked_id'])]
class UserBlock extends Model
{
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
}