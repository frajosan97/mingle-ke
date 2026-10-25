// resources/js/pages/conversations/show.tsx
import { useCallback, useState } from "react";
import { Head } from "@inertiajs/react";
import type { ConversationMessage } from "@/types";
import type { AttachmentCategory } from "@/types/message-input";
import { useAppOnlineStatus } from "@/hooks/use-app-online-status";
import { useConversationMessages } from "@/hooks/conversations/use-conversation-messages";
import { usePresenceChannel } from "@/hooks/conversations/use-presence-channel";
import { useConversationRealtime } from "@/hooks/conversations/use-conversation-realtime";
import { useSendMessage } from "@/hooks/conversations/use-send-message";
import { useMarkMessagesRead } from "@/hooks/conversations/use-mark-messages";
import { useCoins } from "@/contexts/coins-context";
import ConversationHeader from "@/components/conversation/conversation-header";
import MessageInput, {
    type SendError,
} from "@/components/conversation/message-input";
import MessageList from "@/components/conversation/message-list";

interface Props {
    id: string;
    name: string;
    avatarUrl?: string | null;
    otherUserId?: number | string | null;
    otherLastSeen?: string | null;
    otherVerified?: boolean;
    messages: ConversationMessage[];
}

export default function ConversationShow({
    id,
    name,
    avatarUrl,
    otherUserId,
    otherLastSeen,
    otherVerified,
    messages: initialMessages,
}: Props) {
    const myUserId = window.__authUserId ?? null;

    const {
        messages,
        appendOptimistic,
        removeById,
        confirmOptimistic,
        upsertReceived,
        markDelivered,
        markRead,
        markDeleted,
    } = useConversationMessages(initialMessages);

    const { isUserOnline, getLastSeen } = useAppOnlineStatus();

    const isOnline =
        otherUserId != null && String(otherUserId) !== String(myUserId)
            ? isUserOnline(otherUserId)
            : false;

    const lastSeen = isOnline
        ? null
        : (getLastSeen(otherUserId) ?? otherLastSeen ?? null);

    useConversationRealtime(id, myUserId, {
        onReceived: upsertReceived,
        onDelivered: markDelivered,
        onRead: markRead,
        onDeleted: markDeleted,
    });

    const { channel, typingUser } = usePresenceChannel(id);

    const sendMessage = useSendMessage({
        conversationId: id,
        appendOptimistic,
        removeById,
        confirmOptimistic,
    });

    const { promptTopUp } = useCoins();

    /**
     * Cheap local guard against double-submit. Even without coins this
     * is worth having — with coins it prevents a double charge.
     */
    const [sending, setSending] = useState(false);

    const handleSend = useCallback(
        async (
            text: string,
            files: File[] = [],
            categories: AttachmentCategory[] = [],
        ) => {
            if (sending) return;
            setSending(true);
            try {
                await sendMessage(text, files, categories);
            } finally {
                setSending(false);
            }
        },
        [sendMessage, sending],
    );

    /**
     * Central 402 handler. `sendMessage` (via axios) throws on error;
     * if the status is 402 + INSUFFICIENT_COINS we open the modal;
     * anything else we surface in console so it isn't silent.
     */
    const handleSendError = useCallback(
        (error: SendError) => {
            if (
                error.status === 402 &&
                error.code === "INSUFFICIENT_COINS" &&
                typeof error.required === "number" &&
                typeof error.available === "number"
            ) {
                promptTopUp({
                    required: error.required,
                    available: error.available,
                });
                return;
            }
            // Non-coin failures: log so nothing is silently swallowed.
            // Swap for your toast system when one exists.
            console.error("Message send failed:", error);
        },
        [promptTopUp],
    );

    useMarkMessagesRead(id);

    const handleTyping = useCallback(() => {
        const currentChannel = channel();

        if (!currentChannel || !window.__authUserName) {
            return;
        }

        currentChannel.whisper("typing", {
            name: window.__authUserName,
        });
    }, [channel]);

    return (
        <>
            <Head title={`Conversation · ${name}`} />

            <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-background">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="orb orb-pink absolute -top-24 left-1/4 h-96 w-96 opacity-[0.07]" />
                    <div className="orb orb-orange absolute -bottom-24 right-1/4 h-80 w-80 opacity-[0.06]" />
                </div>

                <div className="relative z-10 shrink-0 border-b border-border/60 bg-card/70 backdrop-blur-md">
                    <ConversationHeader
                        name={name}
                        avatarUrl={avatarUrl}
                        online={isOnline}
                        typingUser={typingUser}
                        verified={otherVerified}
                        lastSeen={lastSeen}
                    />
                </div>

                <div className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-thin">
                    <MessageList messages={messages} typingUser={typingUser} />
                </div>

                <div className="relative z-10 shrink-0 border-t border-border/60 bg-card/70 backdrop-blur-md">
                    <MessageInput
                        onSend={handleSend}
                        onError={handleSendError}
                        onTyping={handleTyping}
                        disabled={sending}
                    />
                </div>
            </div>
        </>
    );
}
