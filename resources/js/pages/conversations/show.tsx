import { useCallback } from "react";
import { Head } from "@inertiajs/react";
import type { ConversationMessage } from "@/types";
import { useAppOnlineStatus } from "@/hooks/use-app-online-status";
import { useConversationMessages } from "@/hooks/conversations/use-conversation-messages";
import { usePresenceChannel } from "@/hooks/conversations/use-presence-channel";
import { useConversationRealtime } from "@/hooks/conversations/use-conversation-realtime";
import { useSendMessage } from "@/hooks/conversations/use-send-message";
import { useMarkMessagesRead } from "@/hooks/conversations/use-mark-messages";
import ConversationHeader from "@/components/conversation/conversation-header";
import MessageInput from "@/components/conversation/message-input";
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

    // Global online status comes from AppLayout.
    const { isUserOnline, getLastSeen } = useAppOnlineStatus();

    const isOnline =
        otherUserId != null && String(otherUserId) !== String(myUserId)
            ? isUserOnline(otherUserId)
            : false;

    const lastSeen = isOnline
        ? null
        : (getLastSeen(otherUserId) ?? otherLastSeen ?? null);

    // Realtime message events only.
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

    const handleSend = useCallback(
        (text: string, files: File[] = []) => {
            return sendMessage(text, files);
        },
        [sendMessage],
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
                    <MessageInput onSend={handleSend} onTyping={handleTyping} />
                </div>
            </div>
        </>
    );
}
