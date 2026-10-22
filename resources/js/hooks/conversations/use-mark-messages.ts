// resources/js/hooks/conversations/use-mark-messages.ts
import { useEffect } from "react";
import axios from "axios";

export function useMarkMessagesRead(conversationId: string) {
    useEffect(() => {
        let active = true;
        let requestInProgress = false;

        const markMessages = async () => {
            if (
                !active ||
                requestInProgress ||
                document.visibilityState !== "visible"
            ) {
                return;
            }

            requestInProgress = true;
            try {
                await axios.post(`/conversations/${conversationId}/delivered`);
                if (active && document.visibilityState === "visible") {
                    await axios.post(`/conversations/${conversationId}/read`);
                }
            } catch {
                // Retry on a later visibility change.
            } finally {
                requestInProgress = false;
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") void markMessages();
        };

        void markMessages();
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            active = false;
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [conversationId]);
}