<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * MessageAttachment Model
 *
 * @property int $id
 * @property int $message_id
 * @property string $type
 * @property string $disk
 * @property string $path
 * @property string|null $original_name
 * @property string|null $mime_type
 * @property int|null $size_bytes
 * @property int|null $width
 * @property int|null $height
 * @property int|null $duration_seconds
 * @property int $position
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 *
 * @property-read string $url
 * @property-read bool $is_image
 * @property-read bool $is_video
 * @property-read bool $is_audio
 * @property-read bool $is_file
 * @property-read Message $message
 */
#[Fillable([
    'message_id',
    'type',
    'disk',
    'path',
    'original_name',
    'mime_type',
    'size_bytes',
    'width',
    'height',
    'duration_seconds',
    'position',
])]
class MessageAttachment extends Model
{
    use SoftDeletes;

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'url',
    ];

    /**
     * Get the model's attribute casts.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'size_bytes' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
            'duration_seconds' => 'integer',
            'position' => 'integer',
        ];
    }

    // ==============================================================
    // RELATIONSHIPS
    // ==============================================================

    /**
     * Get the message that owns this attachment.
     *
     * @return BelongsTo<Message, $this>
     */
    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }

    // ==============================================================
    // ACCESSORS
    // ==============================================================

    /**
     * Get the public URL for the attachment.
     *
     * @return Attribute<string, never>
     */
    protected function url(): Attribute
    {
        return Attribute::get(
            function (): string {
                try {
                    /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
                    $disk = Storage::disk($this->disk);

                    return $disk->url($this->path) ?: '';
                } catch (\Throwable $e) {
                    report($e);

                    return '';
                }
            }
        );
    }

    /**
     * Determine whether the attachment is an image.
     *
     * @return Attribute<bool, never>
     */
    protected function isImage(): Attribute
    {
        return Attribute::get(
            fn(): bool => $this->type === 'image'
        );
    }

    /**
     * Determine whether the attachment is a video.
     *
     * @return Attribute<bool, never>
     */
    protected function isVideo(): Attribute
    {
        return Attribute::get(
            fn(): bool => $this->type === 'video'
        );
    }

    /**
     * Determine whether the attachment is audio.
     *
     * @return Attribute<bool, never>
     */
    protected function isAudio(): Attribute
    {
        return Attribute::get(
            fn(): bool => $this->type === 'audio'
        );
    }

    /**
     * Determine whether the attachment is a generic file.
     *
     * @return Attribute<bool, never>
     */
    protected function isFile(): Attribute
    {
        return Attribute::get(
            fn(): bool => $this->type === 'file'
        );
    }
}