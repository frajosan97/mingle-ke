<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $type
 * @property string $key
 * @property string $label
 * @property int|null $days
 * @property float $unit_price
 * @property float|null $total_price
 * @property string $currency
 * @property int $sort_order
 * @property bool $is_active
 * @property bool $is_default
 * @property string|null $badge
 * @property float $discount_percent
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
#[Fillable([
    'type',
    'key',
    'label',
    'days',
    'unit_price',
    'total_price',
    'currency',
    'sort_order',
    'is_active',
    'is_default',
    'badge',
    'discount_percent',
])]
class PricingPlan extends Model
{
    /** Priced feature: escort listing upgrade. */
    public const TYPE_ESCORT_LISTING = 'escort_listing';

    /** Priced feature: reveal a free-tier profile's phone. */
    public const TYPE_PHONE_REVEAL = 'phone_reveal';

    /** Priced feature: coin bundle. */
    public const TYPE_COIN_BUNDLE = 'coin_bundle';

    protected function casts(): array
    {
        return [
            'days' => 'integer',
            'unit_price' => 'decimal:2',
            'total_price' => 'decimal:2',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
            'is_default' => 'boolean',
            'discount_percent' => 'decimal:2',
        ];
    }

    // ==================================================================
    // SCOPES
    // ==================================================================

    public function scopeOfType(Builder $q, string $type): Builder
    {
        return $q->where('type', $type);
    }

    public function scopeActive(Builder $q): Builder
    {
        return $q->where('is_active', true);
    }

    public function scopeOrdered(Builder $q): Builder
    {
        return $q->orderBy('sort_order');
    }

    public function scopeDefault(Builder $q): Builder
    {
        return $q->where('is_default', true);
    }

    // ==================================================================
    // HELPERS
    // ==================================================================

    /** Total for this plan's own days (or unit_price * days fallback). */
    public function total(): float
    {
        if ($this->total_price !== null) {
            return (float) $this->total_price;
        }

        if ($this->days !== null) {
            return round((float) $this->unit_price * (int) $this->days, 2);
        }

        // Custom plan with no total_price → its unit_price is per day.
        return (float) $this->unit_price;
    }

    /**
     * Compute the total for a custom number of days using this plan's
     * per-day rate. Ignored for preset plans (they have fixed total_price).
     */
    public function priceFor(int $days): float
    {
        $days = max(1, $days);

        if ($this->total_price !== null && $this->days !== null && $this->days === $days) {
            return (float) $this->total_price;
        }

        return round((float) $this->unit_price * $days, 2);
    }

    /** Absolute money saved vs. raw `unit_price * days`. */
    public function discount(): float
    {
        if ($this->days === null || $this->total_price === null) {
            return 0.0;
        }

        $full = (float) $this->unit_price * (int) $this->days;

        return round(max(0, $full - (float) $this->total_price), 2);
    }

    /** True when this plan represents the user-picks-days case. */
    public function isCustom(): bool
    {
        return $this->days === null;
    }
}