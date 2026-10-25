import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type PropsWithChildren,
} from "react";
import { usePage } from "@inertiajs/react";

interface PresenceUser {
    id: number;
    name: string;
}

interface StatusEvent {
    user_id: number | string;
    name?: string;
    is_online: boolean;
    last_seen?: string | null;
}

interface UserStatus {
    isOnline: boolean;
    lastSeen: string | null;
    name?: string;
}

interface OnlineStatusContextValue {
    statuses: Record<number, UserStatus>;
    isUserOnline: (userId: number | string | null | undefined) => boolean;
    getLastSeen: (userId: number | string | null | undefined) => string | null;
}

const OnlineStatusContext = createContext<OnlineStatusContextValue | null>(
    null,
);

export function OnlineStatusProvider({ children }: PropsWithChildren) {
    const { props } = usePage();

    const auth = props.auth as {
        user?: { id: number; name: string } | null;
    };

    const userId = auth?.user?.id ?? null;

    const [statuses, setStatuses] = useState<Record<number, UserStatus>>({});

    const markOnline = useCallback((user: PresenceUser) => {
        setStatuses((current) => ({
            ...current,
            [Number(user.id)]: {
                isOnline: true,
                lastSeen: null,
                name: user.name,
            },
        }));
    }, []);

    const markOffline = useCallback(
        (userId: number | string, lastSeen?: string | null, name?: string) => {
            const id = Number(userId);

            setStatuses((current) => ({
                ...current,
                [id]: {
                    isOnline: false,
                    lastSeen: lastSeen ?? new Date().toISOString(),
                    name: name ?? current[id]?.name,
                },
            }));
        },
        [],
    );

    useEffect(() => {
        if (!userId || !window.Echo) {
            setStatuses({});
            return;
        }

        let active = true;

        const sendStatus = async (isOnline: boolean) => {
            const csrfToken = document.querySelector<HTMLMetaElement>(
                'meta[name="csrf-token"]',
            )?.content;

            try {
                await fetch("/device-status", {
                    method: "POST",
                    credentials: "same-origin",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        "X-Requested-With": "XMLHttpRequest",
                        ...(csrfToken ? { "X-CSRF-TOKEN": csrfToken } : {}),
                    },
                    body: JSON.stringify({ is_online: isOnline }),
                });
            } catch {
                // A disconnected browser cannot always notify Laravel.
            }
        };

        const channel = window.Echo.join("online-users");

        channel
            .here((users: PresenceUser[]) => {
                if (!active) return;

                setStatuses((current) => {
                    const next = { ...current };

                    // Remove stale online entries before applying the snapshot.
                    for (const [id, status] of Object.entries(next)) {
                        if (status.isOnline) {
                            next[Number(id)] = {
                                ...status,
                                isOnline: false,
                                lastSeen: new Date().toISOString(),
                            };
                        }
                    }

                    for (const user of users) {
                        next[Number(user.id)] = {
                            isOnline: true,
                            lastSeen: null,
                            name: user.name,
                        };
                    }

                    return next;
                });
            })
            .joining((user: PresenceUser) => {
                if (active) markOnline(user);
            })
            .leaving((user: PresenceUser) => {
                if (active) {
                    markOffline(user.id, new Date().toISOString(), user.name);
                }
            })
            .listen(".UserOnlineStatusChanged", (event: StatusEvent) => {
                if (!active) return;

                if (event.is_online) {
                    markOnline({
                        id: Number(event.user_id),
                        name:
                            event.name ??
                            statuses[Number(event.user_id)]?.name ??
                            "",
                    });
                } else {
                    markOffline(event.user_id, event.last_seen, event.name);
                }
            });

        const handleOnline = () => {
            void sendStatus(true);
        };

        const handleOffline = () => {
            void sendStatus(false);
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Initial heartbeat.
        if (navigator.onLine) {
            void sendStatus(true);
        }

        // Keep the heartbeat fresh while the app is connected.
        const heartbeat = window.setInterval(() => {
            if (navigator.onLine) {
                void sendStatus(true);
            }
        }, 20_000);

        return () => {
            active = false;
            window.clearInterval(heartbeat);
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
            window.Echo.leave("online-users");
        };
    }, [userId, markOnline, markOffline]);

    const isUserOnline = useCallback(
        (id: number | string | null | undefined) => {
            if (id == null) return false;
            return statuses[Number(id)]?.isOnline ?? false;
        },
        [statuses],
    );

    const getLastSeen = useCallback(
        (id: number | string | null | undefined) => {
            if (id == null) return null;
            return statuses[Number(id)]?.lastSeen ?? null;
        },
        [statuses],
    );

    return (
        <OnlineStatusContext.Provider
            value={{ statuses, isUserOnline, getLastSeen }}
        >
            {children}
        </OnlineStatusContext.Provider>
    );
}

export function useAppOnlineStatus() {
    const context = useContext(OnlineStatusContext);

    if (!context) {
        throw new Error(
            "useAppOnlineStatus must be used inside OnlineStatusProvider.",
        );
    }

    return context;
}
