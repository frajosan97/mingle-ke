<?php

use Illuminate\Http\Request;

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