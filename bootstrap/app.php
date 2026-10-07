<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        channels: __DIR__ . '/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Only enable this if you actually use Sanctum token auth.
        // If your API is same-origin session-only, remove it.
        $middleware->statefulApi();

        // Presence heartbeat/offline uses sendBeacon on tab close, which
        // can't reliably include the CSRF token. Exempt the whole group.
        $middleware->preventRequestForgery(except: [
            'presence/*',
        ]);

        // Web middleware — everything a browser request needs.
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\CaptureUserLocation::class,
        ]);

        // Named middleware for route-specific use.
        $middleware->alias([
            'optional.sanctum' => \App\Http\Middleware\OptionalSanctum::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn(Request $request) =>
                $request->is('api/*') || $request->expectsJson(),
        );
    })
    ->create();