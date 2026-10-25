<?php

use App\Http\Controllers\ConversationController;
use App\Http\Controllers\DeviceStatusController;
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

    Route::post('/device-status', [DeviceStatusController::class, 'update'])
        ->middleware(['throttle:60,1'])
        ->name('device-status.update');
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

Route::get('/api/stickers', function () {
    return response()->json(
        cache()->remember('stickers.list', now()->addMinutes(10), function () {
            $base = public_path('stickers');
            $list = function (string $sub) use ($base): array {
                $dir = $base . DIRECTORY_SEPARATOR . $sub;
                if (!File::isDirectory($dir))
                    return [];
                return collect(File::files($dir))
                    ->filter(fn($f) => in_array(
                        strtolower($f->getExtension()),
                        ['gif', 'webp', 'png', 'jpg', 'jpeg', 'svg']
                    ))
                    ->map(fn($f) => [
                        'name' => $f->getFilename(),
                        'url' => asset("stickers/{$sub}/" . $f->getFilename()),
                        'size' => $f->getSize(),
                        'mtime' => $f->getMTime(),
                    ])
                    ->sortByDesc('mtime')
                    ->values()
                    ->all();
            };
            return ['gifs' => $list('gifs'), 'stickers' => $list('stickers')];
        })
    );
})->name('stickers.index');

/*
|--------------------------------------------------------------------------
| Settings Routes
|--------------------------------------------------------------------------
|
| Load the application's settings routes.
|
*/
require __DIR__ . '/settings.php';