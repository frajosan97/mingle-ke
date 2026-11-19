<?php

namespace Database\Seeders;

use App\Models\PricingPlan;
use Illuminate\Database\Seeder;

class PricingPlanSeeder extends Seeder
{
    public function run(): void
    {
        $unit = 100;
        $currency = 'KES';
        $discount = 10;

        $rows = [
            [
                'key' => 'daily',
                'label' => 'Daily',
                'days' => 1,
                'sort_order' => 1,
                'is_default' => true,
                'badge' => null,
                'discount_percent' => 0,
            ],
            [
                'key' => 'weekly',
                'label' => 'Weekly',
                'days' => 7,
                'sort_order' => 2,
                'is_default' => false,
                'badge' => 'Popular',
                'discount_percent' => $discount,
            ],
            [
                'key' => 'monthly',
                'label' => 'Monthly',
                'days' => 30,
                'sort_order' => 3,
                'is_default' => false,
                'badge' => 'Best value',
                'discount_percent' => $discount,
            ],
            [
                'key' => 'custom',
                'label' => 'Custom days',
                'days' => null,
                'sort_order' => 4,
                'is_default' => false,
                'badge' => null,
                'discount_percent' => $discount,
            ],
        ];

        foreach ($rows as $row) {
            $days = $row['days'];
            $discountPercent = $row['discount_percent'];

            $basePrice = $days !== null
                ? $unit * $days
                : null;

            $totalPrice = $basePrice !== null
                ? round(
                    $basePrice * (1 - ($discountPercent / 100)),
                    2
                )
                : null;

            PricingPlan::updateOrCreate(
                [
                    'type' => PricingPlan::TYPE_ESCORT_LISTING,
                    'key' => $row['key'],
                ],
                array_merge($row, [
                    'type' => PricingPlan::TYPE_ESCORT_LISTING,
                    'unit_price' => $unit,
                    'total_price' => $totalPrice,
                    'currency' => $currency,
                    'is_active' => true,
                ])
            );
        }
    }
}
