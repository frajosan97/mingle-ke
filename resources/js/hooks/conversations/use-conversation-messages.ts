// resources/js/hooks/conversations/use-conversation-messages.ts

import { useCallback, useEffect, useState } from "react";
import type { ConversationMessage } from "@/types";

type MessageLike = Partial<ConversationMessage> & {
    id: number | string;
    content?: string | null;
    createdAt?: string | null;
};

function normalizeMessage(raw: MessageLike): ConversationMessage {
    const createdAt = raw.created_at ?? raw.createdAt ?? "";
    const body = raw.body ?? raw.content ?? null;

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
        time:
            raw.time ??
            (createdAt
                ? new Date(createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                })
                : ""),
        mine: raw.mine ?? false,
        read: raw.read ?? false,
        delivered: raw.delivered ?? false,
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

    // Sync from server props (Initial load or Inertia reload)
    // Guarantees we never downgrade a status if a websocket event arrived first
    useEffect(() => {
        setMessages((previous) => {
            const incoming = initialMessages.map((m) =>
                normalizeMessage(m as MessageLike),
            );

            const incomingById = new Map(
                incoming.map((m) => [String(m.id), m]),
            );

            const merged = previous.map((existing) => {
                const server = incomingById.get(String(existing.id));
                if (!server) return existing;

                return {
                    ...server,
                    mine: existing.mine || server.mine,
                    read: existing.read || server.read,
                    delivered: existing.delivered || server.delivered,
                };
            });

            const incomingIds = new Set(incoming.map((m) => String(m.id)));
            const optimistic = previous.filter(
                (m) => Number(m.id) < 0 && !incomingIds.has(String(m.id)),
            );

            const sorted = [...merged, ...optimistic].sort(
                (a, b) =>
                    new Date(a.created_at || 0).getTime() -
                    new Date(b.created_at || 0).getTime(),
            );

            return sorted;
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
            const merged: ConversationMessage = {
                ...existing,
                ...normalized,
                body: normalized.body ?? existing.body ?? null,
                attachments: normalized.attachments?.length
                    ? normalized.attachments
                    : existing.attachments ?? [],
                // Monotonic: never downgrade.
                mine: existing.mine || normalized.mine,
                read: existing.read || normalized.read,
                delivered: existing.delivered || normalized.delivered,
                deleted: existing.deleted || normalized.deleted,
            };

            return previous.map((m, i) => (i === index ? merged : m));
        });
    }, []);

    // STRICT: only update status for messages we sent (!mine check)
    const markDelivered = useCallback((messageId: string | number) => {
        setMessages((previous) =>
            previous.map((m) => {
                if (sameId(m.id, messageId) && m.mine) {
                    return { ...m, delivered: true };
                }
                return m;
            }),
        );
    }, []);

    // STRICT: only update status for messages we sent (!mine check)
    const markRead = useCallback((messageId: string | number) => {
        setMessages((previous) =>
            previous.map((m) => {
                if (sameId(m.id, messageId) && m.mine) {
                    return { ...m, delivered: true, read: true };
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