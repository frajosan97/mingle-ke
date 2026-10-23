import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ConversationMessage, MessageAttachment } from "@/types";
import {
    Check,
    CheckCheck,
    ChevronDown,
    Copy,
    Forward,
    Reply,
    Star,
    Trash2,
    FileWarning,
} from "lucide-react";
import { cn } from "@/lib/utils";
import BubbleShell from "@/components/conversation/bubble-shell";
import {
    AudioBubble,
    FileBubble,
    MediaGridBubble,
    StickerBubble,
} from "@/components/conversation/bubbles";

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

type AttachmentWithUrl = MessageAttachment & { url: string };

function hasUsableUrl(a: MessageAttachment): a is AttachmentWithUrl {
    return typeof a.url === "string" && a.url.trim().length > 0;
}

function getAttachmentType(
    a: MessageAttachment,
): "image" | "video" | "audio" | "file" {
    const type = String(a.type ?? "").toLowerCase();
    if (
        type === "image" ||
        type === "video" ||
        type === "audio" ||
        type === "file"
    ) {
        return type;
    }
    const mime = a.mime_type?.toLowerCase() ?? "";
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("video/")) return "video";
    if (mime.startsWith("audio/")) return "audio";
    return "file";
}

function formatFallbackTime(iso?: string | null): string {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
}

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
    } = useMemo(() => {
        const list = [...(message.attachments ?? [])].sort((a, b) => {
            const pos = (a.position ?? 0) - (b.position ?? 0);
            return pos !== 0 ? pos : (a.id ?? 0) - (b.id ?? 0);
        });

        const usable = list.filter(hasUsableUrl);
        const imagesVideos = usable.filter((a) => {
            const t = getAttachmentType(a);
            return t === "image" || t === "video";
        });
        const audios = usable.filter((a) => getAttachmentType(a) === "audio");
        const fileList = usable.filter((a) => getAttachmentType(a) === "file");
        const missing = list.filter((a) => !hasUsableUrl(a));

        const only =
            imagesVideos.length > 0 &&
            !hasBody &&
            audios.length === 0 &&
            fileList.length === 0 &&
            missing.length === 0 &&
            !message.replyTo;

        const sticker =
            only &&
            imagesVideos.length === 1 &&
            Boolean(
                imagesVideos[0].mime_type?.includes("webp") ||
                imagesVideos[0].original_name?.toLowerCase().endsWith(".webp"),
            );

        return {
            withUrl: usable,
            imagesAndVideos: imagesVideos,
            audio: audios,
            files: fileList,
            missingUrl: missing,
            isSticker: sticker,
            onlyMedia: only,
        };
    }, [message.attachments, message.replyTo, hasBody]);

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

    const metaText = message.mine ? "text-white/70" : "text-muted-foreground";
    const timeLabel = message.time || formatFallbackTime(compatible.createdAt);

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
                    <div
                        className={cn(
                            "mb-1.5 rounded-r-md rounded-l-sm border-l-2 px-2 py-1 text-xs",
                            message.mine
                                ? "border-white/60 bg-black/15"
                                : "border-brand-pink bg-brand-pink/10",
                        )}
                    >
                        <p
                            className={cn(
                                "font-semibold",
                                message.mine ? "text-white" : "text-brand-pink",
                            )}
                        >
                            {message.replyTo.author}
                        </p>
                        <p
                            className={cn(
                                "line-clamp-2",
                                message.mine
                                    ? "text-white/80"
                                    : "text-muted-foreground",
                            )}
                        >
                            {message.replyTo.preview}
                        </p>
                    </div>
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
                            <div
                                key={attachment.id}
                                className={cn(
                                    "flex items-center gap-2 rounded-lg p-2 text-xs",
                                    message.mine
                                        ? "bg-black/15 text-white"
                                        : "bg-muted text-muted-foreground",
                                )}
                            >
                                <FileWarning className="h-4 w-4 shrink-0" />
                                <span className="min-w-0 break-words">
                                    {attachment.original_name ?? "Attachment"} —
                                    file URL is missing
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {hasBody && (
                    <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] pr-14">
                        {body}
                    </p>
                )}

                {onlyMedia ? (
                    <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] text-white backdrop-blur-sm">
                        {timeLabel}
                        <Ticks
                            read={message.read}
                            delivered={message.delivered}
                            mine={message.mine}
                            variant="overlay"
                        />
                    </span>
                ) : (
                    <span
                        className={cn(
                            "absolute bottom-1 right-2 flex items-center gap-1 text-[11px] tabular-nums",
                            metaText,
                        )}
                    >
                        {timeLabel}
                        <Ticks
                            read={message.read}
                            delivered={message.delivered}
                            mine={message.mine}
                            variant="inline"
                        />
                    </span>
                )}

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

function Ticks({
    read,
    delivered,
    variant,
    mine,
}: {
    read?: boolean;
    delivered?: boolean;
    variant: "inline" | "overlay";
    mine?: boolean;
}) {
    // Standard Strictness: Never show ticks on received messages
    if (!mine) return null;

    if (variant === "overlay") {
        return read ? (
            <CheckCheck className="h-3 w-3 text-brand-pink" aria-label="Read" />
        ) : delivered ? (
            <CheckCheck
                className="h-3 w-3 text-white/70"
                aria-label="Delivered"
            />
        ) : (
            <Check className="h-3 w-3 text-white/70" aria-label="Sent" />
        );
    }

    return read ? (
        <CheckCheck className="h-3.5 w-3.5 text-brand-pink" aria-label="Read" />
    ) : delivered ? (
        <CheckCheck
            className={cn(
                "h-3.5 w-3.5",
                mine ? "text-white/80" : "text-muted-foreground",
            )}
            aria-label="Delivered"
        />
    ) : (
        <Check
            className={cn(
                "h-3.5 w-3.5",
                mine ? "text-white/80" : "text-muted-foreground",
            )}
            aria-label="Sent"
        />
    );
}

function BubbleMenu({
    menuOpen,
    setMenuOpen,
    menuRef,
    mine,
    onlyMedia,
    onReply,
    onCopy,
    onForward,
    onStar,
    onDelete,
}: {
    menuOpen: boolean;
    setMenuOpen: (value: boolean) => void;
    menuRef: React.RefObject<HTMLDivElement | null>;
    mine?: boolean;
    onlyMedia: boolean;
    onReply: () => void;
    onCopy?: () => void;
    onForward: () => void;
    onStar: () => void;
    onDelete: () => void;
}) {
    return (
        <div ref={menuRef} className="absolute right-1 top-1 z-20">
            <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full transition-opacity duration-200",
                    "opacity-0 group-hover/bubble:opacity-100 focus-visible:opacity-100",
                    mine
                        ? "text-white/80 hover:bg-black/20"
                        : "text-muted-foreground hover:bg-muted",
                    menuOpen && "opacity-100",
                    onlyMedia && "bg-black/40 text-white hover:bg-black/60",
                )}
                aria-label="Message options"
                aria-expanded={menuOpen}
            >
                <ChevronDown className="h-4 w-4" />
            </button>

            {menuOpen && (
                <div
                    className={cn(
                        "absolute top-7 z-50 w-48 overflow-hidden rounded-xl border border-border bg-popover py-1 shadow-lg",
                        mine ? "right-0" : "left-0",
                    )}
                    role="menu"
                >
                    <MenuItem
                        icon={<Reply className="h-4 w-4" />}
                        label="Reply"
                        onClick={onReply}
                    />

                    {onCopy && (
                        <MenuItem
                            icon={<Copy className="h-4 w-4" />}
                            label="Copy"
                            onClick={onCopy}
                        />
                    )}

                    <MenuItem
                        icon={<Forward className="h-4 w-4" />}
                        label="Forward"
                        onClick={onForward}
                    />

                    <MenuItem
                        icon={<Star className="h-4 w-4" />}
                        label="Star message"
                        onClick={onStar}
                    />

                    <MenuItem
                        icon={<Trash2 className="h-4 w-4" />}
                        label="Delete"
                        onClick={onDelete}
                        danger
                    />
                </div>
            )}
        </div>
    );
}

function MenuItem({
    icon,
    label,
    onClick,
    danger,
}: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    danger?: boolean;
}) {
    return (
        <button
            type="button"
            role="menuitem"
            onClick={onClick}
            className={cn(
                "flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-popover-foreground transition-colors hover:bg-accent",
                danger && "text-destructive hover:bg-destructive/10",
            )}
        >
            <span
                className={cn(
                    danger ? "text-destructive" : "text-muted-foreground",
                )}
            >
                {icon}
            </span>
            {label}
        </button>
    );
}
