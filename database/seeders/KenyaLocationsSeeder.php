<?php

namespace Database\Seeders;

use App\Models\County;
use App\Models\Town;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class KenyaLocationsSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->counties() as $code => $data) {
            $county = County::updateOrCreate(
                ['code' => str_pad((string) $code, 3, '0', STR_PAD_LEFT)],
                [
                    'name' => $data['name'],
                    'slug' => Str::slug($data['name']),
                    'lat' => $data['lat'] ?? null,
                    'lng' => $data['lng'] ?? null,
                ],
            );

            foreach ($data['towns'] as $townName) {
                $isMajor = in_array($townName, $data['major'] ?? [], true);

                Town::updateOrCreate(
                    [
                        'county_id' => $county->id,
                        'slug' => Str::slug($townName),
                    ],
                    [
                        'name' => $townName,
                        'is_major' => $isMajor,
                    ],
                );
            }
        }
    }

    /**
     * @return array<int, array{
     *     name: string,
     *     lat?: float,
     *     lng?: float,
     *     towns: string[],
     *     major?: string[],
     * }>
     */
    private function counties(): array
    {
        return [
            // ─── Nairobi (capital) ───────────────────────────────
            1 => [
                'name' => 'Nairobi',
                'lat' => -1.2864,
                'lng' => 36.8172,
                'towns' => [
                    'Westlands',
                    'Kilimani',
                    'Karen',
                    'Parklands',
                    'Lavington',
                    'Riverside',
                    'Kileleshwa',
                    'South B',
                    'South C',
                    'Lang’ata',
                    'Kikuyu',
                    'Roysambu',
                    'Kasarani',
                    'Embakasi',
                    'Donholm',
                    'Kibera',
                    'Dagoretti',
                    'Ruaka',
                    'Runda',
                    'Muthaiga',
                    'Hurlingham',
                    'Ngong',
                    'Juja',
                    'Thika',
                    'Ruiru',
                ],
                'major' => [
                    'Westlands',
                    'Kilimani',
                    'Karen',
                    'Parklands',
                    'Lavington',
                    'Riverside',
                    'Kileleshwa',
                    'South B',
                    'Lang’ata',
                    'Kasarani',
                    'Embakasi',
                    'Kikuyu',
                    'Roysambu',
                    'Donholm',
                    'Thika',
                    'Juja',
                    'Ruiru',
                ],
            ],

            // ─── Coast region ────────────────────────────────────
            2 => [
                'name' => 'Mombasa',
                'lat' => -4.0435,
                'lng' => 39.6682,
                'towns' => ['Nyali', 'Bamburi', 'Old Town', 'Mombasa CBD', 'Likoni', 'Tudor', 'Shanzu', 'Diani', 'Shimo La Tewa'],
                'major' => ['Nyali', 'Bamburi', 'Old Town', 'Mombasa CBD', 'Diani', 'Shanzu'],
            ],
            3 => [
                'name' => 'Kilifi',
                'lat' => -3.5107,
                'lng' => 39.9093,
                'towns' => ['Malindi', 'Watamu', 'Kilifi', 'Vipingo', 'Mtwapa'],
                'major' => ['Malindi', 'Watamu', 'Kilifi', 'Mtwapa'],
            ],
            4 => [
                'name' => 'Kwale',
                'lat' => -4.1742,
                'lng' => 39.4609,
                'towns' => ['Ukunda', 'Diani', 'Lungalunga', 'Msambweni'],
                'major' => ['Ukunda', 'Diani'],
            ],
            5 => [
                'name' => 'Tana River',
                'lat' => -1.5833,
                'lng' => 39.4833,
                'towns' => ['Hola', 'Bura', 'Garsen'],
            ],
            6 => [
                'name' => 'Lamu',
                'lat' => -2.2717,
                'lng' => 40.9020,
                'towns' => ['Lamu Town', 'Mokowe', 'Shela', 'Hindi'],
                'major' => ['Lamu Town', 'Shela'],
            ],
            7 => [
                'name' => 'Taita Taveta',
                'lat' => -3.3167,
                'lng' => 38.4833,
                'towns' => ['Voi', 'Wundanyi', 'Taveta', 'Mwatate'],
                'major' => ['Voi'],
            ],

            // ─── North Eastern ───────────────────────────────────
            8 => [
                'name' => 'Garissa',
                'lat' => -0.4536,
                'lng' => 39.6461,
                'towns' => ['Garissa', 'Dadaab', 'Masalani', 'Bura'],
                'major' => ['Garissa'],
            ],
            9 => [
                'name' => 'Wajir',
                'lat' => 1.7471,
                'lng' => 40.0573,
                'towns' => ['Wajir', 'Habaswein', 'El Wak'],
                'major' => ['Wajir'],
            ],
            10 => [
                'name' => 'Mandera',
                'lat' => 3.9366,
                'lng' => 41.8670,
                'towns' => ['Mandera', 'El Wak', 'Rhamu'],
            ],

            // ─── Eastern ─────────────────────────────────────────
            11 => [
                'name' => 'Marsabit',
                'lat' => 2.3340,
                'lng' => 37.9900,
                'towns' => ['Marsabit', 'Moyale', 'Laisamis'],
            ],
            12 => [
                'name' => 'Isiolo',
                'lat' => 0.3546,
                'lng' => 37.5822,
                'towns' => ['Isiolo', 'Merti', 'Garbatulla'],
            ],
            13 => [
                'name' => 'Meru',
                'lat' => 0.0463,
                'lng' => 37.6559,
                'towns' => ['Meru Town', 'Maua', 'Nkubu', 'Timau'],
                'major' => ['Meru Town', 'Maua'],
            ],
            14 => [
                'name' => 'Tharaka Nithi',
                'lat' => -0.1667,
                'lng' => 37.9167,
                'towns' => ['Chuka', 'Kathwana', 'Marimanti'],
            ],
            15 => [
                'name' => 'Embu',
                'lat' => -0.5310,
                'lng' => 37.4500,
                'towns' => ['Embu', 'Runyenjes', 'Siakago'],
                'major' => ['Embu'],
            ],
            16 => [
                'name' => 'Kitui',
                'lat' => -1.3667,
                'lng' => 38.0167,
                'towns' => ['Kitui Town', 'Mwingi', 'Mutomo'],
                'major' => ['Kitui Town'],
            ],
            17 => [
                'name' => 'Machakos',
                'lat' => -1.5177,
                'lng' => 37.2634,
                'towns' => ['Machakos Town', 'Athi River', 'Mlolongo', 'Kangundo', 'Wote'],
                'major' => ['Machakos Town', 'Athi River', 'Mlolongo', 'Wote'],
            ],
            18 => [
                'name' => 'Makueni',
                'lat' => -1.8033,
                'lng' => 37.6240,
                'towns' => ['Wote', 'Makindu', 'Kibwezi', 'Tawa'],
                'major' => ['Wote', 'Kibwezi'],
            ],

            // ─── Central ─────────────────────────────────────────
            19 => [
                'name' => 'Nyandarua',
                'lat' => -0.3833,
                'lng' => 36.3667,
                'towns' => ['Ol Kalou', 'Nyahururu', 'Engineer'],
            ],
            20 => [
                'name' => 'Nyeri',
                'lat' => -0.4167,
                'lng' => 36.9500,
                'towns' => ['Nyeri Town', 'Karatina', 'Nanyuki', 'Othaya'],
                'major' => ['Nyeri Town', 'Karatina', 'Nanyuki'],
            ],
            21 => [
                'name' => 'Kirinyaga',
                'lat' => -0.5000,
                'lng' => 37.2833,
                'towns' => ['Kerugoya', 'Kutus', 'Sagana'],
            ],
            22 => [
                'name' => 'Murang’a',
                'lat' => -0.7167,
                'lng' => 37.1500,
                'towns' => ['Murang’a', 'Kenol', 'Kangema'],
                'major' => ['Murang’a', 'Kenol'],
            ],
            23 => [
                'name' => 'Kiambu',
                'lat' => -1.1714,
                'lng' => 36.8356,
                'towns' => ['Kiambu', 'Thika', 'Juja', 'Ruiru', 'Limuru', 'Kikuyu', 'Githunguri'],
                'major' => ['Kiambu', 'Thika', 'Juja', 'Ruiru', 'Limuru'],
            ],

            // ─── Rift Valley ─────────────────────────────────────
            24 => [
                'name' => 'Turkana',
                'lat' => 3.1167,
                'lng' => 35.6000,
                'towns' => ['Lodwar', 'Lokichogio', 'Kakuma'],
            ],
            25 => [
                'name' => 'West Pokot',
                'lat' => 1.5000,
                'lng' => 35.1167,
                'towns' => ['Kapenguria', 'Lodwar', 'Ortum'],
            ],
            26 => [
                'name' => 'Samburu',
                'lat' => 1.2167,
                'lng' => 36.8000,
                'towns' => ['Maralal', 'Baragoi'],
            ],
            27 => [
                'name' => 'Trans Nzoia',
                'lat' => 1.0167,
                'lng' => 34.9833,
                'towns' => ['Kitale', 'Kiminini', 'Endebess'],
                'major' => ['Kitale'],
            ],
            28 => [
                'name' => 'Uasin Gishu',
                'lat' => 0.5143,
                'lng' => 35.2698,
                'towns' => ['Eldoret', 'Elgon View', 'Langas', 'Kapsoya', 'Kapsabet Road'],
                'major' => ['Eldoret', 'Elgon View', 'Langas'],
            ],
            29 => [
                'name' => 'Elgeyo Marakwet',
                'lat' => 0.5167,
                'lng' => 35.5167,
                'towns' => ['Iten', 'Kapsowar', 'Chepkorio'],
                'major' => ['Iten'],
            ],
            30 => [
                'name' => 'Nandi',
                'lat' => 0.1833,
                'lng' => 35.1000,
                'towns' => ['Kapsabet', 'Nandi Hills', 'Kabiyet'],
            ],
            31 => [
                'name' => 'Baringo',
                'lat' => 0.4667,
                'lng' => 35.9667,
                'towns' => ['Kabarnet', 'Eldama Ravine', 'Marigat'],
            ],
            32 => [
                'name' => 'Laikipia',
                'lat' => 0.0500,
                'lng' => 36.3667,
                'towns' => ['Nanyuki', 'Nyahururu', 'Rumuruti'],
                'major' => ['Nanyuki'],
            ],
            33 => [
                'name' => 'Nakuru',
                'lat' => -0.3031,
                'lng' => 36.0800,
                'towns' => ['Nakuru', 'Milimani', 'Naka', 'Bahati', 'Naivasha', 'Gilgil', 'Njoro', 'Molo'],
                'major' => ['Nakuru', 'Milimani', 'Naka', 'Naivasha', 'Gilgil'],
            ],
            34 => [
                'name' => 'Narok',
                'lat' => -1.0833,
                'lng' => 35.8667,
                'towns' => ['Narok', 'Kilgoris', 'Suswa'],
                'major' => ['Narok'],
            ],
            35 => [
                'name' => 'Kajiado',
                'lat' => -1.8500,
                'lng' => 36.7833,
                'towns' => ['Kajiado', 'Kitengela', 'Ngong', 'Ongata Rongai', 'Namanga'],
                'major' => ['Kajiado', 'Kitengela', 'Ngong', 'Ongata Rongai'],
            ],
            36 => [
                'name' => 'Kericho',
                'lat' => -0.3667,
                'lng' => 35.2833,
                'towns' => ['Kericho', 'Litein', 'Kipkelion'],
                'major' => ['Kericho'],
            ],
            37 => [
                'name' => 'Bomet',
                'lat' => -0.7833,
                'lng' => 35.3500,
                'towns' => ['Bomet', 'Sotik', 'Longisa'],
            ],

            // ─── Western ─────────────────────────────────────────
            38 => [
                'name' => 'Kakamega',
                'lat' => 0.2827,
                'lng' => 34.7519,
                'towns' => ['Kakamega', 'Mumias', 'Butere', 'Luanda'],
                'major' => ['Kakamega', 'Mumias'],
            ],
            39 => [
                'name' => 'Vihiga',
                'lat' => 0.0500,
                'lng' => 34.7167,
                'towns' => ['Mbale', 'Luanda', 'Vihiga'],
            ],
            40 => [
                'name' => 'Bungoma',
                'lat' => 0.5635,
                'lng' => 34.5605,
                'towns' => ['Bungoma', 'Webuye', 'Kimilili'],
                'major' => ['Bungoma', 'Webuye'],
            ],
            41 => [
                'name' => 'Busia',
                'lat' => 0.4608,
                'lng' => 34.1115,
                'towns' => ['Busia', 'Malaba', 'Port Victoria'],
                'major' => ['Busia'],
            ],

            // ─── Nyanza ──────────────────────────────────────────
            42 => [
                'name' => 'Siaya',
                'lat' => 0.0667,
                'lng' => 34.2833,
                'towns' => ['Siaya', 'Bondo', 'Ugunja', 'Yala'],
            ],
            43 => [
                'name' => 'Kisumu',
                'lat' => -0.0917,
                'lng' => 34.7680,
                'towns' => ['Kisumu', 'Milimani', 'Nyalenda', 'Kondele', 'Dunga', 'Ahero', 'Maseno'],
                'major' => ['Kisumu', 'Milimani', 'Nyalenda', 'Kondele', 'Maseno'],
            ],
            44 => [
                'name' => 'Homa Bay',
                'lat' => -0.5273,
                'lng' => 34.4571,
                'towns' => ['Homa Bay', 'Oyugis', 'Rangwe'],
                'major' => ['Homa Bay'],
            ],
            45 => [
                'name' => 'Migori',
                'lat' => -1.0634,
                'lng' => 34.4731,
                'towns' => ['Migori', 'Rongo', 'Awendo', 'Kehancha'],
                'major' => ['Migori'],
            ],
            46 => [
                'name' => 'Kisii',
                'lat' => -0.6817,
                'lng' => 34.7680,
                'towns' => ['Kisii', 'Keroka', 'Suneka'],
                'major' => ['Kisii'],
            ],
            47 => [
                'name' => 'Nyamira',
                'lat' => -0.5667,
                'lng' => 34.9333,
                'towns' => ['Nyamira', 'Keroka', 'Ekerenyo'],
                'major' => ['Nyamira'],
            ],
        ];
    }
}