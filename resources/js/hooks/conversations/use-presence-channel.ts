// resources/js/hooks/conversations/use-presence-channel.ts
import { useEffect, useRef, useState } from "react";
import { useEchoPresence } from "@laravel/echo-react";

export interface PresenceUser {
    id: number | string;
    name: string;
}

export function usePresenceChannel(conversationId: string) {
    const [typingUser, setTypingUser] = useState<string | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { channel } = useEchoPresence(`conversation.${conversationId}`);

    // Poll until the channel exists, then assume it's subscribed.
    // Echo's types don't expose a reliable `subscribed()` / `bind()` on the
    // presence channel union, so we use a loose cast and a short delay.
    useEffect(() => {
        setIsSubscribed(false);

        let cancelled = false;
        let attempts = 0;

        const trySubscribe = () => {
            if (cancelled) return;

            const ch = channel();
            if (!ch) {
                if (attempts++ < 40) {
                    setTimeout(trySubscribe, 250);
                }
                return;
            }

            // Cast to a permissive shape so TS doesn't complain about
            // `subscribed` not existing on every union member.
            const loose = ch as unknown as {
                subscribed?: () => boolean;
            };

            if (typeof loose.subscribed === "function" && loose.subscribed()) {
                setIsSubscribed(true);
                return;
            }

            // Give the socket a moment to finish the handshake, then mark
            // as subscribed so listeners attach.
            setTimeout(() => {
                if (!cancelled) setIsSubscribed(true);
            }, 300);
        };

        trySubscribe();

        return () => {
            cancelled = true;
        };
    }, [channel, conversationId]);

    useEffect(() => {
        if (!isSubscribed) return;

        const ch = channel();
        if (!ch) return;

        const handleHere = (users: PresenceUser[]) => {
            setOnlineUsers(Array.isArray(users) ? users : []);
        };

        const handleJoining = (user: PresenceUser) => {
            setOnlineUsers((prev) => {
                const exists = prev.some(
                    (u) => String(u.id) === String(user.id),
                );
                return exists ? prev : [...prev, user];
            });
        };

        const handleLeaving = (user: PresenceUser) => {
            setOnlineUsers((prev) =>
                prev.filter((u) => String(u.id) !== String(user.id)),
            );
        };

        const handleWhisper = (event: { name: string }) => {
            if (!event?.name) return;
            setTypingUser(event.name);

            if (typingTimer.current) clearTimeout(typingTimer.current);

            typingTimer.current = setTimeout(() => {
                setTypingUser(null);
                typingTimer.current = null;
            }, 1800);
        };

        ch.here(handleHere);
        ch.joining(handleJoining);
        ch.leaving(handleLeaving);
        ch.listenForWhisper("typing", handleWhisper);

        return () => {
            if (typingTimer.current) {
                clearTimeout(typingTimer.current);
                typingTimer.current = null;
            }
            try {
                ch.stopListeningForWhisper("typing", handleWhisper);
            } catch {
                // Channel may already be disconnected.
            }
        };
    }, [channel, conversationId, isSubscribed]);

    return { channel, onlineUsers, typingUser, isSubscribed };
}