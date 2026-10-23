// resources/js/components/conversation/conversation-list.tsx
import { Link, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import { useEcho } from "@laravel/echo-react";
import { BadgeCheck, Check, CheckCheck, Compass, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Conversation, MessageStatus } from "@/types";

// Explicitly declare lastMessageId here to avoid TypeScript caching issues
type ExtendedConversation = Conversation & {
    online?: boolean;
    verified?: boolean;
    lastMessageId?: number | null;
};

interface Props {
    activeId?: string;
    query?: string;
}

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
    if (!a) return b ?? null;
    if (!b) return a;
    return statusRank[a] >= statusRank[b] ? a : b;
}

function sortConversations(
    list: ExtendedConversation[],
): ExtendedConversation[] {
    return [...list].sort(
        (a, b) => timestamp(b.lastMessageAt) - timestamp(a.lastMessageAt),
    );
}

export default function ConversationList({ activeId, query = "" }: Props) {
    const { props } = usePage();
    const userId = Number((props as any).auth?.user?.id);
    const initial = ((props as any).conversations ??
        []) as ExtendedConversation[];

    const [conversations, setConversations] = useState<ExtendedConversation[]>(
        () => sortConversations(initial),
    );

    // Sync server props on load
    useEffect(() => {
        setConversations((current) => {
            const currentById = new Map(current.map((c) => [String(c.id), c]));
            const merged = initial.map((server) => {
                const existing = currentById.get(String(server.id));
                if (!existing) return server;

                const sameMessage =
                    timestamp(existing.lastMessageAt) ===
                    timestamp(server.lastMessageAt);
                return {
                    ...existing,
                    ...server,
                    lastMessageStatus: sameMessage
                        ? higherStatus(
                              existing.lastMessageStatus,
                              server.lastMessageStatus,
                          )
                        : server.lastMessageStatus,
                };
            });
            return sortConversations(merged);
        });
    }, [initial]);

    // 1. Listen for new messages globally
    useEcho(
        userId ? `user.${userId}` : "user.0",
        ".MessageSent",
        (event: any) => {
            const msg = event?.message;
            if (!msg) return;

            setConversations((current) => {
                const index = current.findIndex(
                    (c) => String(c.id) === String(msg.conversation_id),
                );
                if (index === -1) return current;

                const existing = current[index];
                const isMine = Number(msg.sender_id) === userId;
                const createdAt = msg.created_at ?? new Date().toISOString();
                const body = msg.body ?? msg.content ?? "";

                const updated: ExtendedConversation = {
                    ...existing,
                    lastMessage: body,
                    lastMessageId: msg.id,
                    lastMessageAt: createdAt,
                    lastMessageSenderId: Number(msg.sender_id),
                    lastMessageStatus: isMine ? "sent" : null,
                    time: new Date(createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                    unread: isMine
                        ? existing.unread
                        : (existing.unread || 0) + 1,
                };

                return sortConversations(
                    current.map((c, i) => (i === index ? updated : c)),
                );
            });
        },
    );

    // 2. Listen for receipts globally
    const handleReceipt = (event: any, status: "delivered" | "read") => {
        if (!event?.message_id || !userId) return;
        // We only care if WE sent the message
        if (Number(event.sender_id) !== userId) return;

        const convId = event.conversation_id;
        if (!convId) return;

        setConversations((current) => {
            const index = current.findIndex(
                (c) => String(c.id) === String(convId),
            );
            if (index === -1) return current;

            const existing = current[index];

            // Only apply the receipt if it matches the latest message ID
            if (
                existing.lastMessageId &&
                String(existing.lastMessageId) !== String(event.message_id)
            ) {
                return current;
            }

            return current.map((c, i) =>
                i === index
                    ? {
                          ...existing,
                          lastMessageStatus: higherStatus(
                              existing.lastMessageStatus,
                              status,
                          ),
                      }
                    : c,
            );
        });
    };

    useEcho(userId ? `user.${userId}` : "user.0", ".MessageDelivered", (e) =>
        handleReceipt(e, "delivered"),
    );
    useEcho(userId ? `user.${userId}` : "user.0", ".MessageRead", (e) =>
        handleReceipt(e, "read"),
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return conversations;
        return conversations.filter((c) => {
            const name = (c.name ?? "").toLowerCase();
            const last = (c.lastMessage ?? "").toLowerCase();
            const area = ((c as any).area ?? "").toLowerCase();
            return name.includes(q) || last.includes(q) || area.includes(q);
        });
    }, [conversations, query]);

    const renderMessageStatus = (c: ExtendedConversation) => {
        console.log(c);
        if (
            userId == null ||
            c.lastMessageSenderId == null ||
            String(c.lastMessageSenderId) !== String(userId)
        ) {
            return null;
        }

        switch (c.lastMessageStatus) {
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
            {filtered.map((c) => {
                const active = String(activeId ?? "") === String(c.id);
                return (
                    <li key={c.id}>
                        <Link
                            href={`/conversations/${c.id}`}
                            className={cn(
                                "relative flex items-center gap-3 px-4 py-3 transition-colors",
                                "hover:bg-accent/50",
                                active &&
                                    "bg-gradient-brand-soft before:absolute before:inset-y-1 before:left-0 before:w-1 before:rounded-r-full before:bg-gradient-brand",
                            )}
                        >
                            <div className="relative shrink-0">
                                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-brand text-sm font-semibold text-white">
                                    {c.avatarUrl ? (
                                        <img
                                            src={c.avatarUrl}
                                            alt={c.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        (c.name?.charAt(0).toUpperCase() ?? "?")
                                    )}
                                </div>
                                {c.online && (
                                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-brand-green" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="flex min-w-0 items-center gap-1 text-sm font-medium text-foreground">
                                        <span
                                            className={cn(
                                                "truncate",
                                                c.unread > 0 && "font-semibold",
                                            )}
                                        >
                                            {c.name}
                                        </span>
                                        {c.verified && (
                                            <BadgeCheck
                                                className="h-3.5 w-3.5 shrink-0 text-brand-pink"
                                                aria-label="Verified"
                                            />
                                        )}
                                    </p>
                                    <span
                                        className={cn(
                                            "ml-2 shrink-0 text-xs tabular-nums",
                                            c.unread > 0
                                                ? "text-brand-pink font-medium"
                                                : "text-muted-foreground",
                                        )}
                                    >
                                        {c.time}
                                    </span>
                                </div>
                                <div className="mt-0.5 flex items-center justify-between gap-2">
                                    <div className="flex min-w-0 flex-1 items-center gap-1">
                                        {renderMessageStatus(c)}
                                        <p
                                            className={cn(
                                                "truncate text-sm",
                                                c.unread > 0
                                                    ? "text-foreground/80"
                                                    : "text-muted-foreground",
                                            )}
                                        >
                                            {c.lastMessage}
                                        </p>
                                    </div>
                                    {c.unread > 0 && (
                                        <span className="relative ml-2 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-gradient-brand px-1.5 text-[11px] font-semibold text-white shadow-glow-pink/40">
                                            {c.unread}
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
