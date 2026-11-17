<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
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
 * @property string $listing_tier
 * @property Carbon|null $listing_started_at
 * @property Carbon|null $listing_expires_at
 * @property bool $phone_visible
 * @property int $profile_views
 * @property int $rating_count
 * @property float $rating_avg
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 *
 * @property-read User $user
 * @property-read \Illuminate\Database\Eloquent\Collection<int, EscortListingPayment> $payments
 * @property-read \Illuminate\Database\Eloquent\Collection<int, PhoneReveal> $phoneReveals
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
    'listing_tier',
    'listing_started_at',
    'listing_expires_at',
    'phone_visible',
    'profile_views',
    'rating_count',
    'rating_avg',
])]
class UserProfile extends Model
{
    use SoftDeletes;

    // ==================================================================
    // CASTS
    // ==================================================================

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
            'phone_visible' => 'boolean',
            'approved_at' => 'datetime',
            'listing_started_at' => 'datetime',
            'listing_expires_at' => 'datetime',
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

    public function payments(): HasMany
    {
        return $this->hasMany(EscortListingPayment::class);
    }

    public function phoneReveals(): HasMany
    {
        return $this->hasMany(PhoneReveal::class);
    }

    // ==================================================================
    // HELPERS
    // ==================================================================

    /** Approved, not soft-deleted, and owner not soft-deleted. */
    public function isListed(): bool
    {
        return $this->is_approved
            && !$this->trashed()
            && $this->user !== null
            && !$this->user->trashed();
    }

    /** Paid escort tier is active (approved + unexpired). */
    public function hasActiveListing(): bool
    {
        return $this->listing_tier === 'escort'
            && $this->is_approved
            && $this->listing_expires_at !== null
            && $this->listing_expires_at->isFuture();
    }

    /** Phone is public only when escort tier is active and opted in. */
    public function phoneVisible(): bool
    {
        return $this->phone_visible && $this->hasActiveListing();
    }

    /** Increment the view counter without triggering updated_at. */
    public function incrementViews(): void
    {
        $this->increment('profile_views');
    }

    // ==================================================================
    // SCOPES
    // ==================================================================

    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('is_approved', true);
    }

    public function scopeAvailable(Builder $query): Builder
    {
        return $query->where('is_available', true)
            ->whereIn('availability_status', ['online', 'incall', 'outcall']);
    }

    public function scopeFeatured(Builder $query): Builder
    {
        return $query->where('is_featured', true);
    }

    public function scopeEscortTier(Builder $query): Builder
    {
        return $query->where('listing_tier', 'escort')
            ->where('is_approved', true)
            ->where('listing_expires_at', '>', now());
    }

    /**
     * Canonical sort across Discover / Home / Search.
     * Escort tier first, then featured, then most recently updated.
     */
    public function scopeRanked(Builder $query): Builder
    {
        return $query
            ->orderByRaw(
                "CASE WHEN listing_tier = 'escort'
                       AND is_approved = 1
                       AND listing_expires_at > NOW()
                      THEN 0 ELSE 1 END"
            )
            ->orderByDesc('is_featured')
            ->orderByDesc('updated_at');
    }

    /**
     * Radius search. Uses ST_Distance_Sphere when MySQL 8+ is detected,
     * otherwise falls back to Haversine. Skips users with no lat/lng.
     */
    public function scopeNearby(Builder $query, float $lat, float $lng, int $radiusKm = 25): Builder
    {
        return $query->whereHas('user', function (Builder $q) use ($lat, $lng, $radiusKm) {
            $q->whereNotNull('lat')
                ->whereNotNull('lng');

            if ($this->supportsDistanceSphere()) {
                $q->whereRaw(
                    'ST_Distance_Sphere(point(lng, lat), point(?, ?)) <= ?',
                    [$lng, $lat, $radiusKm * 1000]
                );
            } else {
                $q->whereRaw(
                    '(6371 * acos(
                        cos(radians(?)) * cos(radians(lat)) *
                        cos(radians(lng) - radians(?)) +
                        sin(radians(?)) * sin(radians(lat))
                    )) <= ?',
                    [$lat, $lng, $lat, $radiusKm]
                );
            }
        });
    }

    /** MySQL 8+ / MariaDB 10.2+ have ST_Distance_Sphere. */
    protected function supportsDistanceSphere(): bool
    {
        static $supported = null;

        if ($supported !== null) {
            return $supported;
        }

        $driver = config('database.default');
        $version = config("database.connections.{$driver}.version");

        $supported = $driver === 'mysql'
            && $version !== null
            && version_compare((string) $version, '8.0.0', '>=');

        return $supported;
    }
}