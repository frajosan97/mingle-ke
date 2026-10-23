// resources/js/components/conversation/message-list.tsx

import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import type { ConversationMessage } from "@/types";
import MessageBubble from "@/components/conversation/message-bubble";
import TypingIndicator from "@/components/conversation/typing-indicator";
import MediaViewer, {
    type MediaItem,
} from "@/components/conversation/media-viewer";
import {
    isOpenable,
    toMediaItem,
} from "@/components/conversation/media-helpers";

interface Props {
    messages: ConversationMessage[];
    typingUser: string | null;
}

export default function MessageList({ messages, typingUser }: Props) {
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const shouldFollowRef = useRef(true);
    const previousCountRef = useRef(messages.length);

    const [viewerOpen, setViewerOpen] = useState(false);
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

    const allMedia: MediaItem[] = messages.flatMap(
        (m) => m.attachments?.filter(isOpenable).map(toMediaItem) ?? [],
    );

    const handleMediaClick = useCallback((url: string) => {
        setSelectedUrl(url);
        setViewerOpen(true);
    }, []);

    const scrollToBottom = useCallback(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, []);

    const handleScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        shouldFollowRef.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    }, []);

    useLayoutEffect(() => scrollToBottom(), [scrollToBottom]);

    useLayoutEffect(() => {
        const arrived = messages.length > previousCountRef.current;
        previousCountRef.current = messages.length;
        if (shouldFollowRef.current || arrived) scrollToBottom();
    }, [messages, scrollToBottom]);

    useEffect(() => {
        if (shouldFollowRef.current) scrollToBottom();
    }, [typingUser, scrollToBottom]);

    const selectedIndex = selectedUrl
        ? allMedia.findIndex((m) => m.url === selectedUrl)
        : -1;
    const selectedMedia = selectedIndex >= 0 ? allMedia[selectedIndex] : null;

    return (
        <>
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="h-full min-h-0 overflow-y-auto overscroll-y-contain px-3 py-4 md:px-8 lg:px-16"
            >
                <div className="mx-auto flex max-w-3xl flex-col gap-2">
                    {messages.map((message) => (
                        <MessageBubble
                            key={message.id}
                            message={message}
                            onMediaClick={handleMediaClick}
                        />
                    ))}
                    {typingUser && <TypingIndicator name={typingUser} />}
                </div>
            </div>

            <MediaViewer
                isOpen={viewerOpen}
                onClose={() => setViewerOpen(false)}
                media={selectedMedia}
                allMedia={allMedia}
                currentIndex={Math.max(0, selectedIndex)}
                onNavigate={(idx) => setSelectedUrl(allMedia[idx]?.url ?? null)}
            />
        </>
    );
}
