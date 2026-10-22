<?php

use App\Http\Controllers\ConversationController;
use App\Http\Controllers\DiscoverController;
use App\Http\Controllers\MessageController;
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
Route::inertia('/', 'welcome')->name('home');

/*
|--------------------------------------------------------------------------
| Discover
|--------------------------------------------------------------------------
|
| Browse profiles and interact with other users.
|
*/
Route::get('/discover', [DiscoverController::class, 'index'])
    ->name('discover.index');

/*
|--------------------------------------------------------------------------
| Location
|--------------------------------------------------------------------------
|
| Update the authenticated user's location.
|
*/
Route::post('/location/update', [DiscoverController::class, 'updateLocation'])
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
    Route::post('/discover/{user}/like', [DiscoverController::class, 'like'])
        ->name('discover.like');
});

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