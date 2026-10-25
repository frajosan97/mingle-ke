// resources/js/hooks/conversations/use-send-message.ts

import { useCallback, useRef } from "react";
import axios from "axios";
import type { ConversationMessage, MessageType } from "@/types";
import type { AttachmentCategory } from "@/types/message-input";
import { formatChatTimeFromDate } from "@/lib/conversation/time";

interface Options {
    conversationId: string;
    appendOptimistic: (message: ConversationMessage) => void;
    removeById: (id: ConversationMessage["id"]) => void;
    confirmOptimistic: (
        tempId: ConversationMessage["id"],
        serverMessage: any,
    ) => void;
}

function getMessageType(text: string, files: File[]): MessageType {
    if (files.length === 0) return "text";
    if (text.trim() || files.length > 1) return "mixed";

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
    // Monotonic, collision-free temp IDs: -1, -2, -3 ...
    const tempIdRef = useRef(0);
    const nextTempId = () => --tempIdRef.current;

    return useCallback(
        async (
            text: string,
            files: File[] = [],
            categories: AttachmentCategory[] = [],
        ) => {
            const content = text.trim();
            if (!content && files.length === 0) return;

            const form = new FormData();
            if (content) form.append("body", content);
            files.forEach((file, i) => {
                form.append("attachments[]", file);
                if (categories[i]) {
                    form.append(`categories[${i}]`, categories[i]);
                }
            });

            const tempId = nextTempId();
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
                time: formatChatTimeFromDate(now),
                mine: true,
                read: false,
                delivered: false,
                status: "pending",
                deleted: false,
            });

            try {
                const { data } = await axios.post(
                    `/conversations/${conversationId}/messages`,
                    form,
                );

                const serverMessage = data.message ?? data.data ?? data;
                if (serverMessage?.id == null) {
                    throw new Error("The server did not return a message ID.");
                }

                confirmOptimistic(tempId, serverMessage);
                return serverMessage;
            } catch (err) {
                // Roll back the optimistic message, then rethrow so the
                // caller (`MessageInput.safeSend` → `onError`) can see it.
                // Without this `throw`, the 402 is swallowed and the
                // top-up modal never opens.
                removeById(tempId);
                throw err;
            }
        },
        [conversationId, appendOptimistic, removeById, confirmOptimistic],
    );
}