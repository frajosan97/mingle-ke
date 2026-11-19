<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'name',
    'coins',
    'price',
    'bonus',
    'is_popular',
    'is_active',
    'sort_order',
])]
class CoinPackage extends Model
{
    protected function casts(): array
    {
        return [
            'coins' => 'integer',
            'price' => 'decimal:2',
            'bonus' => 'integer',
            'is_popular' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')
            ->orderBy('id');
    }

    public function scopePopular(Builder $query): Builder
    {
        return $query->where('is_popular', true);
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    public function totalCoins(): int
    {
        return $this->coins;
    }

    public function baseCoins(): int
    {
        return max(0, $this->coins - $this->bonus);
    }

    public function hasBonus(): bool
    {
        return $this->bonus > 0;
    }

    public function pricePerCoin(): float
    {
        return $this->coins > 0
            ? round((float) $this->price / $this->coins, 2)
            : 0;
    }
}
