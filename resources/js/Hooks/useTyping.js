import { useCallback, useEffect, useRef, useState } from "react";
import { API } from "@/Lib/Api";
import axios from "axios";

export function useTyping(
    conversationId,
    userId,
    { timeout = 2500, throttle = 800 } = {},
) {
    const [typingUsers, setTypingUsers] = useState({});
    const timersRef = useRef({});
    const lastSentRef = useRef(0);

    useEffect(() => {
        if (!conversationId || !window.Echo) return;

        const channel = window.Echo.private(`conversation.${conversationId}`);

        channel.listen(".conversation.typing", (e) => {
            if (e.user_id === userId) return;

            setTypingUsers((prev) => ({
                ...prev,
                [e.user_id]: {
                    name: e.user_name,
                    isTyping: e.is_typing,
                },
            }));

            clearTimeout(timersRef.current[e.user_id]);
            if (e.is_typing) {
                timersRef.current[e.user_id] = setTimeout(() => {
                    setTypingUsers((prev) => {
                        const next = { ...prev };
                        delete next[e.user_id];
                        return next;
                    });
                }, timeout);
            }
        });

        return () => {
            window.Echo.leave(`conversation.${conversationId}`);
            Object.values(timersRef.current).forEach(clearTimeout);
        };
    }, [conversationId, userId, timeout]);

    const notifyTyping = useCallback(() => {
        if (!conversationId) return;

        const now = Date.now();
        if (now - lastSentRef.current < throttle) return;
        lastSentRef.current = now;

        axios
            .post(
                API.conversations.typing?.(conversationId) ??
                    `/api/conversations/${conversationId}/typing`,
                {
                    is_typing: true,
                },
            )
            .catch(() => {});
    }, [conversationId, throttle]);

    const stopTyping = useCallback(() => {
        if (!conversationId) return;

        lastSentRef.current = 0;

        axios
            .post(
                API.conversations.typing?.(conversationId) ??
                    `/api/conversations/${conversationId}/typing`,
                {
                    is_typing: false,
                },
            )
            .catch(() => {});
    }, [conversationId]);

    const typingNames = Object.values(typingUsers)
        .filter((u) => u.isTyping)
        .map((u) => u.name);

    return {
        typingNames,
        isAnyoneTyping: typingNames.length > 0,
        notifyTyping,
        stopTyping,
    };
}
