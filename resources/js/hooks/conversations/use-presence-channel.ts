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
    const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { channel } = useEchoPresence(`conversation.${conversationId}`);

    useEffect(() => {
        const ch = channel();
        if (!ch) return;

        const handleHere = (users: PresenceUser[]) => setOnlineUsers(users);

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
    }, [channel, conversationId]);

    return { channel, onlineUsers, typingUser };
}