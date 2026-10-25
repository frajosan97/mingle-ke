
import { useEffect, useRef } from "react";
import { echo } from "@laravel/echo-react";

import type { ConversationMessage } from "@/types";

interface MessageSentEvent {
    message?: ConversationMessage;
    id?: number;
    sender_id?: number | string;
}

interface MessageStatusEvent {
    message_id?: number | string;
    sender_id?: number | string;
    user_id?: number | string;
}

interface MessageDeletedEvent {
    message_id?: number | string;
}

interface RealtimeHandlers {
    onReceived: (message: ConversationMessage) => void;
    onDelivered: (messageId: number) => void;
    onRead: (messageId: number) => void;
    onDeleted: (messageId: number) => void;
}

type EventPayload = Record<string, unknown>;

function asRecord(value: unknown): EventPayload {
    if (value !== null && typeof value === "object") {
        return value as EventPayload;
    }

    return {};
}

function getMessageId(
    value: number | string | undefined | null,
): number | null {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    const id = Number(value);

    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function sameUser(
    first: number | string | null | undefined,
    second: number | string | null | undefined,
): boolean {
    return (
        first !== null &&
        first !== undefined &&
        second !== null &&
        second !== undefined &&
        String(first) === String(second)
    );
}

export function useConversationRealtime(
    conversationId: string | number,
    myUserId: number | null,
    handlers: RealtimeHandlers,
) {
    const handlersRef = useRef(handlers);

    useEffect(() => {
        handlersRef.current = handlers;
    }, [handlers]);

    useEffect(() => {
        if (String(conversationId).trim() === "") {
            return;
        }

        const channelName = `conversation.${conversationId}`;
        const client = echo();
        const channel = client.private(channelName);

        const handleMessageSent = (payload: MessageSentEvent) => {
            const event = asRecord(payload);
            const message = asRecord(event.message ?? payload);

            const messageId = getMessageId(
                message.id as number | string | undefined,
            );

            if (messageId === null) return;

            const senderId = message.sender_id as
                | number
                | string
                | undefined;

            const isMine = sameUser(senderId, myUserId);

            const normalizedMessage = {
                ...message,
                id: messageId,
                mine: isMine,
                ...(isMine
                    ? {}
                    : {
                        read: false,
                        delivered: false,
                    }),
            } as unknown as ConversationMessage;

            handlersRef.current.onReceived(normalizedMessage);

            if (!isMine) {
                const csrfToken = document.querySelector<HTMLMetaElement>(
                    'meta[name="csrf-token"]',
                )?.content;

                void fetch(`/conversations/${conversationId}/delivered`, {
                    method: "POST",
                    credentials: "same-origin",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        "X-Requested-With": "XMLHttpRequest",
                        ...(csrfToken
                            ? { "X-CSRF-TOKEN": csrfToken }
                            : {}),
                    },
                    body: JSON.stringify({
                        message_id: messageId,
                    }),
                })
                    .then((response) => {
                        if (!response.ok) {
                            console.error(
                                "Failed to acknowledge message delivery:",
                                response.status,
                            );
                        }
                    })
                    .catch((error: unknown) => {
                        console.error(
                            "Message delivery acknowledgement failed:",
                            error,
                        );
                    });
            }
        };

        const handleMessageDelivered = (payload: MessageStatusEvent) => {
            const event = asRecord(payload);

            if (
                !sameUser(
                    event.sender_id as number | string | undefined,
                    myUserId,
                )
            ) {
                return;
            }

            const messageId = getMessageId(
                event.message_id as number | string | undefined,
            );

            if (messageId !== null) {
                handlersRef.current.onDelivered(messageId);
            }
        };

        const handleMessageRead = (payload: MessageStatusEvent) => {
            const event = asRecord(payload);

            if (
                !sameUser(
                    event.sender_id as number | string | undefined,
                    myUserId,
                )
            ) {
                return;
            }

            const messageId = getMessageId(
                event.message_id as number | string | undefined,
            );

            if (messageId !== null) {
                handlersRef.current.onRead(messageId);
            }
        };

        const handleMessageDeleted = (payload: MessageDeletedEvent) => {
            const event = asRecord(payload);

            const messageId = getMessageId(
                event.message_id as number | string | undefined,
            );

            if (messageId !== null) {
                handlersRef.current.onDeleted(messageId);
            }
        };

        channel.listen(".MessageSent", handleMessageSent);
        channel.listen(".MessageDelivered", handleMessageDelivered);
        channel.listen(".MessageRead", handleMessageRead);
        channel.listen(".MessageDeleted", handleMessageDeleted);

        return () => {
            channel.stopListening(".MessageSent", handleMessageSent);
            channel.stopListening(
                ".MessageDelivered",
                handleMessageDelivered,
            );
            channel.stopListening(".MessageRead", handleMessageRead);
            channel.stopListening(".MessageDeleted", handleMessageDeleted);

            client.leave(channelName);
        };
    }, [conversationId, myUserId]);
}
