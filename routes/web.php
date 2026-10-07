<?php

use App\Http\Controllers\Api\ApiController;
use App\Http\Controllers\Api\ConversationController as ApiConversationController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EscortController;
use App\Http\Controllers\PresenceController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PushSubscriptionController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Public routes
|--------------------------------------------------------------------------
*/

Route::get('/', fn() => Inertia::render('Home'))->name('home');
Route::get('/escort', [EscortController::class, 'index'])->name('escort.index');

/*
|--------------------------------------------------------------------------
| Public JSON API (same-origin, session-optional)
|--------------------------------------------------------------------------
*/

Route::prefix('api')->group(function () {
    Route::get('/escorts', [ApiController::class, 'escorts'])->name('api.escorts');
    Route::get('/geocode/area', [ApiController::class, 'areaFromCoords'])->name('api.geocode.area');
});

/*
|--------------------------------------------------------------------------
| Authenticated routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    /* Profile */
    Route::prefix('profile')->name('profile.')->group(function () {
        Route::get('/', [ProfileController::class, 'edit'])->name('edit');
        Route::patch('/', [ProfileController::class, 'update'])->name('update');
        Route::delete('/', [ProfileController::class, 'destroy'])->name('destroy');
    });

    /* Web (Inertia) conversations */
    Route::resource('conversations', ConversationController::class)
        ->except(['create', 'edit']);

    /* Me */
    Route::prefix('me')->name('me.')->group(function () {
        Route::get('/', fn(Request $r) => response()->json(['user' => $r->user()]))
            ->name('show');
        Route::patch('/', [UserController::class, 'updateMe'])->name('update');
        Route::post('/heartbeat', [UserController::class, 'heartbeat'])->name('heartbeat');
    });

    /* Users (discovery) */
    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::get('/users/{user}', [UserController::class, 'show'])->name('users.show');
    Route::post('/user/location', [UserController::class, 'updateLocation'])
        ->name('user.location.update');

    /* Presence */
    Route::prefix('presence')->name('presence.')->group(function () {
        Route::post('/heartbeat', [PresenceController::class, 'heartbeat'])->name('heartbeat');
        Route::post('/offline', [PresenceController::class, 'offline'])->name('offline');
        Route::get('/{user}', [PresenceController::class, 'show'])->name('show');
    });

    Route::post('/push/subscribe', [PushSubscriptionController::class, 'store'])
        ->name('push.subscribe');
    Route::delete('/push/unsubscribe', [PushSubscriptionController::class, 'destroy'])
        ->name('push.unsubscribe');

    /* Same-origin JSON API — session-authenticated (web middleware). */
    Route::prefix('api')->group(function () {
        // Conversations
        Route::get('/conversations', [ApiConversationController::class, 'index'])->name('api.conversations.index');
        Route::post('/conversations', [ApiConversationController::class, 'store'])->name('api.conversations.store');
        Route::get('/conversations/{conversation}', [ApiConversationController::class, 'show'])->name('api.conversations.show');
        Route::patch('/conversations/{conversation}', [ApiConversationController::class, 'update'])->name('api.conversations.update');
        Route::delete('/conversations/{conversation}', [ApiConversationController::class, 'destroy'])->name('api.conversations.destroy');
        Route::post('/conversations/{conversation}/read', [ApiConversationController::class, 'read'])->name('api.conversations.read');
        Route::post('/conversations/{conversation}/delivered', [ApiConversationController::class, 'delivered'])->name('api.conversations.delivered');
        Route::post('/conversations/{conversation}/typing', [ApiConversationController::class, 'typing'])->name('api.conversations.typing');

        // Messages
        Route::get('/conversations/{conversation}/messages', [MessageController::class, 'index'])->name('api.messages.index');
        Route::post('/conversations/{conversation}/messages', [MessageController::class, 'store'])->name('api.messages.store');
        Route::get('/messages/{message}', [MessageController::class, 'show'])->name('api.messages.show');
        Route::patch('/messages/{message}', [MessageController::class, 'update'])->name('api.messages.update');
        Route::delete('/messages/{message}', [MessageController::class, 'destroy'])->name('api.messages.destroy');
        Route::post('/messages/{message}/read', [MessageController::class, 'read'])->name('api.messages.read');
        Route::post('/messages/{message}/delivered', [MessageController::class, 'delivered'])->name('api.messages.delivered');
    });
});

require __DIR__ . '/auth.php';