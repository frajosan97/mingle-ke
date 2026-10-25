<?php

namespace App\Http\Controllers;

use App\Events\UserOnlineStatusChanged;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeviceStatusController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        abort_unless($user && !$user->trashed(), 401);

        $validated = $request->validate([
            'is_online' => ['required', 'boolean'],
        ]);

        $now = now();
        $isOnline = (bool) $validated['is_online'];

        // Expire users whose heartbeats have stopped.
        User::query()
            ->where('is_online', true)
            ->where(function ($query) use ($now) {
                $query->whereNull('last_seen_at')
                    ->orWhere('last_seen_at', '<', $now->copy()->subSeconds(60));
            })
            ->each(function (User $staleUser) {
                $lastSeen = $staleUser->last_seen_at?->toIso8601String();

                $staleUser->update(['is_online' => false]);

                UserOnlineStatusChanged::dispatch(
                    (int) $staleUser->id,
                    $staleUser->name,
                    false,
                    $lastSeen,
                );
            });

        $wasOnline = (bool) $user->is_online;

        $user->update([
            'is_online' => $isOnline,
            'last_seen_at' => $isOnline
                ? $now
                : ($user->last_seen_at ?? $now),
        ]);

        // Broadcast only when this user's status changes.
        if ($wasOnline !== $isOnline) {
            UserOnlineStatusChanged::dispatch(
                (int) $user->id,
                $user->name,
                $isOnline,
                $isOnline ? null : $user->last_seen_at?->toIso8601String(),
            );
        }

        return response()->json([
            'success' => true,
            'is_online' => $isOnline,
        ]);
    }
}