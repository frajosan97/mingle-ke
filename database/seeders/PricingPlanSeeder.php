<?php

namespace Database\Seeders;

use App\Models\PricingPlan;
use Illuminate\Database\Seeder;

class PricingPlanSeeder extends Seeder
{
    public function run(): void
    {
        $unit = 50;
        $currency = 'KES';

        $rows = [
            ['key' => 'daily', 'label' => 'Daily', 'days' => 1, 'sort_order' => 1, 'is_default' => true, 'badge' => null],
            ['key' => 'weekly', 'label' => 'Weekly', 'days' => 7, 'sort_order' => 2, 'is_default' => false, 'badge' => 'Popular'],
            ['key' => 'monthly', 'label' => 'Monthly', 'days' => 30, 'sort_order' => 3, 'is_default' => false, 'badge' => 'Best value'],
            ['key' => 'custom', 'label' => 'Custom days', 'days' => null, 'sort_order' => 4, 'is_default' => false, 'badge' => null],
        ];

        foreach ($rows as $row) {
            PricingPlan::updateOrCreate(
                ['type' => 'escort_listing', 'key' => $row['key']],
                array_merge($row, [
                    'type' => 'escort_listing',
                    'unit_price' => $unit,
                    'total_price' => $row['days'] ? $unit * $row['days'] : null,
                    'currency' => $currency,
                    'is_active' => true,
                ])
            );
        }
    }
}