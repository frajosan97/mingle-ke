<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CoinTransaction extends Model
{
    public const TYPE_PURCHASE = 'purchase';
    public const TYPE_BONUS = 'bonus';
    public const TYPE_INVITE = 'invite';
    public const TYPE_SPEND = 'spend';
    public const TYPE_REFUND = 'refund';

    public const STATUS_PENDING = 'pending';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';
    public const STATUS_CANCELLED = 'cancelled';

    public const SOURCE_STK = 'stk';
    public const SOURCE_C2B = 'c2b';

    protected $fillable = [
        'user_id',
        'type',
        'status',
        'coins',
        'amount_kes',
        'package_id',
        'method',
        'source',
        'checkout_request_id',
        'merchant_request_id',
        'mpesa_receipt',
        'trans_id',
        'bill_ref_number',
        'phone',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
        'amount_kes' => 'decimal:2',
        'coins' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isTerminal(): bool
    {
        return in_array($this->status, [
            self::STATUS_COMPLETED,
            self::STATUS_FAILED,
            self::STATUS_CANCELLED,
        ], true);
    }
}