// resources/js/hooks/conversations/use-send-message.ts
import { useCallback } from "react";
import axios from "axios";
import type { ConversationMessage } from "@/types";

interface Options {
    conversationId: string;
    appendOptimistic: (m: ConversationMessage) => void;
    removeById: (id: ConversationMessage["id"]) => void;
    confirmOptimistic: (tempId: ConversationMessage["id"], serverMessage: any) => void;
}

export function useSendMessage({
    conversationId,
    appendOptimistic,
    removeById,
    confirmOptimistic,
}: Options) {
    return useCallback(
        async (text: string, file?: File) => {
            const content = text.trim();
            if (!content && !file) return;

            const form = new FormData();
            if (content) form.append("body", content);
            if (file) form.append("attachment", file);

            const tempId = -Date.now();

            appendOptimistic({
                id: tempId,
                content: content || null,
                time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
                mine: true,
                read: false,
                delivered: false,
                type: file ? "file" : "text",
                attachments: [],
            });

            try {
                const { data } = await axios.post(
                    `/conversations/${conversationId}/messages`,
                    form,
                );

                const serverMessage = data.message;
                if (serverMessage?.id == null) {
                    throw new Error("The server did not return a message ID.");
                }

                confirmOptimistic(tempId, serverMessage);
            } catch {
                removeById(tempId);
            }
        },
        [conversationId, appendOptimistic, removeById, confirmOptimistic],
    );
}