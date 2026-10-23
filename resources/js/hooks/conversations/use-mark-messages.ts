// resources/js/hooks/conversations/use-mark-messages.ts

import { useEffect, useRef } from "react";
import axios from "axios";

export function useMarkMessagesRead(conversationId: string) {
    const firedRef = useRef(false);

    useEffect(() => {
        let active = true;
        let requestInProgress = false;

        const mark = async () => {
            if (!active || requestInProgress) return;
            if (document.visibilityState !== "visible") return;

            requestInProgress = true;
            try {
                await axios.post(`/conversations/${conversationId}/delivered`);
                if (active && document.visibilityState === "visible") {
                    await axios.post(`/conversations/${conversationId}/read`);
                }
            } catch {
                // Retry on next visibility change.
            } finally {
                requestInProgress = false;
            }
        };

        const onVisibility = () => {
            if (document.visibilityState === "visible") void mark();
        };

        // Only fire once on mount
        if (!firedRef.current) {
            firedRef.current = true;
            void mark();
        }

        // And on visibility change (user comes back to tab)
        document.addEventListener("visibilitychange", onVisibility);

        return () => {
            active = false;
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, [conversationId]);
}