<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PushSubscriptionController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'endpoint' => 'required|string',
            'keys.auth' => 'required|string',
            'keys.p256dh' => 'required|string',
        ]);

        $request->user()->updatePushSubscription(
            $request->endpoint,
            $request->keys['p256dh'],
            $request->keys['auth'],
            $request->header('User-Agent'),
        );

        return response()->noContent();
    }

    public function destroy(Request $request)
    {
        $request->validate(['endpoint' => 'required|string']);
        $request->user()->deletePushSubscription($request->endpoint);

        return response()->noContent();
    }
}