// resources/js/hooks/conversations/use-conversation-realtime.ts
import { useCallback } from "react";
import { useEcho } from "@laravel/echo-react";
import axios from "axios";
import type { ConversationMessage } from "@/types";

interface BroadcastMessage {
    id: number | string;
    conversation_id?: number | string;
    sender_id?: number | string;
    body?: string | null;
    content?: string | null;
    type?: ConversationMessage["type"];
    time?: string;
    created_at?: string;
    attachments?: ConversationMessage["attachments"];
}

interface MessageSentEvent {
    message: BroadcastMessage;
}

interface MessageIdEvent {
    message_id?: number | string;
    message?: { id?: number | string };
}

interface Handlers {
    onReceived: (message: ConversationMessage) => void;
    onRead: (messageId: string | number) => void;
    onDeleted: (messageId: string | number) => void;
}

export function useConversationRealtime(
    conversationId: string,
    myUserId: number | null,
    { onReceived, onRead, onDeleted }: Handlers,
) {
    const onMessageSent = useCallback(
        (event: MessageSentEvent) => {
            const message = event.message;
            if (message?.id == null) return;

            const isMine =
                message.sender_id != null &&
                myUserId != null &&
                String(message.sender_id) === String(myUserId);

            onReceived({
                id: message.id,
                conversation_id: message.conversation_id,
                sender_id: message.sender_id,
                content: message.body ?? message.content ?? null,
                time:
                    message.time ??
                    (message.created_at
                        ? new Date(message.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })
                        : ""),
                createdAt: message.created_at,
                mine: isMine,
                read: false,
                delivered: false,
                type: message.type ?? "text",
                attachments: message.attachments ?? [],
            });

            if (!isMine && document.visibilityState === "visible") {
                void axios
                    .post(`/conversations/${conversationId}/delivered`)
                    .then(() => axios.post(`/conversations/${conversationId}/read`))
                    .catch(() => { });
            }
        },
        [conversationId, myUserId, onReceived],
    );

    const onMessageRead = useCallback(
        (event: MessageIdEvent) => {
            const id = event.message_id ?? event.message?.id;
            if (id != null) onRead(id);
        },
        [onRead],
    );

    const onMessageDeleted = useCallback(
        (event: MessageIdEvent) => {
            const id = event.message_id ?? event.message?.id;
            if (id != null) onDeleted(id);
        },
        [onDeleted],
    );

    useEcho(`conversation.${conversationId}`, ".MessageSent", onMessageSent);
    useEcho(`conversation.${conversationId}`, ".MessageRead", onMessageRead);
    useEcho(`conversation.${conversationId}`, ".MessageDeleted", onMessageDeleted);
}