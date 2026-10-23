<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $reporter_id
 * @property int $reported_id
 * @property string $reason
 * @property string|null $details
 * @property string $status
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 *
 * @property-read User $reporter
 * @property-read User $reported
 */
#[Fillable(['reporter_id', 'reported_id', 'reason', 'details', 'status'])]
class UserReport extends Model
{
    use SoftDeletes;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => 'string',
        ];
    }

    // ==================================================================
    // RELATIONSHIPS
    // ==================================================================

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    public function reported(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_id');
    }

    // ==================================================================
    // SCOPES
    // ==================================================================

    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    public function scopePendingReview($query)
    {
        return $query->whereIn('status', ['open', 'reviewing']);
    }
}