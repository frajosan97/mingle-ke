// resources/js/hooks/conversations/use-conversation-messages.ts
import { useCallback, useEffect, useState } from "react";
import type { ConversationMessage } from "@/types";

export function useConversationMessages(initialMessages: ConversationMessage[]) {
    const [messages, setMessages] = useState<ConversationMessage[]>(initialMessages);

    // Sync when Inertia provides updated props.
    useEffect(() => {
        setMessages(initialMessages);
    }, [initialMessages]);

    const appendOptimistic = useCallback((message: ConversationMessage) => {
        setMessages((prev) => [...prev, message]);
    }, []);

    const removeById = useCallback((id: ConversationMessage["id"]) => {
        setMessages((prev) => prev.filter((m) => m.id !== id));
    }, []);

    const confirmOptimistic = useCallback(
        (tempId: ConversationMessage["id"], serverMessage: any) => {
            setMessages((prev) => {
                const alreadyReceived = prev.some(
                    (m) => String(m.id) === String(serverMessage.id),
                );

                if (alreadyReceived) {
                    return prev.filter((m) => m.id !== tempId);
                }

                return prev.map((m) =>
                    m.id === tempId
                        ? {
                            ...m,
                            id: serverMessage.id,
                            conversation_id:
                                serverMessage.conversation_id ?? m.conversation_id,
                            sender_id: serverMessage.sender_id ?? m.sender_id,
                            content:
                                serverMessage.body ?? serverMessage.content ?? m.content,
                            attachments: serverMessage.attachments ?? m.attachments,
                            time: serverMessage.time ?? m.time,
                            createdAt: serverMessage.created_at ?? m.createdAt,
                        }
                        : m,
                );
            });
        },
        [],
    );

    const upsertReceived = useCallback(
        (incoming: ConversationMessage) => {
            setMessages((prev) => {
                const idx = prev.findIndex(
                    (m) => String(m.id) === String(incoming.id),
                );

                if (idx !== -1) {
                    return prev.map((m, i) =>
                        i === idx
                            ? {
                                ...m,
                                ...incoming,
                                read: m.read ?? false,
                                delivered: m.delivered ?? false,
                            }
                            : m,
                    );
                }

                return [...prev, incoming];
            });
        },
        [],
    );

    const markRead = useCallback((messageId: string | number) => {
        setMessages((prev) =>
            prev.map((m) =>
                String(m.id) === String(messageId)
                    ? { ...m, read: true, delivered: true }
                    : m,
            ),
        );
    }, []);

    const markDeleted = useCallback((messageId: string | number) => {
        setMessages((prev) =>
            prev.map((m) =>
                String(m.id) === String(messageId)
                    ? { ...m, deleted: true, content: null }
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
        markRead,
        markDeleted,
    };
}