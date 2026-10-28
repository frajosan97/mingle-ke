<?php

use App\Http\Controllers\CoinController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\DeviceStatusController;
use App\Http\Controllers\EscortController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\Settings\ProfileController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
|
| Routes accessible without authentication.
|
*/
Route::get('/', HomeController::class)->name('home');

/*
|--------------------------------------------------------------------------
| Discover
|--------------------------------------------------------------------------
|
| Browse profiles and interact with other users.
|
*/
Route::get('/discover', [EscortController::class, 'index'])
    ->name('discover.index');

/*
|--------------------------------------------------------------------------
| Escorts
|--------------------------------------------------------------------------
|
| Display an escort's profile.
|
*/
Route::get('/escorts/{user}', [EscortController::class, 'show'])
    ->name('escorts.show');

/*
|--------------------------------------------------------------------------
| Location
|--------------------------------------------------------------------------
|
| Update the authenticated user's location.
|
*/
Route::post('/location/update', [EscortController::class, 'updateLocation'])
    ->name('location.update');

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
|
| Routes available only to authenticated and verified users.
|
*/
Route::middleware(['auth', 'verified'])->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Dashboard
    |--------------------------------------------------------------------------
    |
    | Display the authenticated user's dashboard.
    |
    */
    Route::inertia('/dashboard', 'dashboard')->name('dashboard');

    /*
    |--------------------------------------------------------------------------
    | Conversations
    |--------------------------------------------------------------------------
    |
    | Display the conversation list and individual conversations.
    |
    */
    Route::get('/conversations', [ConversationController::class, 'index'])
        ->name('conversations.index');

    Route::get('/conversations/{conversation}', [ConversationController::class, 'show'])
        ->name('conversations.show');

    /*
    |--------------------------------------------------------------------------
    | Messages
    |--------------------------------------------------------------------------
    |
    | Send, delete, read, and mark messages as delivered.
    |
    */
    Route::post('/conversations/{conversation}/messages', [MessageController::class, 'store'])
        ->name('messages.store');

    Route::get('/messages/new', [ConversationController::class, 'create'])
        ->name('messages.create');
    Route::delete('/messages/{message}', [MessageController::class, 'destroy'])
        ->name('messages.destroy');

    Route::post('/conversations/{conversation}/read', [MessageController::class, 'markRead'])
        ->name('conversations.read');

    Route::post('/conversations/{conversation}/delivered', [MessageController::class, 'markDelivered'])
        ->name('conversations.delivered');

    /*
    |--------------------------------------------------------------------------
    | Discover
    |--------------------------------------------------------------------------
    |
    | Browse profiles and interact with other users.
    |
    */
    Route::post('/escorts/{user}/like', [EscortController::class, 'like'])
        ->name('escorts.like');

    /*
    |--------------------------------------------------------------------------
    | Coins
    |--------------------------------------------------------------------------
    |
    | Buy and sell coins.
    |
    */
    Route::get('/coins', [CoinController::class, 'index'])
        ->name('coins');
    Route::post('/coins/purchase', [CoinController::class, 'purchase'])
        ->name('coins.purchase');
    Route::get('/coins/status/{checkoutRequestId}', [CoinController::class, 'status'])
        ->name('coins.status');
    Route::get('/coins/history', [CoinController::class, 'history'])
        ->name('coins.history');
    Route::post('/coins/retry/{tx}', [CoinController::class, 'retry'])
        ->name('coins.retry');

    /*
    |--------------------------------------------------------------------------
    | Device Status
    |--------------------------------------------------------------------------
    |
    | Update the authenticated user's device status.
    |
    */
    Route::get('/device-status', [DeviceStatusController::class, 'index'])
        ->name('device-status.index');
    Route::post('/device-status', [DeviceStatusController::class, 'update'])
        ->middleware(['throttle:60,1'])
        ->name('device-status.update');

    /*
    |--------------------------------------------------------------------------
    | Escort Onboarding
    |--------------------------------------------------------------------------
    |
    | Escort onboarding.
    |
    */
    Route::get('escort/onboarding', [ProfileController::class, 'escortOnboarding'])
        ->name('escort.onboarding');
    Route::post('escort/onboarding', [ProfileController::class, 'storeEscortOnboarding'])
        ->name('escort.onboarding.store');
});

/*
|--------------------------------------------------------------------------
| Push Subscriptions
|--------------------------------------------------------------------------
|
| Save the authenticated user's push subscription.
|
*/
Route::post('/push-subscriptions', function (Request $request) {
    $validated = $request->validate([
        'endpoint' => ['required', 'url', 'max:2048'],
        'keys.p256dh' => ['required', 'string'],
        'keys.auth' => ['required', 'string'],
    ]);

    $request->user()->updatePushSubscription(
        $validated['endpoint'],
        $validated['keys']['p256dh'],
        $validated['keys']['auth'],
    );

    return response()->json([
        'message' => 'Push subscription saved.',
    ]);
})->name('push-subscriptions.store');

/*
|--------------------------------------------------------------------------
| Settings Routes
|--------------------------------------------------------------------------
|
| Load the application's settings routes.
|
*/
require __DIR__ . '/settings.php';