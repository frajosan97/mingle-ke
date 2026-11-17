<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $viewer_id
 * @property int $user_profile_id
 * @property int $coins_spent
 * @property Carbon $revealed_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @property-read User $viewer
 * @property-read UserProfile $profile
 */
#[Fillable([
    'viewer_id',
    'user_profile_id',
    'coins_spent',
    'revealed_at',
])]
class PhoneReveal extends Model
{
    protected function casts(): array
    {
        return [
            'coins_spent' => 'integer',
            'revealed_at' => 'datetime',
        ];
    }

    // ==================================================================
    // RELATIONSHIPS
    // ==================================================================

    public function viewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'viewer_id');
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(UserProfile::class, 'user_profile_id');
    }

    // ==================================================================
    // HELPERS
    // ==================================================================

    /** Free reveal (e.g. escort-tier profile whose phone is public). */
    public function isFree(): bool
    {
        return $this->coins_spent === 0;
    }

    /** Whether this reveal is still "fresh" (optional TTL window). */
    public function isFresh(int $days = 30): bool
    {
        return $this->revealed_at->greaterThan(now()->subDays($days));
    }

    /** Create-or-return an existing reveal without double-charging. */
    public static function ensure(
        User $viewer,
        UserProfile $profile,
        int $cost
    ): self {
        return self::firstOrCreate(
            [
                'viewer_id' => $viewer->id,
                'user_profile_id' => $profile->id,
            ],
            [
                'coins_spent' => $cost,
                'revealed_at' => now(),
            ]
        );
    }

    /** Whether this viewer has already revealed this profile's phone. */
    public static function alreadyRevealed(User $viewer, UserProfile $profile): bool
    {
        return self::query()
            ->where('viewer_id', $viewer->id)
            ->where('user_profile_id', $profile->id)
            ->exists();
    }

    // ==================================================================
    // SCOPES
    // ==================================================================

    public function scopeByViewer(Builder $q, int $viewerId): Builder
    {
        return $q->where('viewer_id', $viewerId);
    }

    public function scopeForProfile(Builder $q, int $profileId): Builder
    {
        return $q->where('user_profile_id', $profileId);
    }

    public function scopePaidReveals(Builder $q): Builder
    {
        return $q->where('coins_spent', '>', 0);
    }

    public function scopeRecent(Builder $q, int $days = 30): Builder
    {
        return $q->where('revealed_at', '>=', now()->subDays($days));
    }
}