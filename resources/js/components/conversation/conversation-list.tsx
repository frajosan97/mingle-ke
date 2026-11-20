// resources/js/components/conversation/conversation-list.tsx

import { Link, router, usePage } from "@inertiajs/react";
import { useEcho } from "@laravel/echo-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { BadgeCheck, Check, CheckCheck, SearchX } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Conversation, MessageStatus } from "@/types";
import { EmptyState } from "../ui/empty-state";

type ExtendedConversation = Omit<Conversation, "lastMessageId"> & {
    online?: boolean;
    verified?: boolean;
    lastMessageId?: number | string | null;
};

interface Props {
    activeId?: string;
    query?: string;
    isCollapsed?: boolean;
}

interface MessageEvent {
    id: number | string;
    conversation_id: number | string;
    sender_id: number | string;
    body?: string | null;
    content?: string | null;
    created_at?: string | null;
}

interface ReceiptEvent {
    message_id?: number | string | null;
    conversation_id?: number | string | null;
    sender_id?: number | string | null;
}

type ReceiptStatus = "delivered" | "read";

const statusRank: Record<MessageStatus, number> = {
    pending: 0,
    sent: 1,
    delivered: 2,
    read: 3,
};

function timestamp(value?: string | number | null): number {
    if (value == null) return 0;

    const result =
        typeof value === "number" ? value : new Date(value).getTime();

    return Number.isFinite(result) ? result : 0;
}

function higherStatus(
    a?: MessageStatus | null,
    b?: MessageStatus | null,
): MessageStatus | null {
    if (a == null) return b ?? null;
    if (b == null) return a;

    return statusRank[a] >= statusRank[b] ? a : b;
}

function sortConversations(
    list: ExtendedConversation[],
): ExtendedConversation[] {
    return [...list].sort(
        (a, b) => timestamp(b.lastMessageAt) - timestamp(a.lastMessageAt),
    );
}

function formatTime(value?: string | null): string {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function ConversationList({
    activeId,
    query = "",
    isCollapsed = false,
}: Props) {
    const { props } = usePage();

    const pageProps = props as typeof props & {
        auth?: {
            user?: {
                id?: number | string;
            } | null;
        };
        conversations?: ExtendedConversation[];
    };

    const userId = Number(pageProps.auth?.user?.id);

    const initial = pageProps.conversations ?? [];

    const [conversations, setConversations] = useState<ExtendedConversation[]>(
        () => sortConversations(initial),
    );

    // Keep refs synchronized for real-time callbacks.
    const conversationsRef = useRef(conversations);
    const activeIdRef = useRef(activeId);

    useEffect(() => {
        conversationsRef.current = conversations;
    }, [conversations]);

    useEffect(() => {
        activeIdRef.current = activeId;
    }, [activeId]);

    // Prevent duplicate acknowledgements and reloads.
    const acknowledgedMessages = useRef<Set<string>>(new Set());
    const pendingConversationReloads = useRef<Set<string>>(new Set());

    // Synchronize server props without losing newer real-time updates.
    useEffect(() => {
        setConversations((current) => {
            const currentById = new Map(
                current.map((conversation) => [
                    String(conversation.id),
                    conversation,
                ]),
            );

            const merged = initial.map((server) => {
                const existing = currentById.get(String(server.id));

                const isActive =
                    String(server.id) === String(activeIdRef.current ?? "");

                if (!existing) {
                    return isActive ? { ...server, unread: 0 } : server;
                }

                const serverTime = timestamp(server.lastMessageAt);
                const existingTime = timestamp(existing.lastMessageAt);

                const serverIsNewer = serverTime >= existingTime;

                const sameMessage =
                    server.lastMessageId != null &&
                    existing.lastMessageId != null
                        ? String(server.lastMessageId) ===
                          String(existing.lastMessageId)
                        : serverTime === existingTime;

                const latest = serverIsNewer
                    ? { ...existing, ...server }
                    : { ...server, ...existing };

                return {
                    ...latest,

                    lastMessageId:
                        latest.lastMessageId ??
                        existing.lastMessageId ??
                        server.lastMessageId,

                    lastMessageStatus: sameMessage
                        ? higherStatus(
                              existing.lastMessageStatus,
                              server.lastMessageStatus,
                          )
                        : serverIsNewer
                          ? server.lastMessageStatus
                          : existing.lastMessageStatus,

                    unread: isActive
                        ? 0
                        : serverIsNewer
                          ? server.unread
                          : existing.unread,
                };
            });

            return sortConversations(merged);
        });

        pendingConversationReloads.current.clear();
    }, [initial]);

    // Clear unread count for the active conversation.
    useEffect(() => {
        if (activeId == null) return;

        setConversations((current) => {
            const index = current.findIndex(
                (conversation) => String(conversation.id) === String(activeId),
            );

            if (index === -1 || current[index].unread === 0) {
                return current;
            }

            const next = [...current];

            next[index] = {
                ...next[index],
                unread: 0,
            };

            return next;
        });
    }, [activeId]);

    // Keep real-time message handling centralized.
    useEcho(
        userId ? `user.${userId}` : "user.0",
        ".MessageSent",
        (event: { message?: MessageEvent }) => {
            const message = event?.message;

            if (!message || !userId) return;

            const conversationId = message.conversation_id;
            const messageId = message.id;

            if (conversationId == null || messageId == null) return;

            const conversationKey = String(conversationId);
            const messageKey = `${conversationKey}:${messageId}`;

            const isMine = Number(message.sender_id) === userId;

            const isActive =
                String(activeIdRef.current ?? "") === conversationKey;

            const existingConversation = conversationsRef.current.find(
                (conversation) => String(conversation.id) === conversationKey,
            );

            // Acknowledge incoming messages once.
            if (!isMine && !acknowledgedMessages.current.has(messageKey)) {
                acknowledgedMessages.current.add(messageKey);

                void axios
                    .post(`/conversations/${conversationId}/delivered`)
                    .catch((error) => {
                        acknowledgedMessages.current.delete(messageKey);

                        console.error(
                            "Failed to acknowledge message delivery:",
                            error,
                        );
                    });
            }

            // Reload when a new conversation is missing from the sidebar.
            if (!existingConversation) {
                if (!pendingConversationReloads.current.has(conversationKey)) {
                    pendingConversationReloads.current.add(conversationKey);

                    router.reload({
                        only: ["conversations"],
                        onFinish: () => {
                            pendingConversationReloads.current.delete(
                                conversationKey,
                            );
                        },
                    });
                }

                return;
            }

            const createdAt = message.created_at ?? new Date().toISOString();

            const body = message.body ?? message.content ?? "";

            const incomingTime = timestamp(createdAt);

            setConversations((current) => {
                const index = current.findIndex(
                    (conversation) =>
                        String(conversation.id) === conversationKey,
                );

                if (index === -1) return current;

                const existing = current[index];

                const existingTime = timestamp(existing.lastMessageAt);

                // Ignore stale or duplicate messages.
                if (
                    incomingTime < existingTime ||
                    String(existing.lastMessageId ?? "") === String(messageId)
                ) {
                    return current;
                }

                const updated: ExtendedConversation = {
                    ...existing,
                    lastMessage: body,
                    lastMessageId: messageId,
                    lastMessageAt: createdAt,
                    lastMessageSenderId: Number(message.sender_id),
                    lastMessageStatus: isMine ? "sent" : null,
                    time: formatTime(createdAt),

                    unread: isActive
                        ? 0
                        : isMine
                          ? existing.unread
                          : (existing.unread ?? 0) + 1,
                };

                const next = [...current];

                next[index] = updated;

                return sortConversations(next);
            });
        },
    );

    // Handle message delivery and read receipts.
    const handleReceipt = useCallback(
        (event: ReceiptEvent, status: ReceiptStatus) => {
            if (event?.message_id == null || !userId) return;

            if (Number(event.sender_id) !== userId) return;

            const conversationId = event.conversation_id;

            if (conversationId == null) return;

            setConversations((current) => {
                const index = current.findIndex(
                    (conversation) =>
                        String(conversation.id) === String(conversationId),
                );

                if (index === -1) return current;

                const existing = current[index];

                // Do not apply an old receipt to another message.
                if (
                    existing.lastMessageId != null &&
                    String(existing.lastMessageId) !== String(event.message_id)
                ) {
                    return current;
                }

                const next = [...current];

                next[index] = {
                    ...existing,
                    lastMessageStatus: higherStatus(
                        existing.lastMessageStatus,
                        status,
                    ),
                };

                return next;
            });
        },
        [userId],
    );

    useEcho(
        userId ? `user.${userId}` : "user.0",
        ".MessageDelivered",
        (event: ReceiptEvent) => handleReceipt(event, "delivered"),
    );

    useEcho(
        userId ? `user.${userId}` : "user.0",
        ".MessageRead",
        (event: ReceiptEvent) => handleReceipt(event, "read"),
    );

    // Filter conversations.
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();

        if (!q) return conversations;

        return conversations.filter((conversation) => {
            const name = (conversation.name ?? "").toLowerCase();
            const last = (conversation.lastMessage ?? "").toLowerCase();

            const area = (
                (
                    conversation as ExtendedConversation & {
                        area?: string;
                    }
                ).area ?? ""
            ).toLowerCase();

            return name.includes(q) || last.includes(q) || area.includes(q);
        });
    }, [conversations, query]);

    // Message status indicator.
    const renderMessageStatus = (conversation: ExtendedConversation) => {
        if (
            !userId ||
            conversation.lastMessageSenderId == null ||
            String(conversation.lastMessageSenderId) !== String(userId)
        ) {
            return null;
        }

        switch (conversation.lastMessageStatus) {
            case "read":
                return (
                    <CheckCheck
                        className="h-4 w-4 shrink-0 text-brand-pink"
                        aria-label="Read"
                    />
                );

            case "delivered":
                return (
                    <CheckCheck
                        className="h-4 w-4 shrink-0 text-muted-foreground"
                        aria-label="Delivered"
                    />
                );

            case "sent":
            default:
                return (
                    <Check
                        className="h-4 w-4 shrink-0 text-muted-foreground"
                        aria-label="Sent"
                    />
                );
        }
    };

    // Empty state.
    if (conversations.length === 0) {
        return (
            <div className="relative flex h-full flex-col items-center justify-center gap-6 overflow-hidden px-6 text-center">
                <EmptyState description="No conversations yet!" />
            </div>
        );
    }

    // Search empty state.
    if (filtered.length === 0) {
        return (
            <div className="relative flex h-full flex-col items-center justify-center gap-6 overflow-hidden px-6 text-center">
                <EmptyState
                    icon={<SearchX className="h-6 w-6 text-muted-foreground" />}
                    title={
                        query ? `No matches for "${query}"` : "No matches found"
                    }
                    description="Try a different name, message, or area."
                />
            </div>
        );
    }

    return (
        <ul className={cn("space-y-0.5 py-1", isCollapsed && "md:px-2")}>
            {filtered.map((conversation) => {
                const active =
                    String(activeId ?? "") === String(conversation.id);

                const unread = conversation.unread ?? 0;

                const name = conversation.name ?? "Unknown user";

                return (
                    <li key={conversation.id}>
                        <Link
                            href={`/conversations/${conversation.id}`}
                            aria-current={active ? "page" : undefined}
                            title={isCollapsed ? name : undefined}
                            className={cn(
                                "group relative flex min-w-0 items-center gap-3 px-4 py-3 transition-colors duration-150",
                                "hover:bg-accent/50",
                                active && "bg-primary-soft",
                                active &&
                                    "before:absolute before:inset-y-1 before:left-0 before:w-1 before:rounded-r-full before:bg-primary",

                                // Collapsed rail: center avatar, hide details
                                isCollapsed &&
                                    "md:justify-center md:gap-0 md:px-2 md:py-2.5",
                            )}
                        >
                            {/* Avatar */}
                            <div className="relative h-12 w-12 shrink-0">
                                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-semibold text-white ring-1 ring-border/30">
                                    {conversation.avatarUrl ? (
                                        <img
                                            src={conversation.avatarUrl}
                                            alt={name}
                                            loading="lazy"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        name.charAt(0).toUpperCase()
                                    )}
                                </div>

                                {conversation.online && (
                                    <span
                                        aria-label="Online"
                                        className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-brand-green"
                                    />
                                )}

                                {/* Unread dot for collapsed rail */}
                                {isCollapsed && unread > 0 && (
                                    <span
                                        aria-label={`${unread} unread messages`}
                                        className="absolute -right-0.5 -top-0.5 hidden h-3 w-3 rounded-full border-2 border-card bg-primary md:block"
                                    />
                                )}
                            </div>

                            {/* Conversation Details — hidden in collapsed rail */}
                            <div
                                className={cn(
                                    "min-w-0 flex-1",
                                    isCollapsed && "md:hidden",
                                )}
                            >
                                {/* Name and timestamp */}
                                <div className="flex min-w-0 items-center justify-between gap-2">
                                    <div className="flex min-w-0 flex-1 items-center gap-1">
                                        <p
                                            className={cn(
                                                "truncate text-sm text-foreground",
                                                unread > 0
                                                    ? "font-bold"
                                                    : "font-medium",
                                            )}
                                        >
                                            {name}
                                        </p>

                                        {conversation.verified && (
                                            <BadgeCheck
                                                className="h-3.5 w-3.5 shrink-0 text-brand-pink"
                                                aria-label="Verified"
                                            />
                                        )}
                                    </div>

                                    <time
                                        className={cn(
                                            "shrink-0 text-[11px] tabular-nums",
                                            unread > 0
                                                ? "font-semibold text-brand-pink"
                                                : "text-muted-foreground",
                                        )}
                                    >
                                        {conversation.time}
                                    </time>
                                </div>

                                {/* Message preview and unread badge */}
                                <div className="mt-1 flex min-w-0 items-center justify-between gap-2">
                                    <div className="flex min-w-0 flex-1 items-center gap-1.5">
                                        {renderMessageStatus(conversation)}

                                        <p
                                            className={cn(
                                                "min-w-0 flex-1 truncate text-[13px] leading-5",
                                                unread > 0
                                                    ? "font-medium text-foreground/80"
                                                    : "text-muted-foreground",
                                            )}
                                        >
                                            {conversation.lastMessage ||
                                                "Start a conversation"}
                                        </p>
                                    </div>

                                    {unread > 0 && (
                                        <span
                                            aria-label={`${unread} unread messages`}
                                            className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold leading-none text-white shadow-glow-pink/40"
                                        >
                                            {unread > 99 ? "99+" : unread}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Screen-reader label when collapsed */}
                            {isCollapsed && (
                                <span className="sr-only">
                                    {name}
                                    {unread > 0
                                        ? `, ${unread} unread messages`
                                        : ""}
                                </span>
                            )}
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}
