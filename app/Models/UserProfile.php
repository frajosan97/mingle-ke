<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserProfile extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
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
        'profile_views',
        'rating_count',
        'rating_avg',
    ];

    protected $casts = [
        'services' => 'array',
        'gallery' => 'array',
        'smoking' => 'boolean',
        'drinking' => 'boolean',
        'is_available' => 'boolean',
        'incall' => 'boolean',
        'outcall' => 'boolean',
        'is_approved' => 'boolean',
        'is_featured' => 'boolean',
        'approved_at' => 'datetime',
        'rating_avg' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeApproved($query)
    {
        return $query->where('is_approved', true);
    }

    public function scopeAvailable($query)
    {
        return $query->where('is_available', true)
            ->where('availability_status', '!=', 'offline');
    }

    public function incrementViews(): void
    {
        $this->increment('profile_views');
    }
}