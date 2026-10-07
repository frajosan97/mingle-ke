<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/**
 * Reap stale presence every minute.
 *
 * This is the safety net for users who never fired /presence/offline:
 * crashes, network drops, mobile tab kills, device sleep. The reaper
 * broadcasts UserOnlineStatus(false) to their peers so the UI updates
 * without needing a page reload.
 */
Schedule::command('presence:reap')->everyMinute()->withoutOverlapping();