<?php

namespace Database\Seeders;

use App\Models\CoinPackage;
use Illuminate\Database\Seeder;

class CoinPackageSeeder extends Seeder
{
    public function run(): void
    {
        $packages = [
            [
                'name' => 'Starter',
                'coins' => 50,
                'bonus' => 0,
                'price' => 50,
                'is_popular' => false,
            ],
            [
                'name' => 'Basic',
                'coins' => 110,
                'bonus' => 10,
                'price' => 100,
                'is_popular' => false,
            ],
            [
                'name' => 'Standard',
                'coins' => 180,
                'bonus' => 9,
                'price' => 165,
                'is_popular' => false,
            ],
            [
                'name' => 'Popular',
                'coins' => 280,
                'bonus' => 12,
                'price' => 250,
                'is_popular' => true,
            ],
            [
                'name' => 'Premium',
                'coins' => 380,
                'bonus' => 15,
                'price' => 330,
                'is_popular' => false,
            ],
            [
                'name' => 'Pro',
                'coins' => 600,
                'bonus' => 20,
                'price' => 500,
                'is_popular' => false,
            ],
            [
                'name' => 'Ultimate',
                'coins' => 1050,
                'bonus' => 28,
                'price' => 820,
                'is_popular' => false,
            ],
        ];

        foreach ($packages as $index => $package) {
            CoinPackage::updateOrCreate(
                ['price' => $package['price']],
                [
                    ...$package,
                    'sort_order' => $index + 1,
                    'is_active' => true,
                ]
            );
        }
    }
}
