// resources/js/hooks/conversations/use-conversation-messages.ts

import { useCallback, useEffect, useState } from "react";
import type { ConversationMessage, MessageStatus } from "@/types";
import { formatChatTime } from "@/lib/conversation/time";

type MessageLike = Partial<ConversationMessage> & {
    id: number | string;
    content?: string | null;
    createdAt?: string | null;
};

const STATUS_RANK: Record<MessageStatus, number> = {
    pending: 0,
    sent: 1,
    delivered: 2,
    read: 3,
};

function maxStatus(
    a: MessageStatus | undefined,
    b: MessageStatus | undefined,
): MessageStatus {
    const x = a ?? "sent";
    const y = b ?? "sent";
    return STATUS_RANK[x] >= STATUS_RANK[y] ? x : y;
}

function deriveStatus(raw: MessageLike): MessageStatus {
    if (raw.status) return raw.status;
    if (raw.read) return "read";
    if (raw.delivered) return "delivered";
    return "sent";
}

function normalizeMessage(raw: MessageLike): ConversationMessage {
    const createdAt = raw.created_at ?? raw.createdAt ?? "";
    const body = raw.body ?? raw.content ?? null;
    const status = deriveStatus(raw);

    return {
        ...raw,
        id: raw.id,
        conversation_id: raw.conversation_id ?? 0,
        sender_id: raw.sender_id ?? 0,
        sender_name: raw.sender_name ?? "Unknown",
        type: raw.type ?? "text",
        body,
        attachments: raw.attachments ?? [],
        created_at: createdAt,
        time: formatChatTime(createdAt),
        mine: raw.mine ?? false,
        status,
        read: raw.read ?? status === "read",
        delivered: raw.delivered ?? (status === "delivered" || status === "read"),
        deleted: raw.deleted ?? false,
    } as ConversationMessage;
}

function sameId(a: number | string, b: number | string): boolean {
    return String(a) === String(b);
}

export function useConversationMessages(initialMessages: ConversationMessage[]) {
    const [messages, setMessages] = useState<ConversationMessage[]>(() =>
        initialMessages.map((m) => normalizeMessage(m as MessageLike)),
    );

    useEffect(() => {
        setMessages((previous) => {
            const incoming = initialMessages.map((m) =>
                normalizeMessage(m as MessageLike),
            );
            const incomingById = new Map(incoming.map((m) => [String(m.id), m]));

            const merged = previous.map((existing) => {
                const server = incomingById.get(String(existing.id));
                if (!server) return existing;

                const status = maxStatus(existing.status, server.status);

                return {
                    ...server,
                    mine: existing.mine || server.mine,
                    status,
                    read: status === "read",
                    delivered: status === "delivered" || status === "read",
                };
            });

            const incomingIds = new Set(incoming.map((m) => String(m.id)));
            const optimistic = previous.filter(
                (m) => Number(m.id) < 0 && !incomingIds.has(String(m.id)),
            );

            return [...merged, ...optimistic].sort(
                (a, b) =>
                    new Date(a.created_at || 0).getTime() -
                    new Date(b.created_at || 0).getTime(),
            );
        });
    }, [initialMessages]);

    const appendOptimistic = useCallback((message: ConversationMessage) => {
        const normalized = normalizeMessage(message as MessageLike);
        setMessages((previous) => {
            if (previous.some((m) => sameId(m.id, normalized.id))) return previous;
            return [...previous, normalized];
        });
    }, []);

    const removeById = useCallback((id: ConversationMessage["id"]) => {
        setMessages((previous) => previous.filter((m) => !sameId(m.id, id)));
    }, []);

    const confirmOptimistic = useCallback(
        (tempId: ConversationMessage["id"], serverMessage: MessageLike) => {
            const normalized = normalizeMessage(serverMessage);
            // Server messages are never "pending".
            const confirmedStatus: MessageStatus =
                normalized.status === "pending" ? "sent" : normalized.status;

            setMessages((previous) => {
                const serverExists = previous.some(
                    (m) => sameId(m.id, normalized.id) && !sameId(m.id, tempId),
                );
                if (serverExists) {
                    return previous.filter((m) => !sameId(m.id, tempId));
                }
                return previous.map((m) =>
                    sameId(m.id, tempId)
                        ? {
                            ...m,
                            ...normalized,
                            mine: true,
                            status: confirmedStatus,
                            read: confirmedStatus === "read",
                            delivered:
                                confirmedStatus === "delivered" ||
                                confirmedStatus === "read",
                            body: normalized.body ?? m.body ?? null,
                            attachments: normalized.attachments?.length
                                ? normalized.attachments
                                : m.attachments ?? [],
                        }
                        : m,
                );
            });
        },
        [],
    );

    const upsertReceived = useCallback((incoming: ConversationMessage) => {
        const normalized = normalizeMessage(incoming as MessageLike);
        setMessages((previous) => {
            const index = previous.findIndex((m) => sameId(m.id, normalized.id));
            if (index === -1) return [...previous, normalized];

            const existing = previous[index];
            const status = maxStatus(existing.status, normalized.status);

            const merged: ConversationMessage = {
                ...existing,
                ...normalized,
                body: normalized.body ?? existing.body ?? null,
                attachments: normalized.attachments?.length
                    ? normalized.attachments
                    : existing.attachments ?? [],
                mine: existing.mine || normalized.mine,
                status,
                read: status === "read",
                delivered: status === "delivered" || status === "read",
                deleted: existing.deleted || normalized.deleted,
            };

            return previous.map((m, i) => (i === index ? merged : m));
        });
    }, []);

    const markDelivered = useCallback((messageId: string | number) => {
        setMessages((previous) =>
            previous.map((m) => {
                if (sameId(m.id, messageId) && m.mine) {
                    const status = maxStatus(m.status, "delivered");
                    return {
                        ...m,
                        status,
                        delivered: status === "delivered" || status === "read",
                        read: status === "read",
                    };
                }
                return m;
            }),
        );
    }, []);

    const markRead = useCallback((messageId: string | number) => {
        setMessages((previous) =>
            previous.map((m) => {
                if (sameId(m.id, messageId) && m.mine) {
                    const status = maxStatus(m.status, "read");
                    return { ...m, status, delivered: true, read: true };
                }
                return m;
            }),
        );
    }, []);

    const markDeleted = useCallback((messageId: string | number) => {
        setMessages((previous) =>
            previous.map((m) =>
                sameId(m.id, messageId)
                    ? { ...m, body: null, attachments: [], deleted: true }
                    : m,
            ),
        );
    }, []);

    return {
        messages,
        appendOptimistic,
        removeById,
        confirmOptimistic,
        upsertReceived,
        markDelivered,
        markRead,
        markDeleted,
    };
}