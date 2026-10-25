// resources/js/components/conversation/message-bubble/index.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ConversationMessage, MessageAttachment } from "@/types";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import BubbleShell from "@/components/conversation/bubble-shell";
import {
    AudioBubble,
    BubbleMenu,
    FileBubble,
    MediaGridBubble,
    MissingAttachmentBubble,
    StickerBubble,
} from "./bubbles";
import ReplyQuote from "./reply-quote";
import MetaFooter from "./meta-footer";
import { classifyAttachments } from "@/lib/conversation/attachment";
import { formatChatTime } from "@/lib/conversation/time";

interface Props {
    message: ConversationMessage;
    onReply?: (message: ConversationMessage) => void;
    onCopy?: (message: ConversationMessage) => void;
    onDelete?: (message: ConversationMessage) => void;
    onForward?: (message: ConversationMessage) => void;
    onStar?: (message: ConversationMessage) => void;
    onDownload?: (attachment: MessageAttachment) => void;
    onMediaClick?: (url: string) => void;
}

type CompatibleMessage = ConversationMessage & {
    content?: string | null;
    createdAt?: string | null;
};

export default function MessageBubble({
    message,
    onReply,
    onCopy,
    onDelete,
    onForward,
    onStar,
    onDownload,
    onMediaClick,
}: Props) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!menuOpen) return;
        const close = (event: MouseEvent) => {
            if (!menuRef.current?.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, [menuOpen]);

    const closeMenu = useCallback(() => setMenuOpen(false), []);

    const compatible = message as CompatibleMessage;
    const body = message.body ?? compatible.content ?? null;
    const hasBody = typeof body === "string" && body.trim().length > 0;

    const {
        withUrl,
        imagesAndVideos,
        audio,
        files,
        missingUrl,
        isSticker,
        onlyMedia,
    } = useMemo(
        () => classifyAttachments(message, hasBody),
        [message, hasBody],
    );

    if (message.deleted) {
        return (
            <div
                className={cn(
                    "flex w-full",
                    message.mine ? "justify-end" : "justify-start",
                )}
            >
                <div className="flex items-center gap-2 rounded-2xl border border-dashed border-border bg-muted/40 px-3 py-2 text-sm italic text-muted-foreground">
                    <Trash2 className="h-4 w-4" />
                    <span>This message was deleted</span>
                </div>
            </div>
        );
    }

    if (
        !hasBody &&
        withUrl.length === 0 &&
        missingUrl.length === 0 &&
        !message.replyTo
    ) {
        return null;
    }

    const timeLabel = message.time || formatChatTime(compatible.createdAt);

    const handleCopy = () => {
        if (!hasBody || body == null) return;
        void navigator.clipboard?.writeText(body).catch(() => {});
        onCopy?.(message);
        closeMenu();
    };

    return (
        <div
            className={cn(
                "group relative flex w-full",
                message.mine ? "justify-end" : "justify-start",
            )}
        >
            <BubbleShell
                mine={message.mine ?? false}
                bare={onlyMedia}
                className="group/bubble"
            >
                {message.replyTo && (
                    <ReplyQuote
                        author={message.replyTo.author}
                        preview={message.replyTo.preview}
                        mine={message.mine}
                    />
                )}

                {imagesAndVideos.length > 0 &&
                    (isSticker ? (
                        <StickerBubble
                            attachment={imagesAndVideos[0]}
                            onMediaClick={onMediaClick}
                        />
                    ) : (
                        <MediaGridBubble
                            attachments={imagesAndVideos}
                            onDownload={onDownload}
                            onMediaClick={onMediaClick}
                        />
                    ))}

                {audio.map((attachment) => (
                    <AudioBubble
                        key={attachment.id}
                        attachment={attachment}
                        mine={message.mine}
                    />
                ))}

                {files.length > 0 && (
                    <div className="mb-1 min-w-0 space-y-1">
                        {files.map((attachment) => (
                            <FileBubble
                                key={attachment.id}
                                attachment={attachment}
                                mine={message.mine}
                                onDownload={onDownload}
                            />
                        ))}
                    </div>
                )}

                {missingUrl.length > 0 && (
                    <div className="mb-1 space-y-1">
                        {missingUrl.map((attachment) => (
                            <MissingAttachmentBubble
                                key={attachment.id}
                                attachment={attachment}
                                mine={message.mine}
                            />
                        ))}
                    </div>
                )}

                {hasBody && (
                    <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] pr-14 mb-3">
                        {body}
                    </p>
                )}

                <MetaFooter
                    timeLabel={timeLabel}
                    status={message.status}
                    read={message.read}
                    delivered={message.delivered}
                    mine={message.mine}
                    onlyMedia={onlyMedia}
                />

                <BubbleMenu
                    menuOpen={menuOpen}
                    setMenuOpen={setMenuOpen}
                    menuRef={menuRef}
                    mine={message.mine}
                    onlyMedia={onlyMedia}
                    onReply={() => {
                        onReply?.(message);
                        closeMenu();
                    }}
                    onCopy={hasBody ? handleCopy : undefined}
                    onForward={() => {
                        onForward?.(message);
                        closeMenu();
                    }}
                    onStar={() => {
                        onStar?.(message);
                        closeMenu();
                    }}
                    onDelete={() => {
                        onDelete?.(message);
                        closeMenu();
                    }}
                />
            </BubbleShell>
        </div>
    );
}
