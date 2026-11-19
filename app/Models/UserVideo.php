<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class UserVideo extends Model
{
    use HasFactory;
    use SoftDeletes;

    /*
    |--------------------------------------------------------------------------
    | Status constants
    |--------------------------------------------------------------------------
    */

    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';

    /*
    |--------------------------------------------------------------------------
    | Processing status constants
    |--------------------------------------------------------------------------
    */

    public const PROCESSING_PENDING = 'pending';
    public const PROCESSING_PROCESSING = 'processing';
    public const PROCESSING_READY = 'ready';
    public const PROCESSING_FAILED = 'failed';

    public const MAX_PER_USER = 3;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'path',
        'disk',
        'url',
        'thumbnail_path',
        'duration_seconds',
        'width',
        'height',
        'size_bytes',
        'mime_type',
        'sort_order',
        'status',
        'approved_at',
        'rejection_reason',
        'processing_status',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'duration_seconds' => 'integer',
        'width' => 'integer',
        'height' => 'integer',
        'size_bytes' => 'integer',
        'sort_order' => 'integer',
        'approved_at' => 'datetime',
    ];

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
    | Accessors / Mutators
    |--------------------------------------------------------------------------
    */

    protected function publicUrl(): Attribute
    {
        return Attribute::get(function (): ?string {
            if (!empty($this->url)) {
                return $this->url;
            }

            if (!$this->path) {
                return null;
            }

            /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
            $disk = Storage::disk($this->disk ?? 'public');

            return $disk->url($this->path);
        });
    }

    protected function thumbnailUrl(): Attribute
    {
        return Attribute::get(function (): ?string {
            if (!$this->thumbnail_path) {
                return null;
            }

            /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
            $disk = Storage::disk($this->disk ?? 'public');

            return $disk->url($this->thumbnail_path);
        });
    }

    /**
     * Human readable duration, e.g. "1:42".
     */
    protected function humanDuration(): Attribute
    {
        return Attribute::get(function (): ?string {
            $seconds = $this->duration_seconds;

            if ($seconds === null) {
                return null;
            }

            $minutes = intdiv($seconds, 60);
            $remaining = $seconds % 60;

            return sprintf('%d:%02d', $minutes, $remaining);
        });
    }

    protected function humanSize(): Attribute
    {
        return Attribute::get(function (): ?string {
            $bytes = $this->size_bytes;

            if ($bytes === null) {
                return null;
            }

            $units = ['B', 'KB', 'MB', 'GB'];
            $i = $bytes > 0 ? (int) floor(log($bytes, 1024)) : 0;
            $i = min($i, count($units) - 1);

            return round($bytes / (1024 ** $i), 2) . ' ' . $units[$i];
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeRejected(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_REJECTED);
    }

    public function scopeReady(Builder $query): Builder
    {
        return $query->where('processing_status', self::PROCESSING_READY);
    }

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order');
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    public function isApproved(): bool
    {
        return $this->status === self::STATUS_APPROVED;
    }

    public function isReady(): bool
    {
        return $this->processing_status === self::PROCESSING_READY;
    }

    public function approve(): bool
    {
        return $this->forceFill([
            'status' => self::STATUS_APPROVED,
            'approved_at' => now(),
            'rejection_reason' => null,
        ])->save();
    }

    public function reject(string $reason = null): bool
    {
        return $this->forceFill([
            'status' => self::STATUS_REJECTED,
            'approved_at' => null,
            'rejection_reason' => $reason,
        ])->save();
    }
}