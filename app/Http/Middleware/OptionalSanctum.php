<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\PersonalAccessToken;

class OptionalSanctum
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken();

        if ($token && $accessToken = PersonalAccessToken::findToken($token)) {
            Auth::setUser($accessToken->tokenable);
        }

        return $next($request);
    }
}