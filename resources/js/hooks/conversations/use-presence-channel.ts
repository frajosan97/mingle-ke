import { useCallback, useEffect, useRef, useState } from "react";
import { echo } from "@laravel/echo-react";

export interface PresenceUser {
    id: number | string;
    name: string;
}

type PresenceChannelInstance = ReturnType<
    ReturnType<typeof echo>["join"]
>;

export function usePresenceChannel(conversationId: string) {
    const [typingUser, setTypingUser] = useState<string | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
    const [isSubscribed, setIsSubscribed] = useState(false);

    const channelRef = useRef<PresenceChannelInstance | null>(null);
    const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!conversationId) {
            channelRef.current = null;
            setOnlineUsers([]);
            setTypingUser(null);
            setIsSubscribed(false);
            return;
        }

        let active = true;
        const channelName = `conversation-presence.${conversationId}`;
        const client = echo();

        setOnlineUsers([]);
        setTypingUser(null);
        setIsSubscribed(false);

        const channel = client.join(channelName);
        channelRef.current = channel;

        const handleHere = (users: PresenceUser[]) => {
            if (!active) return;

            setOnlineUsers(Array.isArray(users) ? users : []);
            setIsSubscribed(true);
        };

        const handleJoining = (user: PresenceUser) => {
            if (!active || user?.id == null) return;

            setOnlineUsers((previous) => {
                if (
                    previous.some(
                        (item) => String(item.id) === String(user.id),
                    )
                ) {
                    return previous;
                }

                return [...previous, user];
            });
        };

        const handleLeaving = (user: PresenceUser) => {
            if (!active || user?.id == null) return;

            setOnlineUsers((previous) =>
                previous.filter(
                    (item) => String(item.id) !== String(user.id),
                ),
            );
        };

        const handleWhisper = (event: { name?: string }) => {
            if (!active || !event?.name) return;

            setTypingUser(event.name);

            if (typingTimer.current) {
                clearTimeout(typingTimer.current);
            }

            typingTimer.current = setTimeout(() => {
                if (active) {
                    setTypingUser(null);
                }

                typingTimer.current = null;
            }, 1800);
        };

        channel.here(handleHere);
        channel.joining(handleJoining);
        channel.leaving(handleLeaving);
        channel.listenForWhisper("typing", handleWhisper);

        channel.error((error: unknown) => {
            console.error(
                "[Conversation presence] Subscription error:",
                error,
            );
        });

        return () => {
            active = false;

            if (typingTimer.current) {
                clearTimeout(typingTimer.current);
                typingTimer.current = null;
            }

            if (channelRef.current === channel) {
                channelRef.current = null;
            }

            setIsSubscribed(false);
            client.leave(channelName);
        };
    }, [conversationId]);

    const getChannel = useCallback(() => {
        return channelRef.current;
    }, []);

    return {
        channel: getChannel,
        onlineUsers,
        typingUser,
        isSubscribed,
    };
}