// resources/js/hooks/use-locations.ts
import { useEffect, useState } from "react";
import type { CountyWithTowns } from "@/types/location";

let cache: CountyWithTowns[] | null = null;
let inflight: Promise<CountyWithTowns[]> | null = null;

const LOG = "[useLocations]";

function isCounty(v: unknown): v is CountyWithTowns {
    return (
        !!v &&
        typeof v === "object" &&
        typeof (v as any).id === "number" &&
        typeof (v as any).name === "string" &&
        Array.isArray((v as any).towns)
    );
}

function unwrap(body: unknown): CountyWithTowns[] {
    const raw =
        Array.isArray(body) ? body
            : body && typeof body === "object" && Array.isArray((body as any).data)
                ? (body as any).data
                : null;

    if (!raw) {
        console.warn(LOG, "unwrap: unexpected payload shape", body);
        return [];
    }

    const valid = raw.filter(isCounty);
    if (valid.length !== raw.length) {
        console.warn(LOG, `unwrap: dropped ${raw.length - valid.length} malformed counties`);
    }
    return valid;
}

async function fetchLocations(): Promise<CountyWithTowns[]> {
    if (cache && cache.length > 0) return cache;
    if (inflight) return inflight;

    inflight = (async () => {
        try {
            const res = await fetch("/api/locations", {
                headers: { Accept: "application/json" },
                credentials: "same-origin",
            });
            if (!res.ok) {
                const text = await res.text();
                console.error(LOG, "non-OK body:", text.slice(0, 500));
                throw new Error(`Location API ${res.status}`);
            }
            const payload = unwrap(await res.json());
            if (payload.length > 0) cache = payload;
            else console.warn(LOG, "empty payload — not caching");
            return payload;
        } finally {
            inflight = null;
        }
    })();

    return inflight;
}

export function clearLocationCache() {
    console.info(LOG, "clearLocationCache()");
    cache = null;
    inflight = null;
}

export function useLocations() {
    const [counties, setCounties] = useState<CountyWithTowns[]>(() => cache ?? []);
    const [loading, setLoading] = useState(!cache || cache.length === 0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (cache && cache.length > 0) {
            setCounties(cache);
            setLoading(false);
            return;
        }

        let cancelled = false;
        fetchLocations()
            .then((data) => {
                if (cancelled) return;
                setCounties(data);
                setLoading(false);
                setError(data.length === 0 ? "No counties returned" : null);
            })
            .catch((err) => {
                if (cancelled) return;
                setCounties([]);
                setError(err instanceof Error ? err.message : String(err));
                setLoading(false);
            });

        return () => { cancelled = true; };
    }, []);

    return { counties, loading, error };
}