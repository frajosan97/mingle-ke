<?php
// app/Models/UserLike.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserLike extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'liked_user_id',
    ];

    /**
     * The user who gave the like.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The user who received the like.
     */
    public function likedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'liked_user_id');
    }
}