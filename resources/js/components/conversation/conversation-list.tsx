// resources/js/components/conversation/conversation-list.tsx
import { Link, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import { useEcho } from "@laravel/echo-react";
import { BadgeCheck, Check, CheckCheck, Compass, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types";

type MessageStatus = "sent" | "delivered" | "read";

type ExtendedConversation = Conversation & {
    online?: boolean;
    verified?: boolean;
    lastMessageAt?: string | number | null;
    lastMessageSenderId?: number | string | null;
    lastMessageStatus?: MessageStatus | null;
    unread: number;
};

type ConversationUpdatedEvent = {
    conversation?: Partial<ExtendedConversation> & {
        id: number | string;
    };
};

interface Props {
    activeId?: string;
    /** Search term — matched against name, last message, and area. */
    query?: string;
}

function timestamp(value?: string | number | null): number {
    if (value == null) return 0;
    const result =
        typeof value === "number" ? value : new Date(value).getTime();
    return Number.isFinite(result) ? result : 0;
}

function sortConversations(
    conversations: ExtendedConversation[],
): ExtendedConversation[] {
    return [...conversations].sort(
        (a, b) => timestamp(b.lastMessageAt) - timestamp(a.lastMessageAt),
    );
}

export default function ConversationList({ activeId, query = "" }: Props) {
    const { props } = usePage();
    const auth = (props as any).auth;
    const userId = auth?.user?.id;
    const initial = ((props as any).conversations ??
        []) as ExtendedConversation[];

    const [conversations, setConversations] = useState<ExtendedConversation[]>(
        () => sortConversations(initial),
    );

    // Sync server data without replacing newer real-time updates
    useEffect(() => {
        setConversations((current) => {
            const currentById = new Map(current.map((c) => [String(c.id), c]));
            const merged = initial.map((server) => {
                const existing = currentById.get(String(server.id));
                if (!existing) return server;
                const sameLatestMessage =
                    timestamp(existing.lastMessageAt) ===
                        timestamp(server.lastMessageAt) &&
                    String(existing.lastMessageSenderId ?? "") ===
                        String(server.lastMessageSenderId ?? "");
                const serverIsOlder =
                    timestamp(existing.lastMessageAt) >
                    timestamp(server.lastMessageAt);
                if (serverIsOlder) return { ...server, ...existing };
                return {
                    ...existing,
                    ...server,
                    ...(sameLatestMessage
                        ? {
                              lastMessageStatus:
                                  existing.lastMessageStatus ??
                                  server.lastMessageStatus,
                          }
                        : {}),
                };
            });
            return sortConversations(merged);
        });
    }, [initial]);

    // Realtime updates
    useEcho(
        userId != null ? `user.${userId}` : "user.0",
        ".ConversationUpdated",
        (event: ConversationUpdatedEvent) => {
            const incoming = event?.conversation;
            if (incoming?.id == null) return;
            setConversations((current) => {
                const index = current.findIndex(
                    (c) => String(c.id) === String(incoming.id),
                );
                if (index === -1) return current;
                const existing = current[index];
                const sameLatestMessage =
                    incoming.lastMessageAt == null ||
                    timestamp(incoming.lastMessageAt) ===
                        timestamp(existing.lastMessageAt);
                const merged: ExtendedConversation = {
                    ...existing,
                    ...incoming,
                    unread: incoming.unread ?? existing.unread ?? 0,
                    lastMessageStatus: sameLatestMessage
                        ? (incoming.lastMessageStatus ??
                          existing.lastMessageStatus)
                        : incoming.lastMessageStatus,
                };
                return sortConversations(
                    current.map((c, i) => (i === index ? merged : c)),
                );
            });
        },
    );

    // ── Filtered view (memoized on query + conversations) ─────────
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

    const renderMessageStatus = (conversation: ExtendedConversation) => {
        if (
            userId == null ||
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
                        role="img"
                    />
                );
            case "delivered":
                return (
                    <CheckCheck
                        className="h-4 w-4 shrink-0 text-muted-foreground"
                        aria-label="Delivered"
                        role="img"
                    />
                );
            case "sent":
            default:
                return (
                    <Check
                        className="h-4 w-4 shrink-0 text-muted-foreground"
                        aria-label="Sent"
                        role="img"
                    />
                );
        }
    };

    // ── Empty states ──────────────────────────────────────────────
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

    // ── List ──────────────────────────────────────────────────────
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
                                            alt={conversation.name}
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
                                                ? "text-brand-pink font-medium"
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
