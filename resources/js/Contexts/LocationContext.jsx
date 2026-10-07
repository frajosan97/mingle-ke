// resources/js/Contexts/LocationContext.jsx
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import axios from "axios";

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */
const LocationContext = createContext(null);

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const STORAGE_KEY = "user_location";
const STORAGE_TTL = 60 * 60 * 1000; // 1 hour — long enough to avoid re-prompts,
// short enough to catch real movement.

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function readCachedLocation() {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (Date.now() - parsed.savedAt > STORAGE_TTL) {
            sessionStorage.removeItem(STORAGE_KEY);
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

function writeCachedLocation(loc) {
    try {
        sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ ...loc, savedAt: Date.now() }),
        );
    } catch {
        /* storage full or disabled — ignore */
    }
}

function clearCachedLocation() {
    try {
        sessionStorage.removeItem(STORAGE_KEY);
    } catch {
        /* ignore */
    }
}

/**
 * Ask the browser for coords. Resolves to { lat, lng, source: "device" }
 * or rejects with an error whose `.code` is one of:
 *   "denied" | "unavailable" | "timeout" | "unsupported" | "error"
 */
function requestDeviceCoords({ timeout = 10_000 } = {}) {
    return new Promise((resolve, reject) => {
        if (!("geolocation" in navigator)) {
            return reject(
                Object.assign(new Error("unsupported"), {
                    code: "unsupported",
                }),
            );
        }

        navigator.geolocation.getCurrentPosition(
            (pos) =>
                resolve({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    source: "device",
                }),
            (err) => {
                const code =
                    err.code === err.PERMISSION_DENIED
                        ? "denied"
                        : err.code === err.POSITION_UNAVAILABLE
                          ? "unavailable"
                          : err.code === err.TIMEOUT
                            ? "timeout"
                            : "error";
                reject(Object.assign(new Error(code), { code }));
            },
            { enableHighAccuracy: false, maximumAge: 60_000, timeout },
        );
    });
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */
export function LocationProvider({
    children,
    /**
     * Optional: pass auth user's stored coords to skip the browser prompt.
     * e.g. from Inertia: usePage().props.auth?.user
     */
    profileCoords = null,
    /** If false, never prompt the browser — use only profile/cache. */
    allowDevicePrompt = true,
}) {
    const [coords, setCoords] = useState(null);
    // status: "idle" | "loading" | "granted" | "denied" | "unavailable" | "error"
    const [status, setStatus] = useState("idle");
    const [source, setSource] = useState(null); // "profile" | "device" | "cache"
    const [area, setArea] = useState(null);
    const [error, setError] = useState(null);

    // Interceptor instance id so we can eject cleanly
    const interceptorRef = useRef(null);

    /* -------------------------------------------------------------- */
    /*  Resolve location by priority                                   */
    /* -------------------------------------------------------------- */
    const resolveLocation = useCallback(async () => {
        // 1. Profile coords (logged-in user, most reliable)
        if (profileCoords?.lat != null && profileCoords?.lng != null) {
            const loc = {
                lat: profileCoords.lat,
                lng: profileCoords.lng,
                source: "profile",
            };
            setCoords(loc);
            setSource("profile");
            setStatus("granted");
            writeCachedLocation(loc);
            return loc;
        }

        // 2. Cached location from this session
        const cached = readCachedLocation();
        if (cached) {
            setCoords(cached);
            setSource("cache");
            setStatus("granted");
            return cached;
        }

        // 3. Ask the browser
        if (!allowDevicePrompt) {
            setStatus("idle");
            return null;
        }

        setStatus("loading");
        try {
            const loc = await requestDeviceCoords();
            setCoords(loc);
            setSource("device");
            setStatus("granted");
            writeCachedLocation(loc);
            return loc;
        } catch (err) {
            setStatus(err.code);
            setError(err.message);
            return null;
        }
    }, [profileCoords?.lat, profileCoords?.lng, allowDevicePrompt]);

    /* -------------------------------------------------------------- */
    /*  Initial resolve                                                */
    /* -------------------------------------------------------------- */
    useEffect(() => {
        resolveLocation();
    }, [resolveLocation]);

    /* -------------------------------------------------------------- */
    /*  Install axios interceptor — attaches X-User-Location header    */
    /* -------------------------------------------------------------- */
    useEffect(() => {
        // Remove any previous interceptor (hot reload safety)
        if (interceptorRef.current !== null) {
            axios.interceptors.request.eject(interceptorRef.current);
        }

        interceptorRef.current = axios.interceptors.request.use((config) => {
            const current = readCachedLocation(); // read from storage, not state,
            // so closures stay fresh
            if (current?.lat != null && current?.lng != null) {
                config.headers = config.headers ?? {};
                config.headers["X-User-Location"] =
                    `${current.lat},${current.lng},${current.source ?? "cache"}`;
            }
            return config;
        });

        return () => {
            if (interceptorRef.current !== null) {
                axios.interceptors.request.eject(interceptorRef.current);
                interceptorRef.current = null;
            }
        };
    }, []);

    /* -------------------------------------------------------------- */
    /*  Fetch area name whenever coords change                         */
    /* -------------------------------------------------------------- */
    useEffect(() => {
        if (!coords?.lat || !coords?.lng) {
            setArea(null);
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                const { data } = await axios.get(route("api.geocode.area"), {
                    params: { lat: coords.lat, lng: coords.lng },
                });
                if (!cancelled) setArea(data?.area ?? null);
            } catch {
                if (!cancelled) setArea(null);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [coords?.lat, coords?.lng]);

    /* -------------------------------------------------------------- */
    /*  Public API                                                     */
    /* -------------------------------------------------------------- */
    const refresh = useCallback(async () => {
        clearCachedLocation();
        return resolveLocation();
    }, [resolveLocation]);

    const setManualLocation = useCallback((loc) => {
        const normalized = {
            lat: Number(loc.lat),
            lng: Number(loc.lng),
            source: loc.source ?? "manual",
        };
        setCoords(normalized);
        setSource(normalized.source);
        setStatus("granted");
        writeCachedLocation(normalized);
    }, []);

    const clear = useCallback(() => {
        clearCachedLocation();
        setCoords(null);
        setSource(null);
        setArea(null);
        setStatus("idle");
        setError(null);
    }, []);

    const value = useMemo(
        () => ({
            coords, // { lat, lng, source } | null
            area, // "Westlands" | null
            status, // "idle" | "loading" | "granted" | "denied" | ...
            source, // "profile" | "device" | "cache" | "manual" | null
            error, // string | null
            isResolved:
                status === "granted" ||
                ["denied", "unavailable", "error"].includes(status),
            refresh,
            setManualLocation,
            clear,
        }),
        [
            coords,
            area,
            status,
            source,
            error,
            refresh,
            setManualLocation,
            clear,
        ],
    );

    return (
        <LocationContext.Provider value={value}>
            {children}
        </LocationContext.Provider>
    );
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */
export function useLocation() {
    const ctx = useContext(LocationContext);
    if (!ctx) {
        throw new Error("useLocation must be used within <LocationProvider>");
    }
    return ctx;
}
