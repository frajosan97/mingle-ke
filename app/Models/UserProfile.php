<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string|null $orientation
 * @property int|null $height_cm
 * @property int|null $weight_kg
 * @property string|null $body_type
 * @property string|null $hair_color
 * @property string|null $eye_color
 * @property string|null $ethnicity
 * @property array|null $services
 * @property bool $smoking
 * @property bool $drinking
 * @property int|null $rate_15min
 * @property int|null $rate_30min
 * @property int|null $rate_1hour
 * @property int|null $rate_night
 * @property string $currency
 * @property bool $is_available
 * @property string $availability_status
 * @property bool $incall
 * @property bool $outcall
 * @property string|null $cover_image
 * @property array|null $gallery
 * @property bool $is_approved
 * @property Carbon|null $approved_at
 * @property bool $is_featured
 * @property int $profile_views
 * @property int $rating_count
 * @property float $rating_avg
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 *
 * @property-read User $user
 */
#[Fillable([
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
    'cover_image',
    'gallery',
    'is_approved',
    'approved_at',
    'is_featured',
    'profile_views',
    'rating_count',
    'rating_avg',
])]
class UserProfile extends Model
{
    use SoftDeletes;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'services' => 'array',
            'gallery' => 'array',
            'smoking' => 'boolean',
            'drinking' => 'boolean',
            'is_available' => 'boolean',
            'incall' => 'boolean',
            'outcall' => 'boolean',
            'is_approved' => 'boolean',
            'is_featured' => 'boolean',
            'approved_at' => 'datetime',
            'height_cm' => 'integer',
            'weight_kg' => 'integer',
            'rate_15min' => 'integer',
            'rate_30min' => 'integer',
            'rate_1hour' => 'integer',
            'rate_night' => 'integer',
            'profile_views' => 'integer',
            'rating_count' => 'integer',
            'rating_avg' => 'float',
        ];
    }

    // ==================================================================
    // RELATIONSHIPS
    // ==================================================================

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ==================================================================
    // HELPERS
    // ==================================================================

    /** Whether this profile is publicly visible right now. */
    public function isListed(): bool
    {
        return $this->is_approved
            && !$this->trashed()
            && $this->user !== null
            && !$this->user->trashed();
    }

    // ==================================================================
    // SCOPES
    // ==================================================================

    public function scopeApproved($query)
    {
        return $query->where('is_approved', true);
    }

    public function scopeAvailable($query)
    {
        return $query->where('is_available', true)
            ->whereIn('availability_status', ['online', 'incall', 'outcall']);
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    /**
     * Approximate radius search using Haversine on the parent user row.
     * Eloquent will add `users.deleted_at IS NULL` automatically because
     * User uses SoftDeletes.
     */
    public function scopeNearby($query, float $lat, float $lng, int $radiusKm = 25)
    {
        return $query->whereHas('user', function ($q) use ($lat, $lng, $radiusKm) {
            $q->whereNotNull('lat')
                ->whereNotNull('lng')
                ->whereRaw(
                    '(6371 * acos(cos(radians(?)) * cos(radians(lat)) * cos(radians(lng) - radians(?)) + sin(radians(?)) * sin(radians(lat)))) <= ?',
                    [$lat, $lng, $lat, $radiusKm]
                );
        });
    }
}