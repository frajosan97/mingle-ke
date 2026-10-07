<?php

namespace App\Http\Controllers;

use App\Events\UserOnlineStatus;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class PresenceController extends Controller
{
    /**
     * How long a heartbeat keeps the user marked online.
     *
     * Rule of thumb: TTL >= 2 × heartbeat interval. Frontend pings every
     * 30s (visible) / 120s (hidden), so a 60s TTL tolerates one missed beat.
     */
    private const ONLINE_TTL = 60;

    /**
     * POST /api/presence/heartbeat
     */
    public function heartbeat(Request $request)
    {
        $user = $request->user();
        $key = "user.online.{$user->id}";

        $wasOnline = Cache::has($key);

        Cache::put($key, true, self::ONLINE_TTL);

        // Throttle DB writes — touching last_active_at on every ping is
        // wasteful. Refresh at most once every 30s.
        $stale = !$user->last_active_at
            || $user->last_active_at->lt(now()->subSeconds(30));

        if ($stale) {
            $user->forceFill(['last_active_at' => now()])->save();
        }

        // Broadcast only on the offline → online transition.
        if (!$wasOnline) {
            broadcast(new UserOnlineStatus(
                $user,
                true,
                now()->toISOString(),
            ))->toOthers();
        }

        return response()->json([
            'online' => true,
            'last_active_at' => now()->toISOString(),
        ]);
    }

    /**
     * POST /api/presence/offline
     *
     * Called from three places:
     *   1. pagehide/beforeunload via sendBeacon (tab close)
     *   2. Logout button before router.post('/logout')
     *   3. (optionally) usePresence cleanup on SPA nav
     *
     * Idempotent — the `$wasOnline` guard prevents duplicate broadcasts
     * when multiple tabs close at once.
     */
    public function offline(Request $request)
    {
        $user = $request->user();
        $key = "user.online.{$user->id}";

        $wasOnline = Cache::has($key);

        Cache::forget($key);
        $user->forceFill(['last_active_at' => now()])->save();

        if ($wasOnline) {
            broadcast(new UserOnlineStatus(
                $user,
                false,
                now()->toISOString(),
            ))->toOthers();
        }

        return response()->json(['offline' => true]);
    }

    /**
     * GET /api/presence/{user}
     */
    public function show(Request $request, User $user)
    {
        $me = $request->user();

        $sharesConversation = Conversation::query()
            ->forUser($me)
            ->forUser($user)
            ->exists();

        if (!$sharesConversation && $me->id !== $user->id) {
            abort(403, "Not allowed to view this user's presence.");
        }

        return response()->json([
            'user_id' => $user->id,
            'is_online' => Cache::has("user.online.{$user->id}"),
            'last_active_at' => $user->last_active_at?->toISOString(),
        ]);
    }
}