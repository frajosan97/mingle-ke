// resources/js/Hooks/usePresence.js
import { useCallback, useEffect, useRef } from "react";
import axios from "axios";

/**
 * Heartbeat intervals.
 *
 * Visible tab: 30s — active user, cheap ping.
 * Hidden tab: 120s — battery conservation on mobile / background tabs.
 *
 * Server TTL is 60s. If the visible heartbeat misses two in a row,
 * the reaper will mark them offline. If the hidden heartbeat keeps
 * firing, they stay "online" for up to ~2 minutes after backgrounding.
 */
const HEARTBEAT_VISIBLE_MS = 30_000;
const HEARTBEAT_HIDDEN_MS = 120_000;

export function usePresence(userId) {
    const intervalRef = useRef(null);
    const userIdRef = useRef(userId);

    useEffect(() => {
        userIdRef.current = userId;
    }, [userId]);

    /**
     * POST /presence/heartbeat. Silent failure — a dropped heartbeat
     * is fine; the next one will restore the TTL.
     */
    const sendHeartbeat = useCallback(() => {
        axios.post(route("presence.heartbeat")).catch(() => {});
    }, []);

    /**
     * POST /presence/offline. Uses sendBeacon for unload-safe delivery,
     * falls back to axios when the page is still alive (e.g. logout).
     */
    const sendOffline = useCallback((useBeacon = true) => {
        const url = route("presence.offline");
        const token = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content");

        if (useBeacon && navigator.sendBeacon && token) {
            const body = new URLSearchParams({ _token: token }).toString();
            const blob = new Blob([body], {
                type: "application/x-www-form-urlencoded",
            });
            navigator.sendBeacon(url, blob);
            return;
        }

        axios.post(url).catch(() => {});
    }, []);

    useEffect(() => {
        if (!userId) return;

        // Announce presence on mount.
        sendHeartbeat();

        // Start with the visible interval.
        intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_VISIBLE_MS);

        // ── Visibility: slow down when hidden, catch up when visible ──
        const handleVisibility = () => {
            clearInterval(intervalRef.current);

            if (document.visibilityState === "visible") {
                // Immediate catch-up so the peer sees us online right away.
                sendHeartbeat();
                intervalRef.current = setInterval(
                    sendHeartbeat,
                    HEARTBEAT_VISIBLE_MS,
                );
            } else {
                // Slower pings in the background.
                intervalRef.current = setInterval(
                    sendHeartbeat,
                    HEARTBEAT_HIDDEN_MS,
                );
            }
        };

        // ── Unload: best-effort offline ──
        // pagehide is the mobile-reliable event; beforeunload is a
        // belt-and-braces fallback for desktop browsers.
        const handleUnload = () => sendOffline(true);

        document.addEventListener("visibilitychange", handleVisibility);
        window.addEventListener("pagehide", handleUnload);
        window.addEventListener("beforeunload", handleUnload);

        return () => {
            clearInterval(intervalRef.current);
            document.removeEventListener("visibilitychange", handleVisibility);
            window.removeEventListener("pagehide", handleUnload);
            window.removeEventListener("beforeunload", handleUnload);

            // SPA navigation away from the authenticated layout:
            // intentionally do NOT fire offline here. The reaper handles
            // it — firing on unmount would cause flicker during Inertia
            // navigation between auth pages, and on dev HMR reloads.
        };
    }, [userId, sendHeartbeat, sendOffline]);

    return { sendHeartbeat, sendOffline };
}
