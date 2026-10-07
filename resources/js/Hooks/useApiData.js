// resources/js/hooks/useApiData.js
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import axios from "axios";

/**
 * @param {Object}  options
 * @param {number?} options.currentUserId  Current authenticated user's ID.
 *                                         Pass to defensively hide the user's
 *                                         own listing on the client as well.
 */
export default function useApiData({ currentUserId } = {}) {
    /* ------------------------------------------------------------------
     | State
     * ------------------------------------------------------------------ */
    const [escorts, setEscorts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Keeps track of the latest request so stale responses can be ignored.
    const abortRef = useRef(null);

    /* ------------------------------------------------------------------
     | Generic Fetch Helper
     * ------------------------------------------------------------------ */
    const fetchData = useCallback(async (endpoint, params = {}) => {
        // Cancel the previous in-flight request before starting a new one.
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const { data } = await axios.get(route(endpoint), {
                params,
                signal: controller.signal,
            });

            // Laravel may wrap the payload in `{ data: [...] }` or return it directly.
            const payload = data?.data ?? data;

            if (payload === undefined || payload === null) {
                throw new Error(`Invalid response from ${endpoint}`);
            }

            return payload;
        } catch (err) {
            // Ignore aborted requests — they're intentional, not failures.
            if (axios.isCancel(err) || err.name === "CanceledError") {
                return null;
            }

            const message =
                err?.response?.data?.message ||
                err.message ||
                `Failed to fetch ${endpoint}`;

            setError(message);
            throw err;
        }
    }, []);

    /* ------------------------------------------------------------------
     | API Calls
     * ------------------------------------------------------------------ */
    const fetchEscorts = useCallback(async () => {
        const payload = await fetchData("api.escorts");

        // Request was aborted — skip state updates.
        if (payload === null) return null;

        // Defensive client-side filter. Backend already excludes the current
        // user; this is a safety net if auth state ever desyncs.
        const filtered = currentUserId
            ? payload.filter((escort) => escort.id !== currentUserId)
            : payload;

        setEscorts(filtered);
        return filtered;
    }, [fetchData, currentUserId]);

    /* ------------------------------------------------------------------
     | Fetch All
     * ------------------------------------------------------------------ */
    const fetchAll = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            await fetchEscorts();
        } catch {
            // `fetchData` already set `error`; nothing else to do here.
        } finally {
            setIsLoading(false);
        }
    }, [fetchEscorts]);

    /* ------------------------------------------------------------------
     | Lifecycle
     * ------------------------------------------------------------------ */
    useEffect(() => {
        fetchAll();

        // Abort the request if the component unmounts mid-flight.
        return () => {
            abortRef.current?.abort();
        };
    }, [fetchAll]);

    /* ------------------------------------------------------------------
     | Data Helpers
     * ------------------------------------------------------------------ */
    const getEscortById = useCallback(
        (id) => escorts.find((escort) => escort.id === id),
        [escorts],
    );

    /* ------------------------------------------------------------------
     | Derived State
     * ------------------------------------------------------------------ */
    const hasEscorts = useMemo(() => escorts.length > 0, [escorts]);

    const stats = useMemo(
        () => ({
            escortsCount: escorts.length,
        }),
        [escorts],
    );

    /* ------------------------------------------------------------------
     | Utilities
     * ------------------------------------------------------------------ */
    const resetData = useCallback(() => {
        abortRef.current?.abort();
        setEscorts([]);
        setError(null);
        setIsLoading(true);
    }, []);

    /* ------------------------------------------------------------------
     | Public API (memoized so consumers don't re-render needlessly)
     * ------------------------------------------------------------------ */
    return useMemo(
        () => ({
            // Data
            escorts,

            // State
            isLoading,
            error,

            // Fetchers
            fetchAll,
            refreshEscorts: fetchEscorts,
            resetData,

            // Helpers
            getEscortById,

            // Flags
            hasEscorts,

            // Stats
            stats,
        }),
        [
            escorts,
            isLoading,
            error,
            fetchAll,
            fetchEscorts,
            resetData,
            getEscortById,
            hasEscorts,
            stats,
        ],
    );
}
