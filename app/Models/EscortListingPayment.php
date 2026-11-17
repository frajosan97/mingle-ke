<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property int $user_id
 * @property int|null $user_profile_id
 * @property int|null $pricing_plan_id
 * @property string $gateway
 * @property string $reference
 * @property string|null $gateway_reference
 * @property int $days
 * @property float $unit_price
 * @property float $amount
 * @property string $currency
 * @property string $status
 * @property array|null $payload
 * @property Carbon|null $paid_at
 * @property Carbon|null $starts_at
 * @property Carbon|null $expires_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @property-read User $user
 * @property-read UserProfile|null $profile
 * @property-read PricingPlan|null $plan
 */
#[Fillable([
    'user_id',
    'user_profile_id',
    'pricing_plan_id',
    'gateway',
    'reference',
    'gateway_reference',
    'days',
    'unit_price',
    'amount',
    'currency',
    'status',
    'payload',
    'paid_at',
    'starts_at',
    'expires_at',
])]
class EscortListingPayment extends Model
{
    // Gateway values
    public const GATEWAY_MPESA = 'mpesa';
    public const GATEWAY_STRIPE = 'stripe';

    // Status values
    public const STATUS_PENDING = 'pending';
    public const STATUS_PAID = 'paid';
    public const STATUS_FAILED = 'failed';
    public const STATUS_CANCELLED = 'cancelled';

    protected function casts(): array
    {
        return [
            'days' => 'integer',
            'unit_price' => 'decimal:2',
            'amount' => 'decimal:2',
            'payload' => 'array',
            'paid_at' => 'datetime',
            'starts_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    // ==================================================================
    // BOOT HOOKS
    // ==================================================================

    protected static function booted(): void
    {
        static::creating(function (EscortListingPayment $payment): void {
            // Every payment must have a unique internal reference.
            if (empty($payment->reference)) {
                $payment->reference = self::generateReference();
            }
        });
    }

    // ==================================================================
    // RELATIONSHIPS
    // ==================================================================

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(UserProfile::class, 'user_profile_id');
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(PricingPlan::class, 'pricing_plan_id');
    }

    // ==================================================================
    // HELPERS
    // ==================================================================

    /** Internal reference, e.g. ESC-AB12CD34EF-1731680000. */
    public static function generateReference(): string
    {
        return 'ESC-' . strtoupper(Str::random(10)) . '-' . now()->timestamp;
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isPaid(): bool
    {
        return $this->status === self::STATUS_PAID;
    }

    public function isFailed(): bool
    {
        return in_array($this->status, [
            self::STATUS_FAILED,
            self::STATUS_CANCELLED,
        ], true);
    }

    /** Paid and within the active listing window. */
    public function isActive(): bool
    {
        return $this->isPaid()
            && $this->expires_at !== null
            && $this->expires_at->isFuture();
    }

    /** Days remaining on this listing (0 if expired). */
    public function daysRemaining(): int
    {
        if (!$this->isActive()) {
            return 0;
        }

        return max(0, (int) now()->diffInDays($this->expires_at, false));
    }

    /** Mark this payment as successfully paid. Idempotent. */
    public function markPaid(?string $gatewayReference = null, array $payload = []): bool
    {
        if ($this->isPaid()) {
            return false;
        }

        $starts = now();
        $expires = $starts->copy()->addDays($this->days);

        $this->update([
            'status' => self::STATUS_PAID,
            'gateway_reference' => $gatewayReference ?? $this->gateway_reference,
            'paid_at' => $starts,
            'starts_at' => $starts,
            'expires_at' => $expires,
            'payload' => $payload ?: $this->payload,
        ]);

        return true;
    }

    /** Mark as failed/cancelled. Idempotent — never overwrites a paid row. */
    public function markFailed(array $payload = [], bool $cancel = false): bool
    {
        if ($this->isPaid()) {
            return false;
        }

        $this->update([
            'status' => $cancel ? self::STATUS_CANCELLED : self::STATUS_FAILED,
            'payload' => $payload ?: $this->payload,
        ]);

        return true;
    }

    // ==================================================================
    // SCOPES
    // ==================================================================

    public function scopePending(Builder $q): Builder
    {
        return $q->where('status', self::STATUS_PENDING);
    }

    public function scopePaid(Builder $q): Builder
    {
        return $q->where('status', self::STATUS_PAID);
    }

    public function scopeActive(Builder $q): Builder
    {
        return $q->where('status', self::STATUS_PAID)
            ->where('expires_at', '>', now());
    }

    public function scopeByGateway(Builder $q, string $gateway): Builder
    {
        return $q->where('gateway', $gateway);
    }

    public function scopeByReference(Builder $q, string $reference): Builder
    {
        return $q->where('reference', $reference);
    }
}