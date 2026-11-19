<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class UserImage extends Model
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
    public const MAX_PER_USER = 8;

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
        'width',
        'height',
        'size_bytes',
        'mime_type',
        'is_cover',
        'sort_order',
        'status',
        'approved_at',
        'rejection_reason',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_cover' => 'boolean',
        'width' => 'integer',
        'height' => 'integer',
        'size_bytes' => 'integer',
        'sort_order' => 'integer',
        'status' => 'string',
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

    /**
     * Public URL for the image, preferring the stored `url` column
     * and falling back to the filesystem disk.
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

    /**
     * Human readable size, e.g. "1.4 MB".
     */
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

    public function scopeCover(Builder $query): Builder
    {
        return $query->where('is_cover', true);
    }

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Default ordering: cover first, then manual sort order.
     */
    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderByDesc('is_cover')->orderBy('sort_order');
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