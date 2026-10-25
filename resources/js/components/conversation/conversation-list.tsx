import { Link, router, usePage } from "@inertiajs/react";
import { useEcho } from "@laravel/echo-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { BadgeCheck, Check, CheckCheck, Compass, SearchX } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Conversation, MessageStatus } from "@/types";

type ExtendedConversation = Conversation & {
    online?: boolean;
    verified?: boolean;
    lastMessageId?: number | null;
};

interface Props {
    activeId?: string;
    query?: string;
}

type MessageEvent = {
    id: number | string;
    conversation_id: number | string;
    sender_id: number | string;
    body?: string | null;
    content?: string | null;
    created_at?: string | null;
};

function timestamp(value?: string | number | null): number {
    if (value == null) return 0;

    const result =
        typeof value === "number" ? value : new Date(value).getTime();

    return Number.isFinite(result) ? result : 0;
}

const statusRank: Record<MessageStatus, number> = {
    sent: 0,
    delivered: 1,
    read: 2,
};

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

export default function ConversationList({ activeId, query = "" }: Props) {
    const { props } = usePage();

    const userId = Number((props as any).auth?.user?.id);

    const initial = ((props as any).conversations ??
        []) as ExtendedConversation[];

    const [conversations, setConversations] = useState<ExtendedConversation[]>(
        () => sortConversations(initial),
    );

    // Keep refs current so Echo callbacks do not rely on stale state.
    const conversationsRef = useRef(conversations);
    const activeIdRef = useRef(activeId);

    useEffect(() => {
        conversationsRef.current = conversations;
    }, [conversations]);

    useEffect(() => {
        activeIdRef.current = activeId;
    }, [activeId]);

    // Prevent duplicate delivery acknowledgements and repeated reloads.
    const acknowledgedMessages = useRef<Set<string>>(new Set());
    const pendingConversationReloads = useRef<Set<string>>(new Set());

    // Merge server props without discarding newer real-time messages or
    // downgrading receipt statuses.
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

                if (!existing) {
                    return String(server.id) === String(activeIdRef.current)
                        ? { ...server, unread: 0 }
                        : server;
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

                const isActive =
                    String(server.id) === String(activeIdRef.current);

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

        // A server refresh has completed supplying the conversation list.
        pendingConversationReloads.current.clear();
    }, [initial]);

    // Clear the active conversation's badge independently of server syncing.
    useEffect(() => {
        if (activeId == null) return;

        setConversations((current) =>
            current.map((conversation) =>
                String(conversation.id) === String(activeId)
                    ? { ...conversation, unread: 0 }
                    : conversation,
            ),
        );
    }, [activeId]);

    // Update the sidebar immediately when a message arrives.
    useEcho(
        userId ? `user.${userId}` : "user.0",
        ".MessageSent",
        (event: any) => {
            const message = event?.message as MessageEvent | undefined;

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

            // Acknowledge incoming messages once. The open conversation's
            // real-time hook should also mark them read when appropriate.
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

            // A new conversation may not yet be present in the sidebar.
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

                // Ignore stale events and duplicate delivery of the same
                // latest message so unread counts are not incremented twice.
                if (
                    incomingTime < existingTime ||
                    String(existing.lastMessageId ?? "") === String(messageId)
                ) {
                    return current;
                }

                const updated: ExtendedConversation = {
                    ...existing,
                    lastMessage: body,
                    lastMessageId: messageId as number,
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

    // Apply delivery/read receipts to the corresponding latest sent message.
    const handleReceipt = useCallback(
        (event: any, status: "delivered" | "read") => {
            if (event?.message_id == null || !userId) return;

            // Only update receipts for messages sent by this user.
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

                // Do not apply an old receipt to a different latest message.
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
        (event: any) => handleReceipt(event, "delivered"),
    );

    useEcho(
        userId ? `user.${userId}` : "user.0",
        ".MessageRead",
        (event: any) => handleReceipt(event, "read"),
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();

        if (!q) return conversations;

        return conversations.filter((conversation) => {
            const name = (conversation.name ?? "").toLowerCase();
            const last = (conversation.lastMessage ?? "").toLowerCase();
            const area = ((conversation as any).area ?? "").toLowerCase();

            return name.includes(q) || last.includes(q) || area.includes(q);
        });
    }, [conversations, query]);

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

    if (conversations.length === 0) {
        return (
            <div className="px-4 py-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-brand-soft">
                    <Compass className="h-6 w-6 text-brand-pink" />
                </div>

                <p className="mb-4 text-sm text-muted-foreground">
                    No messages yet.
                </p>

                <Link
                    href="/discover"
                    className="inline-flex items-center gap-1.5 rounded-full bg-gradient-brand px-4 py-2 text-xs font-semibold text-white shadow-glow-pink transition hover:shadow-glow-pink-strong hover-lift"
                >
                    <Compass className="h-3.5 w-3.5" />
                    Discover profiles
                </Link>
            </div>
        );
    }

    if (filtered.length === 0) {
        return (
            <div className="px-4 py-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <SearchX className="h-6 w-6 text-muted-foreground" />
                </div>

                <p className="mb-1 text-sm font-medium text-foreground">
                    No matches for "{query}"
                </p>

                <p className="text-xs text-muted-foreground">
                    Try a different name, message, or area.
                </p>
            </div>
        );
    }

    return (
        <ul className="py-1">
            {filtered.map((conversation) => {
                const active =
                    String(activeId ?? "") === String(conversation.id);

                return (
                    <li key={conversation.id}>
                        <Link
                            href={`/conversations/${conversation.id}`}
                            className={cn(
                                "relative flex items-center gap-3 px-4 py-3 transition-colors",
                                "hover:bg-accent/50",
                                active &&
                                    "bg-gradient-brand-soft before:absolute before:inset-y-1 before:left-0 before:w-1 before:rounded-r-full before:bg-gradient-brand",
                            )}
                        >
                            <div className="relative shrink-0">
                                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-brand text-sm font-semibold text-white">
                                    {conversation.avatarUrl ? (
                                        <img
                                            src={conversation.avatarUrl}
                                            alt={conversation.name ?? "Avatar"}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        (conversation.name
                                            ?.charAt(0)
                                            .toUpperCase() ?? "?")
                                    )}
                                </div>

                                {conversation.online && (
                                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-brand-green" />
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="flex min-w-0 items-center gap-1 text-sm font-medium text-foreground">
                                        <span
                                            className={cn(
                                                "truncate",
                                                conversation.unread > 0 &&
                                                    "font-semibold",
                                            )}
                                        >
                                            {conversation.name}
                                        </span>

                                        {conversation.verified && (
                                            <BadgeCheck
                                                className="h-3.5 w-3.5 shrink-0 text-brand-pink"
                                                aria-label="Verified"
                                            />
                                        )}
                                    </p>

                                    <span
                                        className={cn(
                                            "ml-2 shrink-0 text-xs tabular-nums",
                                            conversation.unread > 0
                                                ? "font-medium text-brand-pink"
                                                : "text-muted-foreground",
                                        )}
                                    >
                                        {conversation.time}
                                    </span>
                                </div>

                                <div className="mt-0.5 flex items-center justify-between gap-2">
                                    <div className="flex min-w-0 flex-1 items-center gap-1">
                                        {renderMessageStatus(conversation)}

                                        <p
                                            className={cn(
                                                "truncate text-sm",
                                                conversation.unread > 0
                                                    ? "text-foreground/80"
                                                    : "text-muted-foreground",
                                            )}
                                        >
                                            {conversation.lastMessage}
                                        </p>
                                    </div>

                                    {conversation.unread > 0 && (
                                        <span className="relative ml-2 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-gradient-brand px-1.5 text-[11px] font-semibold text-white shadow-glow-pink/40">
                                            {conversation.unread}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}
