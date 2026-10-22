<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $reviewer_id
 * @property int $escort_id
 * @property int $rating
 * @property string|null $body
 * @property bool $is_approved
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @property-read User $reviewer
 * @property-read User $escort
 * @property-read UserProfile|null $escortProfile
 */
#[Fillable(['reviewer_id', 'escort_id', 'rating', 'body', 'is_approved'])]
class UserReview extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'rating' => 'integer',
            'is_approved' => 'boolean',
        ];
    }

    // ==================================================================
    // RELATIONSHIPS
    // ==================================================================

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    public function escort(): BelongsTo
    {
        return $this->belongsTo(User::class, 'escort_id');
    }

    public function escortProfile(): BelongsTo
    {
        return $this->belongsTo(UserProfile::class, 'escort_id', 'user_id');
    }

    // ==================================================================
    // SCOPES
    // ==================================================================

    public function scopeApproved($query)
    {
        return $query->where('is_approved', true);
    }
}