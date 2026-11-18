<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class MpesaTransaction extends Model
{
    public const TYPE_COINS_PURCHASE = 'coins_purchase';
    public const TYPE_ESCORT_LISTING_FEES = 'escort_listing_fees';
    public const TYPE_WITHDRAWAL = 'withdrawal';

    public const DIRECTION_INBOUND = 'inbound';
    public const DIRECTION_OUTBOUND = 'outbound';

    public const STATUS_PENDING = 'pending';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_UNKNOWN = 'unknown';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'user_id',
        'type',
        'direction',
        'status',
        'amount',
        'currency',
        'phone',
        'bill_ref_number',
        'reference',
        'checkout_request_id',
        'merchant_request_id',
        'mpesa_receipt',
        'trans_id',
        'user_profile_id',
        'pricing_plan_id',
        'days',
        'unit_price',
        'starts_at',
        'expires_at',
        'coins',
        'package_id',
        'result_code',
        'result_desc',
        'gateway_response',
        'meta',
        'requested_at',
        'completed_at',
        'failed_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'unit_price' => 'decimal:2',
            'days' => 'integer',
            'coins' => 'integer',
            'package_id' => 'integer',
            'gateway_response' => 'array',
            'meta' => 'array',
            'requested_at' => 'datetime',
            'completed_at' => 'datetime',
            'failed_at' => 'datetime',
            'starts_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (self $transaction) {
            if (blank($transaction->reference)) {
                $transaction->reference = 'MP-' . Str::upper(Str::random(20));
            }

            $transaction->currency ??= 'KES';
            $transaction->status ??= self::STATUS_PENDING;
            $transaction->direction ??= self::DIRECTION_INBOUND;
            $transaction->requested_at ??= now();
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(UserProfile::class, 'user_profile_id');
    }

    public function pricingPlan(): BelongsTo
    {
        return $this->belongsTo(PricingPlan::class);
    }

    public function coinTransactions(): HasMany
    {
        return $this->hasMany(CoinTransaction::class);
    }

    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    public function isPending(): bool
    {
        return in_array($this->status, [
            self::STATUS_PENDING,
            self::STATUS_PROCESSING,
            self::STATUS_UNKNOWN,
        ], true);
    }

    public function isTerminal(): bool
    {
        return in_array($this->status, [
            self::STATUS_COMPLETED,
            self::STATUS_FAILED,
            self::STATUS_CANCELLED,
        ], true);
    }

    public function scopeOfType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }

    public function scopeCompleted(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->whereIn('status', [
            self::STATUS_PENDING,
            self::STATUS_PROCESSING,
            self::STATUS_UNKNOWN,
        ]);
    }

    public function scopeInbound(Builder $query): Builder
    {
        return $query->where('direction', self::DIRECTION_INBOUND);
    }

    public function scopeOutbound(Builder $query): Builder
    {
        return $query->where('direction', self::DIRECTION_OUTBOUND);
    }
}
