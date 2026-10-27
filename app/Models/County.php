<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class County extends Model
{
    protected $fillable = ['code', 'name', 'slug', 'lat', 'lng'];

    public function towns(): HasMany
    {
        return $this->hasMany(Town::class);
    }
}