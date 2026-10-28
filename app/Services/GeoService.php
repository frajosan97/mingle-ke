<?php

namespace App\Services;

class GeoService
{
    private const EARTH_RADIUS_KM = 6371;
    private const KM_PER_DEGREE = 111.045;

    public function haversineKm(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return self::EARTH_RADIUS_KM * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    /** @return array{lat: float, lng: float} */
    public function boundingBoxDeltas(float $lat, float $radiusKm): array
    {
        $box = min($radiusKm * 2, 2000);
        $latDelta = $box / self::KM_PER_DEGREE;
        $lngDelta = $box / (self::KM_PER_DEGREE * max(cos(deg2rad($lat)), 0.01));

        return ['lat' => $latDelta, 'lng' => $lngDelta];
    }
}