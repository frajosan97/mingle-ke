// resources/js/pages/conversations/show.tsx
import { useCallback } from "react";
import { Head } from "@inertiajs/react";

import type { ConversationMessage } from "@/types";
import ConversationHeader from "@/components/conversation/conversation-header";
import MessageInput from "@/components/conversation/message-input";
import MessageList from "@/components/conversation/message-list";

import { useConversationMessages } from "@/hooks/conversations/use-conversation-messages";
import { usePresenceChannel } from "@/hooks/conversations/use-presence-channel";
import { useConversationRealtime } from "@/hooks/conversations/use-conversation-realtime";
import { useSendMessage } from "@/hooks/conversations/use-send-message";
import { useMarkMessagesRead } from "@/hooks/conversations/use-mark-messages";

interface Props {
    id: string;
    name: string;
    avatarUrl?: string | null;
    otherUserId?: number;
    otherLastSeen?: string | null;
    otherVerified?: boolean;
    messages: ConversationMessage[];
}

export default function ConversationShow({
    id,
    name,
    avatarUrl,
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
        markRead,
        markDeleted,
    } = useConversationMessages(initialMessages);

    const { channel, onlineUsers, typingUser } = usePresenceChannel(id);

    useConversationRealtime(id, myUserId, {
        onReceived: upsertReceived,
        onRead: markRead,
        onDeleted: markDeleted,
    });

    const sendMessage = useSendMessage({
        conversationId: id,
        appendOptimistic,
        removeById,
        confirmOptimistic,
    });

    const handleSend = useCallback(
        (text: string, files: File[] = [], audioBlob?: Blob) => {
            let attachment: File | undefined = files[0];

            if (audioBlob && audioBlob.size > 0) {
                const mimeType = audioBlob.type || "audio/webm";

                const extension = mimeType.includes("mp4")
                    ? "m4a"
                    : mimeType.includes("ogg")
                      ? "ogg"
                      : "webm";

                attachment = new File(
                    [audioBlob],
                    `voice-message.${extension}`,
                    { type: mimeType },
                );
            }

            sendMessage(text, attachment);
        },
        [sendMessage],
    );

    useMarkMessagesRead(id);

    const handleTyping = useCallback(() => {
        const currentChannel = channel();

        if (!currentChannel || !window.__authUserName) return;

        currentChannel.whisper("typing", {
            name: window.__authUserName,
        });
    }, [channel]);

    const isOnline = onlineUsers.some(
        (user) => myUserId != null && String(user.id) !== String(myUserId),
    );

    return (
        <>
            <Head title={`Conversation · ${name}`} />

            <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-background">
                {/* Ambient brand glow — subtle, non-intrusive */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="orb orb-pink absolute -top-24 left-1/4 h-96 w-96 opacity-[0.07]" />
                    <div className="orb orb-orange absolute -bottom-24 right-1/4 h-80 w-80 opacity-[0.06]" />
                </div>

                {/* Header: floats above the ambient layer */}
                <div className="relative z-10 shrink-0 border-b border-border/60 bg-card/70 backdrop-blur-md">
                    <ConversationHeader
                        name={name}
                        avatarUrl={avatarUrl}
                        online={isOnline}
                        typingUser={typingUser}
                        verified={otherVerified}
                    />
                </div>

                {/* Messages scroll region */}
                <div className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-thin">
                    <MessageList messages={messages} typingUser={typingUser} />
                </div>

                {/* Composer: sticky bottom, glassy on the brand surface */}
                <div className="relative z-10 shrink-0 border-t border-border/60 bg-card/70 backdrop-blur-md">
                    <MessageInput onSend={handleSend} onTyping={handleTyping} />
                </div>
            </div>
        </>
    );
}
