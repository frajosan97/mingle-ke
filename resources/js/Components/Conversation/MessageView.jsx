// resources/js/Components/Conversation/MessageView.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Spinner, Image, Modal, Button } from "react-bootstrap";
import {
    FiClock,
    FiCheck,
    FiCheckCircle,
    FiAlertCircle,
    FiFile,
    FiMusic,
    FiVideo,
    FiDownload,
} from "react-icons/fi";
import {
    formatMessageTime,
    formatDayLabel,
    formatLastSeen,
    isOnline,
} from "@/Helpers/Functions";

import MessageHeader from "./MessageHeader";
import MessageComposer from "./MessageComposer";
import MediaViewer from "./MediaViewer";

/* ────────────────────────────────────────────────
 |  Tick icons
 * ──────────────────────────────────────────────── */
const STATUS_ICON = {
    sending: FiClock,
    sent: FiCheck,
    delivered: FiCheckCircle,
    read: FiCheckCircle,
    failed: FiAlertCircle,
};

const STATUS_CLASS = {
    sending: "",
    sent: "",
    delivered: "",
    read: "text-info",
    failed: "text-danger",
};

/* ────────────────────────────────────────────────
 |  Helpers
 * ──────────────────────────────────────────────── */

const isBlobUrl = (url) => typeof url === "string" && url.startsWith("blob:");

const resolveAttachmentUrl = (attachment) => {
    if (!attachment) return null;
    if (isBlobUrl(attachment)) return attachment;
    if (attachment.startsWith("http")) return attachment;
    if (attachment.startsWith("/")) return attachment;
    return `/storage/${attachment}`;
};

const inferType = (msg) => {
    if (msg.type) return msg.type;
    const att = msg.attachment;
    if (!att) return "text";
    if (/\.(jpe?g|png|gif|webp|avif)$/i.test(att)) return "image";
    if (/\.(mp3|wav|ogg|m4a)$/i.test(att)) return "audio";
    if (/\.(mp4|webm|mov)$/i.test(att)) return "video";
    return "file";
};

const fileNameFromUrl = (url, fallback = "attachment") => {
    if (!url) return fallback;
    try {
        const clean = url.split("?")[0].split("#")[0];
        const parts = clean.split("/");
        return decodeURIComponent(parts[parts.length - 1]) || fallback;
    } catch {
        return fallback;
    }
};

const triggerDownload = (url, filename) => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || fileNameFromUrl(url);
    a.rel = "noopener";
    if (!url.startsWith(window.location.origin) && !url.startsWith("/")) {
        a.target = "_blank";
    }
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

const groupByDay = (messages) => {
    const groups = [];
    let current = null;
    for (const m of messages) {
        const label =
            formatDayLabel(m.created_at) ||
            (m.__optimistic ? "Today" : "Earlier");
        if (!current || current.label !== label) {
            current = { label, items: [] };
            groups.push(current);
        }
        current.items.push(m);
    }
    return groups;
};

const tickStatusFor = (msg, currentUserId, otherUserId) => {
    if (msg.__optimistic) return msg.status ?? "sending";
    if (msg.sender_id !== currentUserId) return null;

    const readByOther =
        otherUserId != null &&
        (msg.reads ?? []).some((r) => r.user_id === otherUserId);

    if (readByOther) return "read";
    if (msg.delivered_at) return "delivered";
    return "sent";
};

/* ────────────────────────────────────────────────
 |  Attachment block
 * ──────────────────────────────────────────────── */

function AttachmentBlock({ type, attachment, own, onOpenMedia, messageId }) {
    const url = resolveAttachmentUrl(attachment);
    if (!url) return null;

    const filename = fileNameFromUrl(url);

    // ── Image → thumbnail, click opens viewer ──
    if (type === "image") {
        return (
            <button
                type="button"
                onClick={() =>
                    onOpenMedia?.({ type: "image", url, filename, messageId })
                }
                className="p-0 border-0 bg-transparent d-block message-bubble-media"
                aria-label="View image"
            >
                <Image
                    src={url}
                    fluid
                    rounded
                    className="message-bubble-image"
                    style={{
                        maxWidth: 260,
                        maxHeight: 320,
                        objectFit: "cover",
                        cursor: "zoom-in",
                    }}
                />
            </button>
        );
    }

    // ── Video → poster with play overlay, click opens viewer ──
    if (type === "video") {
        return (
            <button
                type="button"
                onClick={() =>
                    onOpenMedia?.({ type: "video", url, filename, messageId })
                }
                className="p-0 border-0 bg-transparent d-block position-relative message-bubble-media"
                aria-label="Play video"
            >
                <video
                    src={url}
                    muted
                    playsInline
                    preload="metadata"
                    style={{
                        maxWidth: 260,
                        maxHeight: 320,
                        borderRadius: 8,
                        objectFit: "cover",
                        display: "block",
                    }}
                />
                <span
                    className="position-absolute top-50 start-50 translate-middle d-inline-flex align-items-center justify-content-center rounded-circle bg-dark bg-opacity-75 text-white"
                    style={{ width: 44, height: 44 }}
                    aria-hidden="true"
                >
                    <FiVideo size={20} />
                </span>
            </button>
        );
    }

    // ── Audio / file → pill with download icon ──
    const Icon = type === "audio" ? FiMusic : FiFile;

    return (
        <div
            className={`d-flex align-items-center gap-2 mb-1 message-bubble-attachment ${
                own ? "text-white" : "text-body"
            }`}
        >
            <span
                className={`d-inline-flex align-items-center justify-content-center rounded ${
                    own ? "bg-white bg-opacity-25" : "bg-secondary-subtle"
                }`}
                style={{ width: 36, height: 36 }}
            >
                <Icon size={18} aria-hidden="true" />
            </span>

            <span className="flex-grow-1 overflow-hidden">
                <span className="d-block small fw-semibold text-truncate">
                    {filename}
                </span>
                <span
                    className={`d-block small ${
                        own ? "text-white-50" : "text-muted"
                    }`}
                >
                    Click to download
                </span>
            </span>

            <button
                type="button"
                onClick={() => triggerDownload(url, filename)}
                className={`btn btn-sm d-inline-flex align-items-center justify-content-center border-0 rounded-circle ${
                    own ? "text-white" : "text-body"
                }`}
                style={{ width: 32, height: 32 }}
                aria-label={`Download ${filename}`}
                title="Download"
            >
                <FiDownload size={16} />
            </button>
        </div>
    );
}

/* ────────────────────────────────────────────────
 |  Message bubble
 * ──────────────────────────────────────────────── */

function MessageBubble({
    message,
    text,
    time,
    own = false,
    type = "text",
    attachment = null,
    status = "sent",
    uploadPct,
    onOpenMedia,
}) {
    const StatusIcon = STATUS_ICON[status] ?? FiCheck;
    const statusClass = STATUS_CLASS[status] ?? "";

    return (
        <div
            className={`d-flex mb-1 ${
                own ? "justify-content-end" : "justify-content-start"
            }`}
        >
            <div
                className={`p-2 px-3 rounded-3 shadow-sm message-bubble ${
                    own ? "message-bubble-own" : "message-bubble-other"
                }`}
                style={{ maxWidth: "70%" }}
            >
                {attachment && (
                    <AttachmentBlock
                        type={type}
                        attachment={attachment}
                        own={own}
                        messageId={message?.id}
                        onOpenMedia={onOpenMedia}
                    />
                )}

                {text && <div className="text-break">{text}</div>}

                {typeof uploadPct === "number" &&
                    uploadPct > 0 &&
                    uploadPct < 100 && (
                        <div className="small mt-1">
                            <div className="progress" style={{ height: 4 }}>
                                <div
                                    className="progress-bar"
                                    style={{ width: `${uploadPct}%` }}
                                />
                            </div>
                            <span
                                className={`small ${
                                    own ? "text-white-50" : "text-muted"
                                }`}
                            >
                                {uploadPct}%
                            </span>
                        </div>
                    )}

                <div
                    className={`d-flex align-items-center justify-content-end gap-1 mt-1 small ${
                        own ? "text-white-50" : "text-muted"
                    }`}
                >
                    <span>{time}</span>
                    {own && (
                        <StatusIcon
                            size={14}
                            className={statusClass}
                            aria-hidden="true"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

/* ────────────────────────────────────────────────
 |  Confirm dialog
 * ──────────────────────────────────────────────── */

function ConfirmDialog({
    show,
    title,
    body,
    confirmLabel = "Confirm",
    variant = "primary",
    onConfirm,
    onCancel,
}) {
    return (
        <Modal show={show} onHide={onCancel} centered>
            <Modal.Header closeButton>
                <Modal.Title className="fs-6">{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="small">{body}</Modal.Body>
            <Modal.Footer>
                <Button variant="light" size="sm" onClick={onCancel}>
                    Cancel
                </Button>
                <Button variant={variant} size="sm" onClick={onConfirm}>
                    {confirmLabel}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

/* ────────────────────────────────────────────────
 |  Main
 * ──────────────────────────────────────────────── */

export default function MessageView({
    conversation,
    messages = [],
    loading = false,
    currentUserId,
    onSend,
    onBack,
    onTyping,
    onStopTyping,
    typingNames = [],
    isAnyoneTyping = false,
    onlineUsers = {},
    // Chat header actions
    onClose,
    onClear,
    onDelete,
    onMute,
    onBlock,
    isMuted: isMutedProp = false,
    isBlocked: isBlockedProp = false,
}) {
    const scrollRef = useRef(null);
    const bottomRef = useRef(null);
    const composerRef = useRef(null);
    const wasNearBottomRef = useRef(true);

    const [isMuted, setIsMuted] = useState(isMutedProp);
    const [isBlocked, setIsBlocked] = useState(isBlockedProp);

    useEffect(() => setIsMuted(isMutedProp), [isMutedProp]);
    useEffect(() => setIsBlocked(isBlockedProp), [isBlockedProp]);

    const [dialog, setDialog] = useState(null);

    // Which media the viewer is currently open on. Shape:
    //   { id, type, url } | null
    const [media, setMedia] = useState(null);

    /* ── Scroll behaviour ── */
    const handleScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const distanceFromBottom =
            el.scrollHeight - el.scrollTop - el.clientHeight;
        wasNearBottomRef.current = distanceFromBottom < 120;
    }, []);

    useEffect(() => {
        if (wasNearBottomRef.current) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages.length]);

    useEffect(() => {
        wasNearBottomRef.current = true;
        bottomRef.current?.scrollIntoView({ behavior: "auto" });
    }, [conversation?.id]);

    /* ── Peer resolution ── */
    const otherUser = useMemo(() => {
        const conv = conversation;
        if (!conv) return null;

        let other = conv.other_user ?? conv.otherUser ?? conv.raw?.other_user;

        if (!other && currentUserId) {
            const one = conv.raw?.user_one ?? conv.user_one;
            const two = conv.raw?.user_two ?? conv.user_two;

            if (one && two) {
                other = one.id === currentUserId ? two : one;
            }
        }

        if (!other) {
            other = conv.raw?.user_one ?? conv.user_one ?? null;
        }

        return other;
    }, [conversation, currentUserId]);

    const otherUserId = otherUser?.id ?? null;
    const presenceEntry = otherUserId ? onlineUsers[otherUserId] : null;
    const online = isOnline(otherUser?.last_active_at, presenceEntry);

    const status = isAnyoneTyping
        ? "typing…"
        : online
          ? "online"
          : formatLastSeen(
                presenceEntry?.lastActiveAt ?? otherUser?.last_active_at,
            );

    const grouped = useMemo(() => groupByDay(messages), [messages]);

    /* ── Media collection (all images/videos in the thread) ── */
    const mediaItems = useMemo(() => {
        const items = [];
        for (const m of messages) {
            const type = inferType(m);
            if (type !== "image" && type !== "video") continue;
            const url = resolveAttachmentUrl(m.attachment);
            if (!url) continue;

            items.push({
                id: m.id,
                type,
                url,
                attachment: m.attachment,
                filename: fileNameFromUrl(url),
                senderId: m.sender_id,
                senderName:
                    m.sender_id === currentUserId
                        ? "You"
                        : (otherUser?.name ?? conversation?.name ?? "Unknown"),
                senderAvatar:
                    m.sender_id === currentUserId
                        ? undefined
                        : (otherUser?.avatar ?? conversation?.avatar),
                createdAt: m.created_at,
            });
        }
        return items;
    }, [messages, currentUserId, otherUser, conversation]);

    /* ── Index of the currently-open media ── */
    const mediaIndex = useMemo(() => {
        if (!media?.id) return 0;
        const i = mediaItems.findIndex((m) => m.id === media.id);
        return i >= 0 ? i : 0;
    }, [media, mediaItems]);

    /* ── Header action handlers ── */
    const handleClose = useCallback(() => onClose?.(), [onClose]);

    const handleClearRequest = useCallback(() => setDialog("clear"), []);
    const handleClearConfirm = useCallback(() => {
        setDialog(null);
        onClear?.(conversation?.id);
    }, [onClear, conversation?.id]);

    const handleDeleteRequest = useCallback(() => setDialog("delete"), []);
    const handleDeleteConfirm = useCallback(() => {
        setDialog(null);
        onDelete?.(conversation?.id);
    }, [onDelete, conversation?.id]);

    const handleMuteToggle = useCallback(
        (next) => {
            setIsMuted(next);
            onMute?.(conversation?.id, next);
        },
        [onMute, conversation?.id],
    );

    const handleBlockToggle = useCallback(
        (next) => {
            if (next) {
                setDialog("block");
                return;
            }
            setIsBlocked(false);
            onBlock?.(conversation?.id, false);
        },
        [onBlock, conversation?.id],
    );

    const handleBlockConfirm = useCallback(() => {
        setDialog(null);
        setIsBlocked(true);
        onBlock?.(conversation?.id, true);
    }, [onBlock, conversation?.id]);

    /* ── Media viewer handlers ── */
    const handleOpenMedia = useCallback((payload) => {
        setMedia({
            id: payload.messageId,
            type: payload.type,
            url: payload.url,
        });
    }, []);

    const handleCloseMedia = useCallback(() => setMedia(null), []);

    /* ── Guard ── */
    if (!conversation) return null;

    return (
        <div className="d-flex flex-column h-100" style={{ minHeight: 0 }}>
            <MessageHeader
                name={otherUser?.name ?? conversation.name}
                avatar={otherUser?.avatar ?? conversation.avatar}
                status={status}
                isTyping={isAnyoneTyping}
                isOnline={online}
                isMuted={isMuted}
                isBlocked={isBlocked}
                onBack={onBack}
                onCall={() => console.log("call", otherUserId)}
                onVideo={() => console.log("video", otherUserId)}
                onClose={handleClose}
                onClear={handleClearRequest}
                onDelete={handleDeleteRequest}
                onMute={handleMuteToggle}
                onBlock={handleBlockToggle}
            />

            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="message-view-body flex-grow-1 p-3 d-flex flex-column gap-2"
                style={{ minHeight: 0, overflowY: "auto", overflowX: "hidden" }}
            >
                {loading && (
                    <div className="text-center text-muted py-3">
                        <Spinner animation="border" size="sm" /> Loading…
                    </div>
                )}

                {!loading && messages.length === 0 && (
                    <div className="text-center text-muted py-5 small">
                        No messages yet. Say hi 👋
                    </div>
                )}

                {grouped.map((group) => (
                    <div key={group.label}>
                        <div className="text-center my-2">
                            <span className="badge bg-secondary-subtle text-secondary-emphasis rounded-pill px-3 py-1 small">
                                {group.label}
                            </span>
                        </div>

                        {group.items.map((msg) => {
                            const own = msg.sender_id === currentUserId;
                            const tick = tickStatusFor(
                                msg,
                                currentUserId,
                                otherUserId,
                            );
                            const type = inferType(msg);

                            return (
                                <MessageBubble
                                    key={msg.id}
                                    message={msg}
                                    text={msg.body}
                                    time={formatMessageTime(msg.created_at)}
                                    own={own}
                                    type={type}
                                    attachment={msg.attachment}
                                    status={tick ?? "sent"}
                                    uploadPct={msg.uploadPct}
                                    onOpenMedia={handleOpenMedia}
                                />
                            );
                        })}
                    </div>
                ))}

                {isAnyoneTyping && (
                    <div className="d-flex align-items-center gap-2 px-2 py-1">
                        <div className="message-typing-indicator">
                            <span className="message-typing-dot" />
                            <span className="message-typing-dot" />
                            <span className="message-typing-dot" />
                        </div>
                        <small className="text-muted">
                            {typingNames.join(", ")} typing…
                        </small>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            <MessageComposer
                ref={composerRef}
                conversationId={conversation.id}
                onSend={onSend}
                onTyping={onTyping}
                onStopTyping={onStopTyping}
                disabled={loading || isBlocked}
                placeholder={
                    isBlocked
                        ? "You blocked this user"
                        : `Message ${conversation.name}`
                }
            />

            {/* ── Full-screen media viewer (only when a media item is selected) ── */}
            {media && (
                <MediaViewer
                    items={mediaItems}
                    startIndex={mediaIndex}
                    onClose={handleCloseMedia}
                />
            )}

            {/* ── Chat-level confirmation dialogs ── */}
            <ConfirmDialog
                show={dialog === "clear"}
                title="Clear chat?"
                body="All messages in this conversation will be removed from your view. This cannot be undone."
                confirmLabel="Clear"
                variant="warning"
                onConfirm={handleClearConfirm}
                onCancel={() => setDialog(null)}
            />

            <ConfirmDialog
                show={dialog === "delete"}
                title="Delete chat?"
                body="This conversation and all its messages will be permanently deleted. This cannot be undone."
                confirmLabel="Delete"
                variant="danger"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDialog(null)}
            />

            <ConfirmDialog
                show={dialog === "block"}
                title={`Block ${otherUser?.name ?? "this user"}?`}
                body="They will no longer be able to message you. You can unblock them later."
                confirmLabel="Block"
                variant="danger"
                onConfirm={handleBlockConfirm}
                onCancel={() => setDialog(null)}
            />
        </div>
    );
}
