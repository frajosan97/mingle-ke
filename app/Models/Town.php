<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Town extends Model
{
    protected $fillable = ['county_id', 'name', 'slug', 'lat', 'lng', 'is_major'];

    protected $casts = [
        'is_major' => 'boolean',
        'lat' => 'float',
        'lng' => 'float',
    ];

    public function county(): BelongsTo
    {
        return $this->belongsTo(County::class);
    }
}