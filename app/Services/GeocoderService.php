<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeocoderService
{
    public function areaName(?float $lat, ?float $lng): ?string
    {
        if ($lat === null || $lng === null) {
            return null;
        }

        $key = sprintf('geo:%0.2f:%0.2f', $lat, $lng);

        // Return cached value if present. We never cache null.
        if ($cached = Cache::get($key)) {
            return $cached;
        }

        $name = $this->fetchFromNominatim($lat, $lng);

        if ($name !== null) {
            Cache::put($key, $name, now()->addDays(30));
        }

        return $name;
    }

    private function fetchFromNominatim(float $lat, float $lng): ?string
    {
        try {
            $res = Http::withHeaders([
                'User-Agent' => 'MingleKE/1.0 (frajosan97@gmail.com)',
                'Accept' => 'application/json',
            ])->timeout(5)->get('https://nominatim.openstreetmap.org/reverse', [
                        'lat' => $lat,
                        'lon' => $lng,
                        'format' => 'json',
                        'zoom' => 14,
                    ]);

            if (!$res->ok()) {
                return null;
            }

            $addr = $res->json('address') ?? [];

            $raw = $addr['suburb']
                ?? $addr['neighbourhood']
                ?? $addr['city_district']
                ?? $addr['city']
                ?? $addr['town']
                ?? $addr['village']
                ?? $addr['county']
                ?? null;

            // Strip "ward", "ward X", slashes, etc.
            if ($raw) {
                $raw = preg_replace('/\s*(ward|subcounty|sub-county)\s*$/i', '', $raw);
                $raw = preg_replace('/\s*\/.*$/', '', $raw); // take first part of "a/b"
                $raw = trim($raw);
            }

            return $raw ?: null;
        } catch (\Throwable $e) {
            Log::warning('Geocode failed', [
                'lat' => $lat,
                'lng' => $lng,
                'err' => $e->getMessage(),
                'class' => get_class($e),
            ]);
            return null;
        }
    }
}