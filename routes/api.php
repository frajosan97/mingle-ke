<?php

use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Webhooks\MpesaCallbackController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public reference data — no auth needed
Route::prefix('locations')->group(function () {
    Route::get('/', [LocationController::class, 'tree']);
    Route::get('/counties', [LocationController::class, 'counties']);
    Route::get('/counties/{county}/towns', [LocationController::class, 'towns']);
});

// Webhooks
Route::prefix('webhooks/payments')->name('webhooks.payments.')->group(function () {
    Route::post('/callback', [MpesaCallbackController::class, 'stk'])->name('callback');
    Route::post('/result', [MpesaCallbackController::class, 'b2cResult'])->name('result');
    Route::post('/timeout', [MpesaCallbackController::class, 'b2cTimeout'])->name('timeout');
    Route::post('/validation', [MpesaCallbackController::class, 'c2bValidation'])->name('validation');
    Route::post('/confirmation', [MpesaCallbackController::class, 'c2bConfirmation'])->name('confirmation');
});

// Everything else
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/coins/balance', function (Request $request) {
        return $request->user()->coins;
    });
});
