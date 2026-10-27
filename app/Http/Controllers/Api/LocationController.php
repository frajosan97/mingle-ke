<?php
// app/Http/Controllers/Api/LocationController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\County;
use App\Models\Town;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class LocationController extends Controller
{
    public function counties(): JsonResponse
    {
        return response()->json([
            'data' => County::query()
                ->orderBy('name')
                ->get(['id', 'name', 'slug']),
        ]);
    }

    public function towns(County $county): JsonResponse
    {
        return response()->json([
            'data' => $county->towns()
                ->orderByDesc('is_major')
                ->orderBy('name')
                ->get(['id', 'name', 'slug', 'is_major']),
        ]);
    }

    public function tree(): JsonResponse
    {
        $data = cache()->remember('locations.tree', 3600, function () {
            return County::query()
                ->orderBy('name')
                ->with([
                    'towns' => fn($q) => $q
                        ->orderByDesc('is_major')
                        ->orderBy('name')
                        ->select(['id', 'county_id', 'name', 'slug', 'is_major']),
                ])
                ->get(['id', 'name', 'slug'])
                ->map(fn(County $c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'slug' => $c->slug,
                    'towns' => $c->towns->map(fn(Town $t) => [
                        'id' => $t->id,
                        'name' => $t->name,
                        'slug' => $t->slug,
                        'is_major' => $t->is_major,
                    ])->values()->all(),   // ← force array, not keyed
                ])
                ->values()                     // ← force array, not keyed
                ->all();                       // ← returns PHP array, not Collection
        });

        // Cast to array defensively — cache stores can return objects.
        $data = is_array($data) ? array_values($data) : [];

        return response()->json(['data' => $data]);
    }
}