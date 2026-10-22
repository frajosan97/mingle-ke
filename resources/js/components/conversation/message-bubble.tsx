// resources/js/components/conversation/message-bubble.tsx
import { useState, useRef, useEffect, useCallback } from "react";
import type { ConversationMessage } from "@/types";
import {
    Check,
    CheckCheck,
    Trash2,
    FileText,
    ChevronDown,
    Reply,
    Copy,
    Download,
    Forward,
    Star,
    Mic,
    Play,
    Pause,
} from "lucide-react";
import { cn } from "@/lib/utils";
import BubbleShell from "@/components/conversation/bubble-shell";

type Attachment = NonNullable<ConversationMessage["attachments"]>[number];

interface Props {
    message: ConversationMessage;
    onReply?: (message: ConversationMessage) => void;
    onCopy?: (message: ConversationMessage) => void;
    onDelete?: (message: ConversationMessage) => void;
    onForward?: (message: ConversationMessage) => void;
    onStar?: (message: ConversationMessage) => void;
    onDownload?: (attachment: Attachment) => void;
}

export default function MessageBubble({
    message,
    onReply,
    onCopy,
    onDelete,
    onForward,
    onStar,
    onDownload,
}: Props) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!menuOpen) return;
        const handleClick = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [menuOpen]);

    const closeMenu = useCallback(() => setMenuOpen(false), []);

    const handleCopy = () => {
        const text = message.content ?? "";
        if (text) navigator.clipboard?.writeText(text).catch(() => {});
        onCopy?.(message);
        closeMenu();
    };

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

    const attachments = message.attachments ?? [];
    const mediaAttachments = attachments.filter(
        (a) => a.mime.startsWith("image/") || a.mime.startsWith("video/"),
    );
    const audioAttachments = attachments.filter((a) =>
        a.mime.startsWith("audio/"),
    );
    const fileAttachments = attachments.filter(
        (a) =>
            !a.mime.startsWith("image/") &&
            !a.mime.startsWith("video/") &&
            !a.mime.startsWith("audio/"),
    );

    const hasMedia = mediaAttachments.length > 0;
    const onlyMedia =
        hasMedia &&
        !message.content &&
        fileAttachments.length === 0 &&
        audioAttachments.length === 0;
    const isSticker =
        onlyMedia &&
        mediaAttachments.length === 1 &&
        mediaAttachments[0].mime.includes("webp");

    // Colors the tail element used to hardcode now come from tokens.
    const metaText = message.mine ? "text-white/70" : "text-muted-foreground";
    const tickRead = message.mine ? "text-white" : "text-brand-pink";
    const tickDefault = message.mine
        ? "text-white/70"
        : "text-muted-foreground";

    return (
        <div
            className={cn(
                "group relative flex w-full",
                message.mine ? "justify-end" : "justify-start",
            )}
        >
            <BubbleShell
                mine={message.mine}
                bare={onlyMedia}
                className="group/bubble"
            >
                {/* Reply preview — brand-left-bar */}
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

                {hasMedia && (
                    <MediaGrid
                        attachments={mediaAttachments}
                        isSticker={isSticker}
                        onDownload={onDownload}
                    />
                )}

                {audioAttachments.map((att, i) => (
                    <AudioPlayer
                        key={`audio-${i}`}
                        src={att.url}
                        name={att.name}
                        mine={message.mine}
                    />
                ))}

                {fileAttachments.length > 0 && (
                    <div className="mb-1 space-y-1">
                        {fileAttachments.map((att, i) => (
                            <a
                                key={`file-${i}`}
                                href={att.url}
                                target="_blank"
                                rel="noreferrer"
                                download={att.name}
                                className={cn(
                                    "flex items-center gap-2 rounded-lg p-2 transition-colors",
                                    message.mine
                                        ? "bg-black/15 hover:bg-black/25 text-white"
                                        : "bg-muted/60 hover:bg-muted text-foreground",
                                )}
                            >
                                <span
                                    className={cn(
                                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                                        message.mine
                                            ? "bg-white/20 text-white"
                                            : "bg-brand-pink/15 text-brand-pink",
                                    )}
                                >
                                    <FileText className="h-4 w-4" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-xs font-medium">
                                        {att.name}
                                    </span>
                                    {att.size != null && (
                                        <span
                                            className={cn(
                                                "block text-[10px]",
                                                message.mine
                                                    ? "text-white/70"
                                                    : "text-muted-foreground",
                                            )}
                                        >
                                            {formatBytes(att.size)}
                                        </span>
                                    )}
                                </span>
                                <Download className="h-4 w-4 shrink-0 opacity-70" />
                            </a>
                        ))}
                    </div>
                )}

                {message.content && (
                    <div className="flex items-end justify-between gap-2">
                        <p className="whitespace-pre-wrap break-words pr-14">
                            {message.content}
                        </p>
                    </div>
                )}

                {!onlyMedia && (
                    <span
                        className={cn(
                            "absolute bottom-1 right-2 flex items-center gap-1 text-[11px] tabular-nums",
                            metaText,
                        )}
                    >
                        {message.time}
                        {message.mine &&
                            (message.read ? (
                                <CheckCheck
                                    className={cn("h-3.5 w-3.5", tickRead)}
                                />
                            ) : message.delivered ? (
                                <CheckCheck
                                    className={cn("h-3.5 w-3.5", tickDefault)}
                                />
                            ) : (
                                <Check
                                    className={cn("h-3.5 w-3.5", tickDefault)}
                                />
                            ))}
                    </span>
                )}

                {/* Options menu */}
                <div ref={menuRef} className="absolute right-1 top-1 z-20">
                    <button
                        type="button"
                        onClick={() => setMenuOpen((v) => !v)}
                        className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full transition-opacity duration-200",
                            "opacity-0 group-hover/bubble:opacity-100 focus-visible:opacity-100",
                            message.mine
                                ? "text-white/80 hover:bg-black/20"
                                : "text-muted-foreground hover:bg-muted",
                            menuOpen && "opacity-100",
                            onlyMedia &&
                                "bg-black/40 text-white hover:bg-black/60",
                        )}
                        aria-label="Message options"
                    >
                        <ChevronDown className="h-4 w-4" />
                    </button>

                    {menuOpen && (
                        <div
                            className={cn(
                                "absolute top-7 z-50 w-48 overflow-hidden rounded-xl border border-border bg-popover py-1 shadow-lg",
                                message.mine ? "right-0" : "left-0",
                            )}
                        >
                            <MenuButton
                                icon={<Reply className="h-4 w-4" />}
                                label="Reply"
                                onClick={() => {
                                    onReply?.(message);
                                    closeMenu();
                                }}
                            />
                            {message.content && (
                                <MenuButton
                                    icon={<Copy className="h-4 w-4" />}
                                    label="Copy"
                                    onClick={handleCopy}
                                />
                            )}
                            <MenuButton
                                icon={<Forward className="h-4 w-4" />}
                                label="Forward"
                                onClick={() => {
                                    onForward?.(message);
                                    closeMenu();
                                }}
                            />
                            <MenuButton
                                icon={<Star className="h-4 w-4" />}
                                label="Star message"
                                onClick={() => {
                                    onStar?.(message);
                                    closeMenu();
                                }}
                            />
                            <MenuButton
                                icon={<Trash2 className="h-4 w-4" />}
                                label="Delete"
                                danger
                                onClick={() => {
                                    onDelete?.(message);
                                    closeMenu();
                                }}
                            />
                        </div>
                    )}
                </div>

                {onlyMedia && (
                    <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] text-white backdrop-blur-sm">
                        {message.time}
                        {message.mine &&
                            (message.read ? (
                                <CheckCheck className="h-3 w-3 text-white" />
                            ) : message.delivered ? (
                                <CheckCheck className="h-3 w-3 text-white/70" />
                            ) : (
                                <Check className="h-3 w-3 text-white/70" />
                            ))}
                    </span>
                )}
            </BubbleShell>
        </div>
    );
}

/* ----------------------------- Sub-components ----------------------------- */

function MenuButton({
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

function MediaGrid({
    attachments,
    isSticker,
    onDownload,
}: {
    attachments: Attachment[];
    isSticker: boolean;
    onDownload?: (a: Attachment) => void;
}) {
    if (isSticker) {
        const att = attachments[0];
        return (
            <div className="p-1">
                <img
                    src={att.url}
                    alt={att.name}
                    className="h-32 w-32 object-contain"
                />
            </div>
        );
    }

    const count = attachments.length;
    const gridClass = count === 1 ? "grid-cols-1" : "grid-cols-2";

    return (
        <div
            className={cn(
                "mb-1 grid max-w-[320px] gap-0.5 overflow-hidden rounded-lg",
                gridClass,
            )}
        >
            {attachments.slice(0, 4).map((att, i) => {
                const isVideo = att.mime.startsWith("video/");
                const showOverlay = count > 4 && i === 3;
                return (
                    <div
                        key={i}
                        className={cn(
                            "relative bg-black",
                            count === 1
                                ? "max-h-80"
                                : count === 2
                                  ? "aspect-square"
                                  : i === 0
                                    ? "row-span-2 aspect-[1/2]"
                                    : "aspect-square",
                        )}
                    >
                        {isVideo ? (
                            <video
                                src={att.url}
                                controls
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <a
                                href={att.url}
                                target="_blank"
                                rel="noreferrer"
                                className="block h-full w-full"
                            >
                                <img
                                    src={att.url}
                                    alt={att.name}
                                    className="h-full w-full object-cover"
                                />
                            </a>
                        )}

                        {showOverlay && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-2xl font-semibold text-white">
                                +{count - 4}
                            </div>
                        )}

                        {onDownload && !isVideo && (
                            <button
                                type="button"
                                onClick={() => onDownload(att)}
                                className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition group-hover:opacity-100"
                                aria-label={`Download ${att.name}`}
                            >
                                <Download className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function AudioPlayer({
    src,
    name,
    mine,
}: {
    src: string;
    name: string;
    mine: boolean;
}) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    const toggle = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (playing) audio.pause();
        else audio.play().catch(() => {});
    };

    return (
        <div
            className={cn(
                "mb-1 flex min-w-[220px] items-center gap-2 rounded-lg p-2",
                mine ? "bg-black/15" : "bg-muted/60",
            )}
        >
            <audio
                ref={audioRef}
                src={src}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => {
                    setPlaying(false);
                    setProgress(0);
                }}
                onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) =>
                    setDuration(e.currentTarget.duration || 0)
                }
                className="hidden"
            />
            <button
                type="button"
                onClick={toggle}
                aria-label={playing ? "Pause" : "Play"}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-white shadow-glow-pink/30 transition hover:shadow-glow-pink"
            >
                {playing ? (
                    <Pause className="h-4 w-4" />
                ) : (
                    <Play className="h-4 w-4" />
                )}
            </button>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                    <Mic
                        className={cn(
                            "h-3 w-3",
                            mine ? "text-white/70" : "text-muted-foreground",
                        )}
                    />
                    <span
                        className={cn(
                            "truncate text-xs font-medium",
                            mine ? "text-white" : "text-foreground",
                        )}
                    >
                        {name}
                    </span>
                </div>
                <div
                    className={cn(
                        "mt-1 h-1 overflow-hidden rounded-full",
                        mine ? "bg-white/20" : "bg-border",
                    )}
                >
                    <div
                        className="h-full rounded-full bg-gradient-brand transition-[width]"
                        style={{
                            width: duration
                                ? `${(progress / duration) * 100}%`
                                : "0%",
                        }}
                    />
                </div>
            </div>
            <span
                className={cn(
                    "shrink-0 text-[10px] tabular-nums",
                    mine ? "text-white/70" : "text-muted-foreground",
                )}
            >
                {formatDuration(progress)} / {formatDuration(duration)}
            </span>
        </div>
    );
}

/* -------------------------------- Helpers -------------------------------- */

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds: number) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}
