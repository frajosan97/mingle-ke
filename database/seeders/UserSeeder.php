<?php

namespace Database\Seeders;

use App\Models\County;
use App\Models\Town;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Throwable;

class UserSeeder extends Seeder
{
    /**
     * Where seeded avatars live on the "public" disk.
     */
    private const AVATAR_DIR = 'avatars/seed';

    /**
     * pravatar image size requested.
     */
    private const AVATAR_SIZE = 400;

    /**
     * Demo avatar pools, keyed by gender. Dev/testing only — lives here
     * because the production model must not know about pravatar.cc.
     *
     * @var array<string, array<int, int>>
     */
    private const AVATAR_POOLS = [
        'male' => [12, 33, 51, 52, 56, 57, 58, 59, 60, 68],
        'female' => [20, 23, 26, 32, 44, 45, 47, 49, 5, 9],
        'other' => [20, 23, 26, 32, 44, 45, 47, 49, 5, 9],
    ];

    /**
     * In-memory cache: imgId => stored relative path.
     * Several users share the same image id, so we only download each once
     * per seed run.
     *
     * @var array<int, string>
     */
    private array $avatarCache = [];

    public function run(): void
    {
        Storage::disk('public')->makeDirectory(self::AVATAR_DIR);

        foreach ($this->users() as $row) {
            $county = County::where('name', $row['county'])->first();
            $town = $county
                ? $county->towns()->where('name', $row['town'])->first()
                : null;

            $user = User::updateOrCreate(
                ['email' => $row['email']],
                [
                    'name' => $row['name'],
                    'phone' => $row['phone'],
                    'password' => Hash::make('Password123!'),
                    // avatar is set below, after we have $user->id
                    'age' => $row['age'],
                    'gender' => $row['gender'],
                    'bio' => $row['bio'],
                    'tier' => $row['tier'],
                    'coins' => $row['coins'],
                    'lat' => $row['lat'],
                    'lng' => $row['lng'],
                    'county_id' => $county?->id,
                    'town_id' => $town?->id,
                    // Display fallback if lookups fail — otherwise "Town, County"
                    'area' => $town && $county
                        ? "{$town->name}, {$county->name}"
                        : "{$row['town']}, {$row['county']}",
                    'is_verified' => $row['is_verified'],
                    'email_verified_at' => now(),
                    'last_active_at' => now()->subMinutes(rand(1, 240)),
                ]
            );

            // Idempotent: only fetch an avatar if the user doesn't have one.
            if (blank($user->avatar)) {
                $path = $this->resolveSeededAvatar($user);
                if ($path) {
                    $user->forceFill(['avatar' => $path])->saveQuietly();
                }
            }
        }
    }

    /**
     * Return the stored path for this user's demo avatar, downloading the
     * shared file on first use. Returns null if the download fails, in which
     * case the user simply keeps `avatar = null` and the UI shows initials.
     */
    private function resolveSeededAvatar(User $user): ?string
    {
        $imgId = $this->avatarImageIdFor($user);

        // Already resolved this image in this seed run.
        if (isset($this->avatarCache[$imgId])) {
            return $this->avatarCache[$imgId];
        }

        $relativePath = sprintf(
            '%s/pravatar-%d-%d.jpg',
            self::AVATAR_DIR,
            self::AVATAR_SIZE,
            $imgId,
        );

        // Already on disk from a previous seed run — reuse it.
        if (!Storage::disk('public')->exists($relativePath)) {
            $url = sprintf(
                'https://i.pravatar.cc/%d?img=%d',
                self::AVATAR_SIZE,
                $imgId,
            );

            try {
                $response = Http::timeout(10)->get($url);

                if (!$response->successful()) {
                    $this->command?->warn(
                        "Avatar download failed for img #{$imgId}: HTTP {$response->status()}"
                    );
                    return null;
                }

                Storage::disk('public')->put($relativePath, $response->body());
            } catch (Throwable $e) {
                $this->command?->warn(
                    "Avatar download error for img #{$imgId}: {$e->getMessage()}"
                );
                return null;
            }
        }

        return $this->avatarCache[$imgId] = $relativePath;
    }

    /**
     * Deterministically pick a pravatar image id for a user, based on
     * gender + id. Same user always gets the same image.
     */
    private function avatarImageIdFor(User $user): int
    {
        $pool = self::AVATAR_POOLS[$user->gender ?? 'other']
            ?? self::AVATAR_POOLS['other'];

        return $pool[$user->id % count($pool)];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function users(): array
    {
        return [
            // ─── Nairobi ─────────────────────────────────────────────
            [
                'name' => 'Wanjiku Mwangi',
                'email' => 'wanjiku.mwangi@mingleke.test',
                'phone' => '+254712345001',
                'age' => 24,
                'gender' => 'female',
                'bio' => 'Nairobi girl with a soft spot for good conversation and nyama choma. Karibu.',
                'tier' => 'premium',
                'coins' => 420,
                'lat' => -1.2674,
                'lng' => 36.8034,
                'county' => 'Nairobi',
                'town' => 'Westlands',
                'is_verified' => true,
            ],
            [
                'name' => 'Achieng Otieno',
                'email' => 'achieng.otieno@mingleke.test',
                'phone' => '+254712345002',
                'age' => 26,
                'gender' => 'female',
                'bio' => 'Sassy but kind. Love live music at Kiza and long walks along Karura.',
                'tier' => 'regular',
                'coins' => 85,
                'lat' => -1.2921,
                'lng' => 36.8219,
                'county' => 'Nairobi',
                'town' => 'Kilimani',
                'is_verified' => false,
            ],
            [
                'name' => 'Brian Kiptoo',
                'email' => 'brian.kiptoo@mingleke.test',
                'phone' => '+254712345003',
                'age' => 29,
                'gender' => 'male',
                'bio' => 'Runs a small business in CBD. Fridays = Westlands. Let’s talk.',
                'tier' => 'regular',
                'coins' => 30,
                'lat' => -1.2841,
                'lng' => 36.8234,
                'county' => 'Nairobi',
                'town' => 'Mombasa CBD', // intentionally invalid — falls back to raw string
                'is_verified' => true,
            ],
            [
                'name' => 'Faith Njeri',
                'email' => 'faith.njeri@mingleke.test',
                'phone' => '+254712345004',
                'age' => 22,
                'gender' => 'female',
                'bio' => 'Mature for my age. Instagram baddie, church girl, and a hustler. Nairobi.',
                'tier' => 'premium',
                'coins' => 610,
                'lat' => -1.2543,
                'lng' => 36.7743,
                'county' => 'Kiambu',
                'town' => 'Kikuyu',
                'is_verified' => true,
            ],
            [
                'name' => 'Kevin Ochieng',
                'email' => 'kevin.ochieng@mingleke.test',
                'phone' => '+254712345005',
                'age' => 31,
                'gender' => 'male',
                'bio' => 'Software dev by day, DJ by night. If you love amapiano we’ll get along.',
                'tier' => 'regular',
                'coins' => 120,
                'lat' => -1.3001,
                'lng' => 36.7809,
                'county' => 'Nairobi',
                'town' => 'Lang’ata',
                'is_verified' => false,
            ],
            [
                'name' => 'Sharon Wambui',
                'email' => 'sharon.wambui@mingleke.test',
                'phone' => '+254712345006',
                'age' => 25,
                'gender' => 'female',
                'bio' => 'Beauty entrepreneur based in Roysambu. Looking for real connection, no games.',
                'tier' => 'regular',
                'coins' => 40,
                'lat' => -1.2209,
                'lng' => 36.8831,
                'county' => 'Nairobi',
                'town' => 'Roysambu',
                'is_verified' => false,
            ],
            [
                'name' => 'Dennis Mutua',
                'email' => 'dennis.mutua@mingleke.test',
                'phone' => '+254712345007',
                'age' => 28,
                'gender' => 'male',
                'bio' => 'Nairobi-born, Mombasa-raised. Love football, debate and beautiful people.',
                'tier' => 'regular',
                'coins' => 15,
                'lat' => -1.3107,
                'lng' => 36.8528,
                'county' => 'Nairobi',
                'town' => 'South B',
                'is_verified' => false,
            ],
            [
                'name' => 'Grace Auma',
                'email' => 'grace.auma@mingleke.test',
                'phone' => '+254712345008',
                'age' => 27,
                'gender' => 'female',
                'bio' => 'Teacher during the week, foodie on weekends. Show me your best nyama choma spot.',
                'tier' => 'premium',
                'coins' => 500,
                'lat' => -1.2635,
                'lng' => 36.8013,
                'county' => 'Nairobi',
                'town' => 'Parklands',
                'is_verified' => true,
            ],
            [
                'name' => 'Sammy Kimani',
                'email' => 'sammy.kimani@mingleke.test',
                'phone' => '+254712345009',
                'age' => 30,
                'gender' => 'male',
                'bio' => 'Real estate guy. Weekend drives to Naivasha. Looking for someone to share them with.',
                'tier' => 'regular',
                'coins' => 60,
                'lat' => -1.2218,
                'lng' => 36.7826,
                'county' => 'Nairobi',
                'town' => 'Kileleshwa',
                'is_verified' => false,
            ],
            [
                'name' => 'Mercy Wairimu',
                'email' => 'mercy.wairimu@mingleke.test',
                'phone' => '+254712345010',
                'age' => 23,
                'gender' => 'female',
                'bio' => 'Nurse. Coffee dates > clubbing. Hiking is my therapy. Nani ako na weekend plans?',
                'tier' => 'regular',
                'coins' => 35,
                'lat' => -1.2855,
                'lng' => 36.9232,
                'county' => 'Nairobi',
                'town' => 'Donholm',
                'is_verified' => true,
            ],

            // ─── Mombasa ─────────────────────────────────────────────
            [
                'name' => 'Zawadi Hamisi',
                'email' => 'zawadi.hamisi@mingleke.test',
                'phone' => '+254712345011',
                'age' => 24,
                'gender' => 'female',
                'bio' => 'Mwana wa Pwani. Bahari, biryani na wewe — perfect weekend. Karibu Mombasa.',
                'tier' => 'premium',
                'coins' => 780,
                'lat' => -4.0435,
                'lng' => 39.6682,
                'county' => 'Mombasa',
                'town' => 'Nyali',
                'is_verified' => true,
            ],
            [
                'name' => 'Ali Abdalla',
                'email' => 'ali.abdalla@mingleke.test',
                'phone' => '+254712345012',
                'age' => 29,
                'gender' => 'male',
                'bio' => 'Dhow captain by trade, storyteller by night. Love a woman who laughs at my jokes.',
                'tier' => 'regular',
                'coins' => 25,
                'lat' => -4.0435,
                'lng' => 39.6682,
                'county' => 'Mombasa',
                'town' => 'Old Town',
                'is_verified' => false,
            ],
            [
                'name' => 'Fatuma Salim',
                'email' => 'fatuma.salim@mingleke.test',
                'phone' => '+254712345013',
                'age' => 26,
                'gender' => 'female',
                'bio' => 'Mombasa beach girl. Sunsets at Fort Jesus, seafood at Tamarind. Let’s go.',
                'tier' => 'regular',
                'coins' => 90,
                'lat' => -4.0617,
                'lng' => 39.6723,
                'county' => 'Mombasa',
                'town' => 'Bamburi',
                'is_verified' => true,
            ],
            [
                'name' => 'Hassan Juma',
                'email' => 'hassan.juma@mingleke.test',
                'phone' => '+254712345014',
                'age' => 32,
                'gender' => 'male',
                'bio' => 'Businessman in Mombasa CBD. Looking for something serious. No time for games.',
                'tier' => 'premium',
                'coins' => 300,
                'lat' => -4.0493,
                'lng' => 39.6663,
                'county' => 'Mombasa',
                'town' => 'Mombasa CBD',
                'is_verified' => true,
            ],

            // ─── Kisumu ──────────────────────────────────────────────
            [
                'name' => 'Akinyi Odhiambo',
                'email' => 'akinyi.odhiambo@mingleke.test',
                'phone' => '+254712345015',
                'age' => 25,
                'gender' => 'female',
                'bio' => 'Kisumu girl with a big heart. Fish fry at Dunga on Sunday is my happy place.',
                'tier' => 'premium',
                'coins' => 420,
                'lat' => -0.0917,
                'lng' => 34.7680,
                'county' => 'Kisumu',
                'town' => 'Milimani',
                'is_verified' => true,
            ],
            [
                'name' => 'Odhiambo Ouma',
                'email' => 'odhiambo.ouma@mingleke.test',
                'phone' => '+254712345016',
                'age' => 28,
                'gender' => 'male',
                'bio' => 'Lawyer, Lakeside born. Okello is my drink and Cardi B is my playlist.',
                'tier' => 'regular',
                'coins' => 45,
                'lat' => -0.1022,
                'lng' => 34.7617,
                'county' => 'Kisumu',
                'town' => 'Nyalenda',
                'is_verified' => false,
            ],
            [
                'name' => 'Risper Atieno',
                'email' => 'risper.atieno@mingleke.test',
                'phone' => '+254712345017',
                'age' => 22,
                'gender' => 'female',
                'bio' => 'Maseno university grad. Thirsty for travel, adventure and good vibes.',
                'tier' => 'regular',
                'coins' => 20,
                'lat' => -0.1167,
                'lng' => 34.7500,
                'county' => 'Kisumu',
                'town' => 'Kondele',
                'is_verified' => false,
            ],

            // ─── Nakuru ──────────────────────────────────────────────
            [
                'name' => 'Chebet Kirui',
                'email' => 'chebet.kirui@mingleke.test',
                'phone' => '+254712345018',
                'age' => 24,
                'gender' => 'female',
                'bio' => 'Kalenjin princess in Nakuru. Love sunset drives and 90s R&B.',
                'tier' => 'premium',
                'coins' => 550,
                'lat' => -0.3031,
                'lng' => 36.0800,
                'county' => 'Nakuru',
                'town' => 'Milimani',
                'is_verified' => true,
            ],
            [
                'name' => 'John Mwangi',
                'email' => 'john.mwangi@mingleke.test',
                'phone' => '+254712345019',
                'age' => 30,
                'gender' => 'male',
                'bio' => 'Farm owner in Nakuru. Big dreams, calm energy. Looking for someone kind.',
                'tier' => 'regular',
                'coins' => 75,
                'lat' => -0.2833,
                'lng' => 36.0667,
                'county' => 'Nakuru',
                'town' => 'Bahati',
                'is_verified' => false,
            ],
            [
                'name' => 'Njeri Karanja',
                'email' => 'njeri.karanja@mingleke.test',
                'phone' => '+254712345020',
                'age' => 27,
                'gender' => 'female',
                'bio' => 'Fashion designer. Weekend weddings are my jam. Nakuru based but travel for love.',
                'tier' => 'regular',
                'coins' => 40,
                'lat' => -0.2900,
                'lng' => 36.0700,
                'county' => 'Nakuru',
                'town' => 'Naka',
                'is_verified' => true,
            ],

            // ─── Eldoret ─────────────────────────────────────────────
            [
                'name' => 'Jepkosgei Rono',
                'email' => 'jepkosgei.rono@mingleke.test',
                'phone' => '+254712345021',
                'age' => 23,
                'gender' => 'female',
                'bio' => 'Born and raised in Eldoret. Running is my therapy — join me on Sunday.',
                'tier' => 'regular',
                'coins' => 25,
                'lat' => 0.5143,
                'lng' => 35.2698,
                'county' => 'Uasin Gishu',
                'town' => 'Elgon View',
                'is_verified' => false,
            ],
            [
                'name' => 'Kiprono Sang',
                'email' => 'kiprono.sang@mingleke.test',
                'phone' => '+254712345022',
                'age' => 29,
                'gender' => 'male',
                'bio' => 'Athlete-turned-coach. Eldoret is home but Mombasa is my reset button.',
                'tier' => 'regular',
                'coins' => 60,
                'lat' => 0.5167,
                'lng' => 35.2833,
                'county' => 'Uasin Gishu',
                'town' => 'Langas',
                'is_verified' => true,
            ],

            // ─── Thika / Juja ────────────────────────────────────────
            [
                'name' => 'Mary Nyambura',
                'email' => 'mary.nyambura@mingleke.test',
                'phone' => '+254712345023',
                'age' => 25,
                'gender' => 'female',
                'bio' => 'Thika girl. Love a man who can fix things. I cook, you drive — deal?',
                'tier' => 'regular',
                'coins' => 30,
                'lat' => -1.0333,
                'lng' => 37.0693,
                'county' => 'Kiambu',
                'town' => 'Thika',
                'is_verified' => false,
            ],
            [
                'name' => 'Peter Kamau',
                'email' => 'peter.kamau@mingleke.test',
                'phone' => '+254712345024',
                'age' => 32,
                'gender' => 'male',
                'bio' => 'JKUAT grad, tech bro. Coding, gaming, coffee. Juja is underrated.',
                'tier' => 'regular',
                'coins' => 100,
                'lat' => -1.1018,
                'lng' => 37.0144,
                'county' => 'Kiambu',
                'town' => 'Juja',
                'is_verified' => true,
            ],

            // ─── Machakos / Kitui ────────────────────────────────────
            [
                'name' => 'Mwende Kilonzo',
                'email' => 'mwende.kilonzo@mingleke.test',
                'phone' => '+254712345025',
                'age' => 26,
                'gender' => 'female',
                'bio' => 'Machakos girl with big dreams. Love the slow life, dancing and good food.',
                'tier' => 'regular',
                'coins' => 15,
                'lat' => -1.5177,
                'lng' => 37.2634,
                'county' => 'Machakos',
                'town' => 'Machakos Town',
                'is_verified' => false,
            ],
            [
                'name' => 'Mutua Musyoka',
                'email' => 'mutua.musyoka@mingleke.test',
                'phone' => '+254712345026',
                'age' => 30,
                'gender' => 'male',
                'bio' => 'Kitui farmer. Coffee, simba, and a good laugh. Faith over fear.',
                'tier' => 'regular',
                'coins' => 50,
                'lat' => -1.3667,
                'lng' => 38.0167,
                'county' => 'Kitui',
                'town' => 'Kitui Town',
                'is_verified' => false,
            ],

            // ─── Nyeri / Meru ────────────────────────────────────────
            [
                'name' => 'Wairimu Wachira',
                'email' => 'wairimu.wachira@mingleke.test',
                'phone' => '+254712345027',
                'age' => 28,
                'gender' => 'female',
                'bio' => 'Nyeri babe. Tea, chilly mornings, and good men. No shortcuts.',
                'tier' => 'premium',
                'coins' => 320,
                'lat' => -0.4167,
                'lng' => 36.9500,
                'county' => 'Nyeri',
                'town' => 'Nyeri Town',
                'is_verified' => true,
            ],
            [
                'name' => 'Kariuki Njoroge',
                'email' => 'kariuki.njoroge@mingleke.test',
                'phone' => '+254712345028',
                'age' => 33,
                'gender' => 'male',
                'bio' => 'Business owner in Meru. Kila kitu na ukweli. Looking for serious only.',
                'tier' => 'regular',
                'coins' => 65,
                'lat' => 0.0463,
                'lng' => 37.6559,
                'county' => 'Meru',
                'town' => 'Meru Town',
                'is_verified' => false,
            ],

            // ─── Nairobi extras ──────────────────────────────────────
            [
                'name' => 'Beatrice Onyango',
                'email' => 'beatrice.onyango@mingleke.test',
                'phone' => '+254712345029',
                'age' => 24,
                'gender' => 'female',
                'bio' => 'Kasarani girl. Long hair, short temper, big heart. Nyama choma dates only.',
                'tier' => 'regular',
                'coins' => 35,
                'lat' => -1.2300,
                'lng' => 36.8900,
                'county' => 'Nairobi',
                'town' => 'Kasarani',
                'is_verified' => true,
            ],
            [
                'name' => 'Victor Omondi',
                'email' => 'victor.omondi@mingleke.test',
                'phone' => '+254712345030',
                'age' => 27,
                'gender' => 'male',
                'bio' => 'M-PESA agent in Embakasi. Love a lady with ambition. Weekend football is a must.',
                'tier' => 'regular',
                'coins' => 20,
                'lat' => -1.3167,
                'lng' => 36.8833,
                'county' => 'Nairobi',
                'town' => 'Embakasi',
                'is_verified' => false,
            ],
            [
                'name' => 'Nyambura Waweru',
                'email' => 'nyambura.waweru@mingleke.test',
                'phone' => '+254712345031',
                'age' => 26,
                'gender' => 'female',
                'bio' => 'Nairobi creative. Rooftop sunsets and long conversations. VIP lifestyle.',
                'tier' => 'premium',
                'coins' => 480,
                'lat' => -1.2640,
                'lng' => 36.8020,
                'county' => 'Nairobi',
                'town' => 'Westlands',
                'is_verified' => true,
            ],
            [
                'name' => 'Amani Mwinyi',
                'email' => 'amani.mwinyi@mingleke.test',
                'phone' => '+254712345032',
                'age' => 27,
                'gender' => 'female',
                'bio' => 'Coast girl, businesswoman by day. Looking for elevated company.',
                'tier' => 'premium',
                'coins' => 620,
                'lat' => -4.0430,
                'lng' => 39.6700,
                'county' => 'Mombasa',
                'town' => 'Nyali',
                'is_verified' => true,
            ],
            [
                'name' => 'Tabitha Chepkoech',
                'email' => 'tabitha.chepkoech@mingleke.test',
                'phone' => '+254712345033',
                'age' => 25,
                'gender' => 'female',
                'bio' => 'Rift Valley royalty in the city. Elegant, discreet, premium.',
                'tier' => 'premium',
                'coins' => 400,
                'lat' => -0.3000,
                'lng' => 36.0800,
                'county' => 'Nakuru',
                'town' => 'Milimani',
                'is_verified' => true,
            ],
            [
                'name' => 'Lilian Adhiambo',
                'email' => 'lilian.adhiambo@mingleke.test',
                'phone' => '+254712345034',
                'age' => 24,
                'gender' => 'female',
                'bio' => 'Kisumu-raised, Nairobi-based. High standards, warm heart.',
                'tier' => 'premium',
                'coins' => 550,
                'lat' => -1.2830,
                'lng' => 36.8200,
                'county' => 'Nairobi',
                'town' => 'Kilimani',
                'is_verified' => true,
            ],
        ];
    }
}