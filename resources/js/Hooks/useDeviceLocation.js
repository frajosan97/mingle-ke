// resources/js/Hooks/useDeviceLocation.js
import { useEffect, useState } from "react";

export default function useDeviceLocation({ enabled = true } = {}) {
    const [coords, setCoords] = useState(null);
    const [status, setStatus] = useState("idle"); // idle | loading | granted | denied | error

    useEffect(() => {
        if (!enabled || !("geolocation" in navigator)) {
            setStatus("error");
            return;
        }

        setStatus("loading");

        const id = navigator.geolocation.watchPosition(
            (pos) => {
                setCoords({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                });
                setStatus("granted");
            },
            (err) => {
                setStatus(
                    err.code === err.PERMISSION_DENIED ? "denied" : "error",
                );
            },
            { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
        );

        return () => navigator.geolocation.clearWatch(id);
    }, [enabled]);

    return { coords, status };
}
