<?php

// api.php routes
use App\Http\Controllers\Api\ApiController;

Route::get('/escorts', [ApiController::class, 'escorts'])
    ->middleware('optional.sanctum')
    ->name('api.escorts');

Route::get('/geocode/area', [ApiController::class, 'areaFromCoords'])
    ->middleware('optional.sanctum')
    ->name('api.geocode.area');