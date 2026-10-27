<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Database\Seeder;

class EscortProfileSeeder extends Seeder
{
    private const PREMIUM_TARGET = 12;
    private const REGULAR_TARGET = 12;

    /**
     * Counties where hourly rates scale up. Everything else uses the
     * base rate. Add more if you want other metros to be premium-priced.
     */
    private const PREMIUM_COUNTIES = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'];

    public function run(): void
    {
        $premiumUsers = User::whereDoesntHave('profile')
            ->where('tier', 'premium')
            ->inRandomOrder()
            ->limit(self::PREMIUM_TARGET)
            ->get();

        $regularUsers = User::whereDoesntHave('profile')
            ->where('tier', 'regular')
            ->inRandomOrder()
            ->limit(self::REGULAR_TARGET)
            ->get();

        $allUsers = $premiumUsers->concat($regularUsers);

        if ($allUsers->isEmpty()) {
            $this->command->warn('No users available to seed escort profiles.');
            return;
        }

        if ($premiumUsers->count() < self::PREMIUM_TARGET) {
            $this->command->warn(sprintf(
                'Only %d premium users available (target: %d).',
                $premiumUsers->count(),
                self::PREMIUM_TARGET,
            ));
        }
        if ($regularUsers->count() < self::REGULAR_TARGET) {
            $this->command->warn(sprintf(
                'Only %d regular users available (target: %d).',
                $regularUsers->count(),
                self::REGULAR_TARGET,
            ));
        }

        $servicesPool = [
            'dinner dates',
            'events',
            'travel',
            'overnight',
            'massage',
            'companionship',
            'club nights',
            'weekend getaways',
        ];

        $bodyTypes = ['slim', 'athletic', 'curvy', 'average', 'petite', 'muscular'];
        $hairColors = ['black', 'brown', 'blonde', 'auburn'];
        $eyeColors = ['brown', 'black', 'hazel'];
        $ethnicities = ['Kikuyu', 'Luo', 'Kalenjin', 'Luhya', 'Kamba', 'Meru', 'Swahili', 'Somali'];
        $statuses = ['online', 'incall', 'outcall'];

        // eager-load the town+county so we can read the county name per user
        $allUsers->load(['town.county']);

        foreach ($allUsers as $user) {
            $countyName = $user->town?->county?->name;
            $isPremiumCity = $countyName && in_array($countyName, self::PREMIUM_COUNTIES, true);

            $hourlyBase = $isPremiumCity ? 4000 : 2500;
            $rate1h = $hourlyBase + (rand(-2, 3) * 500);
            $rateNight = $rate1h * 4;

            shuffle($servicesPool);
            $services = array_slice($servicesPool, 0, rand(3, 5));

            UserProfile::create([
                'user_id' => $user->id,
                'orientation' => 'straight',
                'height_cm' => $user->gender === 'female' ? rand(155, 175) : rand(170, 190),
                'weight_kg' => $user->gender === 'female' ? rand(48, 70) : rand(65, 90),
                'body_type' => $bodyTypes[array_rand($bodyTypes)],
                'hair_color' => $hairColors[array_rand($hairColors)],
                'eye_color' => $eyeColors[array_rand($eyeColors)],
                'ethnicity' => $ethnicities[array_rand($ethnicities)],
                'services' => $services,
                'smoking' => (bool) rand(0, 1),
                'drinking' => (bool) rand(0, 1),
                'rate_15min' => (int) round($rate1h * 0.35 / 100) * 100,
                'rate_30min' => (int) round($rate1h * 0.6 / 100) * 100,
                'rate_1hour' => $rate1h,
                'rate_night' => $rateNight,
                'currency' => 'KES',
                'is_available' => true,
                'availability_status' => $statuses[array_rand($statuses)],
                'incall' => (bool) rand(0, 1),
                'outcall' => (bool) rand(0, 1),
                'cover_image' => null,
                'gallery' => [],
                'is_approved' => true,
                'approved_at' => now()->subDays(rand(1, 30)),
                'is_featured' => rand(1, 10) <= 2,
                'profile_views' => rand(20, 800),
                'rating_count' => rand(0, 40),
                'rating_avg' => rand(0, 50) / 10,
            ]);
        }

        $this->command->info(sprintf(
            'Seeded %d escort profiles (%d premium, %d regular).',
            $allUsers->count(),
            $premiumUsers->count(),
            $regularUsers->count(),
        ));
    }
}