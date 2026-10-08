// resources/js/Components/Conversation/MessageView.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Spinner, Modal, Button } from "react-bootstrap";
// REMOVED: FiFile, FiMusic, FiVideo, FiDownload (moved to MessageBubble)
import {
    formatMessageTime,
    formatDayLabel,
    formatLastSeen,
    isOnline,
} from "@/Helpers/Functions";

import MessageHeader from "./MessageHeader";
import MessageComposer from "./MessageComposer";
import MediaViewer from "./MediaViewer";
import MessageBubble from "./MessageBubble"; // <--- IMPORT NEW COMPONENT

/* ────────────────────────────────────────────────
 |  Helpers (Kept here for mediaItems logic)
 * ──────────────────────────────────────────────── */

const normalizeAttachment = (att) => {
    if (!att) return null;
    if (typeof att === "string") {
        return {
            url:
                att.startsWith("http") ||
                att.startsWith("/") ||
                att.startsWith("blob:")
                    ? att
                    : `/storage/${att}`,
            name: att.split("/").pop(),
            mime: "",
        };
    }
    return { url: att.url, name: att.name, mime: att.mime };
};

const getAttachments = (msg) => {
    if (Array.isArray(msg?.attachments) && msg.attachments.length > 0) {
        return msg.attachments.map(normalizeAttachment).filter(Boolean);
    }
    if (msg?.attachment) {
        const one = normalizeAttachment(msg.attachment);
        return one ? [one] : [];
    }
    return [];
};

const inferTypeFromAttachment = (attachment) => {
    const mime = attachment?.mime ?? "";
    const url = attachment?.url ?? "";
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("video/")) return "video";
    if (mime.startsWith("audio/")) return "audio";
    if (mime.includes("pdf")) return "pdf";
    if (/\.(jpe?g|png|gif|webp|avif)(\?|#|$)/i.test(url)) return "image";
    if (/\.(mp4|webm|mov)(\?|#|$)/i.test(url)) return "video";
    if (/\.(mp3|wav|ogg|m4a)(\?|#|$)/i.test(url)) return "audio";
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
    const [media, setMedia] = useState(null);

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

    const otherUser = useMemo(() => {
        const conv = conversation;
        if (!conv) return null;
        let other = conv.other_user ?? conv.otherUser ?? conv.raw?.other_user;
        if (!other && currentUserId) {
            const one = conv.raw?.user_one ?? conv.user_one;
            const two = conv.raw?.user_two ?? conv.user_two;
            if (one && two) other = one.id === currentUserId ? two : one;
        }
        if (!other) other = conv.raw?.user_one ?? conv.user_one ?? null;
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

    const mediaItems = useMemo(() => {
        const items = [];
        for (const m of messages) {
            const atts = getAttachments(m);
            if (atts.length === 0) continue;
            atts.forEach((att, i) => {
                const t = inferTypeFromAttachment(att);
                if (t !== "image" && t !== "video") return;
                if (!att.url) return;
                items.push({
                    id: `${m.id}::${i}`,
                    messageId: m.id,
                    type: t,
                    url: att.url,
                    filename: att.name || fileNameFromUrl(att.url),
                    senderId: m.sender_id,
                    senderName:
                        m.sender_id === currentUserId
                            ? "You"
                            : (otherUser?.name ??
                              conversation?.name ??
                              "Unknown"),
                    senderAvatar:
                        m.sender_id === currentUserId
                            ? undefined
                            : (otherUser?.avatar ?? conversation?.avatar),
                    createdAt: m.created_at,
                });
            });
        }
        return items;
    }, [messages, currentUserId, otherUser, conversation]);

    const mediaIndex = useMemo(() => {
        if (!media?.id) return 0;
        const i = mediaItems.findIndex((m) => m.id === media.id);
        return i >= 0 ? i : 0;
    }, [media, mediaItems]);

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

    const handleOpenMedia = useCallback((payload) => {
        setMedia({
            id: `${payload.messageId}::${payload.index ?? 0}`,
            type: payload.type,
            url: payload.url,
        });
    }, []);
    const handleCloseMedia = useCallback(() => setMedia(null), []);

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
                style={{
                    minHeight: 0,
                    overflowY: "auto",
                    overflowX: "hidden",
                    background: "#0b141a",
                }} // Dark background added
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

                            return (
                                <MessageBubble
                                    key={msg.id}
                                    message={msg}
                                    text={msg.body}
                                    time={formatMessageTime(msg.created_at)}
                                    own={own}
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

            {media && (
                <MediaViewer
                    items={mediaItems}
                    startIndex={mediaIndex}
                    onClose={handleCloseMedia}
                />
            )}

            {/* Dialogs */}
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
