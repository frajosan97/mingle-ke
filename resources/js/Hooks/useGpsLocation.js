import { useEffect, useRef } from "react";
import axios from "axios";

/**
 * Requests the browser GPS location once per session and posts it
 * to the Laravel backend. Silently no-ops on permission denial.
 */
export function useGpsLocation({ enabled = true } = {}) {
    const sent = useRef(false);

    useEffect(() => {
        if (!enabled || sent.current) return;
        if (!("geolocation" in navigator)) return;

        // Ask only once per page load
        sent.current = true;

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude, accuracy } = position.coords;

                try {
                    await axios.post(route("user.location.update"), {
                        latitude,
                        longitude,
                        accuracy,
                    });
                } catch (err) {
                    console.warn("Failed to sync GPS location", err);
                }
            },
            (error) => {
                // PERMISSION_DENIED (1), POSITION_UNAVAILABLE (2), TIMEOUT (3)
                console.info(
                    "GPS unavailable, keeping IP-based location:",
                    error.message,
                );
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 5 * 60 * 1000, // accept cached fix up to 5 min old
            },
        );
    }, [enabled]);
}
