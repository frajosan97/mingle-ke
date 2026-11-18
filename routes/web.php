<?php

use App\Http\Controllers\ConversationController;
use App\Http\Controllers\DeviceStatusController;
use App\Http\Controllers\EscortController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\WalletController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::get('/', HomeController::class)->name('home');

// Escorts
Route::prefix('escorts')
    ->name('escorts.')
    ->controller(EscortController::class)
    ->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('/{user}', 'show')->name('show');
        Route::post('/location/update', 'updateLocation')
            ->name('location.update');
    });

/*
|--------------------------------------------------------------------------
| Authenticated & Verified Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard
    Route::inertia('/dashboard', 'dashboard')
        ->name('dashboard');

    /*
    |--------------------------------------------------------------------------
    | Conversations
    |--------------------------------------------------------------------------
    */

    Route::prefix('conversations')
        ->name('conversations.')
        ->group(function () {

            Route::controller(ConversationController::class)->group(function () {
                Route::get('/', 'index')->name('index');
                Route::get('/create', 'create')->name('create');
                Route::get('/{conversation}', 'show')->name('show');
            });

            Route::controller(MessageController::class)->group(function () {
                Route::post('/{conversation}/messages', 'store')
                    ->name('messages.store');

                Route::post('/{conversation}/read', 'markRead')
                    ->name('read');

                Route::post('/{conversation}/delivered', 'markDelivered')
                    ->name('delivered');

                Route::delete('/messages/{message}', 'destroy')
                    ->name('messages.destroy');
            });
        });

    /*
    |--------------------------------------------------------------------------
    | Escort Actions & Onboarding
    |--------------------------------------------------------------------------
    */

    Route::prefix('escorts')
        ->name('escorts.')
        ->group(function () {

            Route::post('/{user}/like', [EscortController::class, 'like'])
                ->name('like');

            Route::get('/{user}/onboarding', [ProfileController::class, 'escortOnboarding'])
                ->name('onboarding');

            Route::post('/{user}/onboarding', [ProfileController::class, 'storeEscortOnboarding'])
                ->name('onboarding.store');
        });

    /*
    |--------------------------------------------------------------------------
    | Coins
    |--------------------------------------------------------------------------
    */

    /*
|--------------------------------------------------------------------------
| Wallet
|--------------------------------------------------------------------------
*/

    Route::prefix('wallets')
        ->name('wallets.')
        ->controller(WalletController::class)
        ->group(function () {
            Route::get('/', 'index')->name('index');

            Route::get('/balance', 'balance')->name('balance');

            Route::prefix('coins')->name('coins.')->group(function () {
                Route::get('/', 'coins')->name('index');
                Route::post('/purchase', 'purchaseCoins')->name('purchase');
            });

            Route::get('/points', [WalletController::class, 'points'])
                ->name('points');

            Route::get('/transactions', 'transactions')->name('transactions');
            Route::get('/transactions/{transaction}/status', 'status')
                ->name('transactions.status');
            Route::post('/transactions/{transaction}/retry', 'retry')
                ->name('transactions.retry');
            Route::post('/transactions/{transaction}/cancel', 'cancel')
                ->name('transactions.cancel');

            Route::get('/withdrawals', 'withdrawals')->name('withdrawals');
            Route::post('/withdrawals/request', 'requestWithdrawal')
                ->name('withdrawals.request');
        });

    /*
    |--------------------------------------------------------------------------
    | Device Status
    |--------------------------------------------------------------------------
    */

    Route::prefix('device-status')
        ->name('device-status.')
        ->controller(DeviceStatusController::class)
        ->group(function () {
            Route::get('/', 'index')->name('index');

            Route::post('/', 'update')
                ->middleware('throttle:60,1')
                ->name('update');
        });
});

/*
|--------------------------------------------------------------------------
| Additional Route Files
|--------------------------------------------------------------------------
*/

require __DIR__ . '/pusher.php';
require __DIR__ . '/settings.php';
