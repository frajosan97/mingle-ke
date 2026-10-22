// resources/js/components/conversation/message-list.tsx
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import type { ConversationMessage } from "@/types";
import MessageBubble from "@/components/conversation/message-bubble";
import TypingIndicator from "@/components/conversation/typing-indicator";

interface Props {
    messages: ConversationMessage[];
    typingUser: string | null;
}

export default function MessageList({ messages, typingUser }: Props) {
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const shouldFollowRef = useRef(true);
    const previousMessageCountRef = useRef(messages.length);

    const scrollToBottom = useCallback(() => {
        const container = scrollRef.current;
        if (!container) return;
        container.scrollTop = container.scrollHeight;
    }, []);

    const handleScroll = useCallback(() => {
        const container = scrollRef.current;
        if (!container) return;
        const distanceFromBottom =
            container.scrollHeight -
            container.scrollTop -
            container.clientHeight;
        shouldFollowRef.current = distanceFromBottom < 100;
    }, []);

    useLayoutEffect(() => {
        scrollToBottom();
    }, [scrollToBottom]);

    useLayoutEffect(() => {
        const newMessageArrived =
            messages.length > previousMessageCountRef.current;
        previousMessageCountRef.current = messages.length;
        if (shouldFollowRef.current || newMessageArrived) {
            scrollToBottom();
        }
    }, [messages, scrollToBottom]);

    useEffect(() => {
        if (shouldFollowRef.current) scrollToBottom();
    }, [typingUser, scrollToBottom]);

    return (
        <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="h-full min-h-0 overflow-y-auto overscroll-y-contain px-3 py-4 md:px-8 lg:px-16"
        >
            <div className="mx-auto flex max-w-3xl flex-col gap-2">
                {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                ))}

                {typingUser && <TypingIndicator name={typingUser} />}

                <div ref={bottomRef} aria-hidden="true" />
            </div>
        </div>
    );
}
