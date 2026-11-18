<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PointTransaction extends Model
{
    use HasFactory;

    /*
    |--------------------------------------------------------------------------
    | Transaction types
    |--------------------------------------------------------------------------
    */

    public const TYPE_EARNED = 'earned';

    public const TYPE_WITHDRAWAL = 'withdrawal';

    public const TYPE_ADJUSTMENT = 'adjustment';

    public const TYPE_REFERRAL = 'referral';

    public const TYPE_BONUS = 'bonus';

    /*
    |--------------------------------------------------------------------------
    | Transaction directions
    |--------------------------------------------------------------------------
    */

    public const DIRECTION_CREDIT = 'credit';

    public const DIRECTION_DEBIT = 'debit';

    /*
    |--------------------------------------------------------------------------
    | Mass assignment
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        'user_id',
        'type',
        'direction',
        'points',
        'reference',
        'description',
        'meta',
    ];

    /*
    |--------------------------------------------------------------------------
    | Attribute casting
    |--------------------------------------------------------------------------
    */

    protected function casts(): array
    {
        return [
            'points' => 'integer',
            'meta' => 'array',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Query scopes
    |--------------------------------------------------------------------------
    */

    public function scopeCredits(Builder $query): Builder
    {
        return $query->where(
            'direction',
            self::DIRECTION_CREDIT
        );
    }

    public function scopeDebits(Builder $query): Builder
    {
        return $query->where(
            'direction',
            self::DIRECTION_DEBIT
        );
    }

    public function scopeEarned(Builder $query): Builder
    {
        return $query->whereIn('type', [
            self::TYPE_EARNED,
            self::TYPE_REFERRAL,
            self::TYPE_BONUS,
        ]);
    }

    public function scopeWithdrawals(Builder $query): Builder
    {
        return $query->where(
            'type',
            self::TYPE_WITHDRAWAL
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    public function isCredit(): bool
    {
        return $this->direction === self::DIRECTION_CREDIT;
    }

    public function isDebit(): bool
    {
        return $this->direction === self::DIRECTION_DEBIT;
    }
}
