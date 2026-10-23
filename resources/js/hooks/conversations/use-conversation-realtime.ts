// resources/js/hooks/conversations/use-conversation-realtime.ts

import { useCallback, useRef } from "react";
import axios from "axios";
import { useEcho } from "@laravel/echo-react";
import type { ConversationMessage } from "@/types";

interface BroadcastMessage {
    id: number | string;
    conversation_id?: number | string;
    sender_id?: number | string;
    sender_name?: string;
    body?: string | null;
    content?: string | null;
    type?: ConversationMessage["type"];
    time?: string;
    created_at?: string;
    createdAt?: string;
    attachments?: ConversationMessage["attachments"];
    read?: boolean;
    delivered?: boolean;
    deleted?: boolean;
    mine?: boolean;
}

interface MessageSentEvent {
    message?: BroadcastMessage;
}

interface StatusEvent {
    message_id?: number | string;
    sender_id?: number | string;
    user_id?: number | string;
}

interface Handlers {
    onReceived: (message: ConversationMessage) => void;
    onRead: (messageId: string | number) => void;
    onDelivered: (messageId: string | number) => void;
    onDeleted: (messageId: string | number) => void;
}

export function useConversationRealtime(
    conversationId: string,
    myUserId: number | null,
    { onReceived, onRead, onDelivered, onDeleted }: Handlers,
) {
    const deliveryRequestInProgress = useRef(false);
    const deliveryRequestPending = useRef(false);

    const acknowledgeDelivery = useCallback(async () => {
        if (deliveryRequestInProgress.current) {
            deliveryRequestPending.current = true;
            return;
        }
        deliveryRequestInProgress.current = true;
        try {
            do {
                deliveryRequestPending.current = false;
                await axios.post(`/conversations/${conversationId}/delivered`);
            } while (deliveryRequestPending.current);
        } catch (error) {
            console.error("Failed to acknowledge delivery:", error);
        } finally {
            deliveryRequestInProgress.current = false;
        }
    }, [conversationId]);

    const onMessageSent = useCallback(
        (event: MessageSentEvent) => {
            const message = event?.message;
            if (message?.id == null) return;

            const senderId =
                message.sender_id == null ? null : Number(message.sender_id);

            const isMine =
                senderId !== null &&
                myUserId !== null &&
                senderId === myUserId;

            const createdAt = message.created_at ?? message.createdAt ?? "";
            const body = message.body ?? message.content ?? null;

            onReceived({
                ...message,
                id: message.id,
                conversation_id: Number(message.conversation_id ?? conversationId),
                sender_id: senderId ?? 0,
                sender_name: message.sender_name ?? "Unknown",
                body,
                type: message.type ?? (body ? "text" : "file"),
                attachments: message.attachments ?? [],
                time:
                    message.time ??
                    (createdAt
                        ? new Date(createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })
                        : ""),
                created_at: createdAt,
                mine: isMine,
                read: false,
                delivered: isMine,
                deleted: false,
            } as ConversationMessage);

            if (!isMine) {
                void acknowledgeDelivery();
            }
        },
        [conversationId, myUserId, onReceived, acknowledgeDelivery],
    );

    const onMessageDelivered = useCallback(
        (event: StatusEvent) => {
            if (event?.message_id == null || myUserId == null) return;
            // The event must originate from a message WE sent
            if (Number(event.sender_id) !== myUserId) return;
            // Ignore our own receipts
            if (Number(event.user_id) === myUserId) return;

            onDelivered(event.message_id);
        },
        [myUserId, onDelivered],
    );

    const onMessageRead = useCallback(
        (event: StatusEvent) => {
            if (event?.message_id == null || myUserId == null) return;
            // The event must originate from a message WE sent
            if (Number(event.sender_id) !== myUserId) return;
            // Ignore our own receipts
            if (Number(event.user_id) === myUserId) return;

            onRead(event.message_id);
        },
        [myUserId, onRead],
    );

    const onMessageDeleted = useCallback(
        (event: StatusEvent) => {
            if (event?.message_id != null) onDeleted(event.message_id);
        },
        [onDeleted],
    );

    useEcho(`conversation.${conversationId}`, ".MessageSent", onMessageSent);
    useEcho(`conversation.${conversationId}`, ".MessageDelivered", onMessageDelivered);
    useEcho(`conversation.${conversationId}`, ".MessageRead", onMessageRead);
    useEcho(`conversation.${conversationId}`, ".MessageDeleted", onMessageDeleted);
}