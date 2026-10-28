<?php

namespace App\Services;

use App\Events\UserOnlineStatusChanged;
use App\Models\User;
use Carbon\CarbonInterface;

class PresenceService
{
    public const STALE_AFTER_SECONDS = 60;

    public function mark(User $user, bool $isOnline): void
    {
        $now = now();

        $this->expireStale($now);

        $wasOnline = (bool) $user->is_online;

        $user->update([
            'is_online' => $isOnline,
            'last_seen_at' => $isOnline ? $now : ($user->last_seen_at ?? $now),
        ]);

        if ($wasOnline !== $isOnline) {
            UserOnlineStatusChanged::dispatch(
                (int) $user->id,
                $user->name,
                $isOnline,
                $isOnline ? null : $user->last_seen_at?->toIso8601String(),
            );
        }
    }

    private function expireStale(CarbonInterface $now): void
    {
        $cutoff = $now->copy()->subSeconds(self::STALE_AFTER_SECONDS);

        $stale = User::query()
            ->where('is_online', true)
            ->where(function ($q) use ($cutoff) {
                $q->whereNull('last_seen_at')
                    ->orWhere('last_seen_at', '<', $cutoff);
            })
            ->get(['id', 'name', 'last_seen_at']);

        if ($stale->isEmpty()) {
            return;
        }

        User::whereIn('id', $stale->pluck('id'))->update(['is_online' => false]);

        foreach ($stale as $user) {
            UserOnlineStatusChanged::dispatch(
                (int) $user->id,
                $user->name,
                false,
                $user->last_seen_at?->toIso8601String(),
            );
        }
    }
}