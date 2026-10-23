// resources/js/hooks/conversations/use-send-message.ts

import { useCallback } from "react";
import axios from "axios";
import type { ConversationMessage, MessageType } from "@/types";

interface Options {
    conversationId: string;
    appendOptimistic: (message: ConversationMessage) => void;
    removeById: (id: ConversationMessage["id"]) => void;
    confirmOptimistic: (
        tempId: ConversationMessage["id"],
        serverMessage: any,
    ) => void;
}

function getMessageType(
    text: string,
    files: File[],
): MessageType {
    if (files.length === 0) {
        return "text";
    }

    if (text.trim() || files.length > 1) {
        return "mixed";
    }

    const mimeType = files[0].type;

    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";

    return "file";
}

export function useSendMessage({
    conversationId,
    appendOptimistic,
    removeById,
    confirmOptimistic,
}: Options) {
    return useCallback(
        async (text: string, files: File[] = []) => {
            const content = text.trim();

            if (!content && files.length === 0) {
                return;
            }

            const form = new FormData();

            if (content) {
                form.append("body", content);
            }

            // Send every attachment using Laravel's array field.
            files.forEach((file) => {
                form.append("attachments[]", file);
            });

            const tempId = -Date.now();
            const now = new Date();

            appendOptimistic({
                id: tempId,
                conversation_id: Number(conversationId),
                sender_id: window.__authUserId ?? 0,
                sender_name: window.__authUserName ?? "You",
                body: content || null,
                type: getMessageType(content, files),
                attachments: [],
                created_at: now.toISOString(),
                time: now.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
                mine: true,
                read: false,
                delivered: false,
                deleted: false,
            });

            try {
                const { data } = await axios.post(
                    `/conversations/${conversationId}/messages`,
                    form,
                );

                const serverMessage =
                    data.message ?? data.data ?? data;

                if (serverMessage?.id == null) {
                    throw new Error(
                        "The server did not return a message ID.",
                    );
                }

                confirmOptimistic(tempId, serverMessage);
            } catch (error) {
                removeById(tempId);

                console.error("Failed to send message:", error);
            }
        },
        [
            conversationId,
            appendOptimistic,
            removeById,
            confirmOptimistic,
        ],
    );
}