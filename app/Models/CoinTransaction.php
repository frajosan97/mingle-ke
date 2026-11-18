<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class CoinTransaction extends Model
{
    public const TYPE_PURCHASE = 'purchase';
    public const TYPE_BONUS = 'bonus';
    public const TYPE_INVITE = 'invite';
    public const TYPE_SPEND = 'spend';
    public const TYPE_REFUND = 'refund';

    protected $fillable = [
        'user_id',
        'type',
        'coins',
        'mpesa_transaction_id',
        'package_id',
        'reference',
        'description',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'coins' => 'integer',
            'mpesa_transaction_id' => 'integer',
            'package_id' => 'integer',
            'meta' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function mpesaTransaction(): BelongsTo
    {
        return $this->belongsTo(MpesaTransaction::class);
    }

    public function isCredit(): bool
    {
        return in_array($this->type, [
            self::TYPE_PURCHASE,
            self::TYPE_BONUS,
            self::TYPE_INVITE,
            self::TYPE_REFUND,
        ], true);
    }

    public function isDebit(): bool
    {
        return $this->type === self::TYPE_SPEND;
    }

    public function scopeOfType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }

    public function scopeCredits(Builder $query): Builder
    {
        return $query->whereIn('type', [
            self::TYPE_PURCHASE,
            self::TYPE_BONUS,
            self::TYPE_INVITE,
            self::TYPE_REFUND,
        ]);
    }

    public function scopeDebits(Builder $query): Builder
    {
        return $query->where('type', self::TYPE_SPEND);
    }

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForReference(
        Builder $query,
        string $reference
    ): Builder {
        return $query->where('reference', $reference);
    }
}
