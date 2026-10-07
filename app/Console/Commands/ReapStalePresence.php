<?php

namespace App\Console\Commands;

use App\Events\UserOnlineStatus;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class ReapStalePresence extends Command
{
    protected $signature = 'presence:reap';
    protected $description = 'Broadcast offline for users whose heartbeat expired.';

    /**
     * How stale last_active_at must be before we consider the user gone.
     * Must be > (heartbeat interval + network jitter). 90s covers
     * a 30s heartbeat with two missed beats.
     */
    private const STALE_AFTER_SECONDS = 90;

    /**
     * Ignore users who haven't been active in a long time — they're
     * already offline in the DB and there's nothing to reap.
     */
    private const LOOKBACK_SECONDS = 1800; // 30 minutes

    public function handle(): int
    {
        $now = now();
        $cutoff = $now->copy()->subSeconds(self::STALE_AFTER_SECONDS);
        $floor = $now->copy()->subSeconds(self::LOOKBACK_SECONDS);

        $candidates = User::query()
            ->whereNotNull('last_active_at')
            ->where('last_active_at', '<', $cutoff)
            ->where('last_active_at', '>', $floor)
            ->get();

        $reaped = 0;

        foreach ($candidates as $user) {
            $key = "user.online.{$user->id}";

            if (!Cache::has($key)) {
                continue; // already offline — nothing to do
            }

            Cache::forget($key);

            broadcast(new UserOnlineStatus(
                $user,
                false,
                optional($user->last_active_at)->toISOString(),
            ));

            $reaped++;
        }

        $this->info("Reaped {$reaped} stale presence(s).");

        return self::SUCCESS;
    }
}