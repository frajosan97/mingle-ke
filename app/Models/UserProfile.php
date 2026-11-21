<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class UserProfile extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'orientation',
        'height_cm',
        'weight_kg',
        'body_type',
        'hair_color',
        'eye_color',
        'ethnicity',
        'services',
        'smoking',
        'drinking',
        'rate_15min',
        'rate_30min',
        'rate_1hour',
        'rate_night',
        'currency',
        'is_available',
        'availability_status',
        'incall',
        'outcall',
        'is_approved',
        'approved_at',
        'is_featured',
        'phone_visible',
        'profile_views',
        'rating_count',
        'rating_avg',
    ];

    protected function casts(): array
    {
        return [
            'services' => 'array',
            'smoking' => 'boolean',
            'drinking' => 'boolean',
            'is_available' => 'boolean',
            'incall' => 'boolean',
            'outcall' => 'boolean',
            'is_approved' => 'boolean',
            'is_featured' => 'boolean',
            'phone_visible' => 'boolean',
            'height_cm' => 'integer',
            'weight_kg' => 'integer',
            'rate_15min' => 'integer',
            'rate_30min' => 'integer',
            'rate_1hour' => 'integer',
            'rate_night' => 'integer',
            'profile_views' => 'integer',
            'rating_count' => 'integer',
            'rating_avg' => 'decimal:2',
            'approved_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function mpesaTransactions(): HasMany
    {
        return $this->hasMany(
            MpesaTransaction::class,
            'user_profile_id'
        );
    }

    public function listingPayments(): HasMany
    {
        return $this->mpesaTransactions()
            ->where('type', MpesaTransaction::TYPE_ESCORT_LISTING_FEES);
    }

    /**
     * A user with a profile is automatically an escort.
     */
    public function isListed(): bool
    {
        return true;
    }

    /**
     * Profiles are automatically listed.
     */
    public function hasActiveListing(): bool
    {
        return true;
    }

    public function isPhoneVisible(): bool
    {
        return (bool) $this->phone_visible;
    }

    public function incrementViews(int $amount = 1): void
    {
        if ($amount < 1) {
            return;
        }

        $this->increment('profile_views', $amount);
    }

    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('is_approved', true);
    }

    public function scopeAvailable(Builder $query): Builder
    {
        return $query->where('is_available', true);
    }

    public function scopeFeatured(Builder $query): Builder
    {
        return $query->where('is_featured', true);
    }

    /**
     * Every existing profile is an escort.
     */
    public function scopeEscortTier(Builder $query): Builder
    {
        return $query;
    }

    /**
     * Every profile has an active listing.
     */
    public function scopeActiveListing(Builder $query): Builder
    {
        return $query;
    }

    public function scopeRanked(Builder $query): Builder
    {
        return $query->orderByDesc('is_featured')
            ->orderByDesc('rating_avg')
            ->orderByDesc('rating_count');
    }
}
