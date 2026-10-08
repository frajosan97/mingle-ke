import React from "react";
import { Image } from "react-bootstrap";
import { FiFile, FiMusic, FiVideo, FiDownload, FiCheck } from "react-icons/fi";

/* ────────────────────────────────────────────────
 |  Helpers
 * ──────────────────────────────────────────────── */
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
            name: fileNameFromUrl(att),
            mime: "",
            size: 0,
        };
    }
    return {
        url: att.url ?? null,
        name: att.name ?? fileNameFromUrl(att.url ?? ""),
        mime: att.mime ?? "",
        size: att.size ?? 0,
    };
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

const inferType = (msg) => {
    if (msg.type) return msg.type;
    const atts = getAttachments(msg);
    if (atts.length === 0) return "text";
    return inferTypeFromAttachment(atts[0]);
};

const triggerDownload = (url, filename) => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || fileNameFromUrl(url);
    a.rel = "noopener";
    if (
        !url.startsWith(window.location.origin) &&
        !url.startsWith("/") &&
        !url.startsWith("blob:")
    ) {
        a.target = "_blank";
    }
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

/* ────────────────────────────────────────────────
 |  Attachment Block
 * ──────────────────────────────────────────────── */
function AttachmentBlock({
    type,
    attachment,
    own,
    onOpenMedia,
    messageId,
    index,
}) {
    if (!attachment?.url) return null;
    const { url, name, size } = attachment;
    const filename = name || fileNameFromUrl(url);

    // ── Image ──
    if (type === "image") {
        return (
            <button
                type="button"
                onClick={() =>
                    onOpenMedia?.({
                        type: "image",
                        url,
                        filename,
                        messageId,
                        index,
                    })
                }
                className="message-media-btn"
            >
                <Image src={url} fluid rounded className="message-media-img" />
            </button>
        );
    }

    // ── Video ──
    if (type === "video") {
        return (
            <button
                type="button"
                onClick={() =>
                    onOpenMedia?.({
                        type: "video",
                        url,
                        filename,
                        messageId,
                        index,
                    })
                }
                className="message-media-btn position-relative"
            >
                <video
                    src={url}
                    muted
                    playsInline
                    preload="metadata"
                    className="message-media-img"
                />
                <span className="message-video-overlay">
                    <FiVideo size={20} />
                </span>
            </button>
        );
    }

    // ── PDF / Document Card ──
    if (type === "pdf" || type === "file") {
        return (
            <div className="wa-file-card">
                <div className="wa-file-preview">
                    <div className="wa-file-icon">
                        <FiFile size={28} />
                    </div>
                </div>

                <div className="wa-file-footer">
                    <div className="wa-file-meta">
                        <div className="wa-file-title">{filename}</div>
                        <div className="wa-file-subtitle">
                            {size ? `${(size / 1024).toFixed(0)} KB` : "File"} •{" "}
                            {type.toUpperCase()}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => triggerDownload(url, filename)}
                        className="wa-file-download"
                        title="Download"
                    >
                        <FiDownload size={18} />
                    </button>
                </div>
            </div>
        );
    }

    // ── Audio / Generic File Pill ──
    const Icon = type === "audio" ? FiMusic : FiFile;
    return (
        <div className="wa-file-pill">
            <span className="wa-file-pill-icon">
                <Icon size={18} />
            </span>
            <span className="wa-file-pill-body">
                <span className="wa-file-pill-name">{filename}</span>
                <span className="wa-file-pill-sub">Click to download</span>
            </span>
            <button
                type="button"
                onClick={() => triggerDownload(url, filename)}
                className="wa-file-download"
            >
                <FiDownload size={16} />
            </button>
        </div>
    );
}

/* ────────────────────────────────────────────────
 |  Tick Icons
 * ──────────────────────────────────────────────── */
const StatusTicks = ({ status }) => {
    if (status === "sending")
        return (
            <i
                className="bi bi-clock message-tick message-tick-default"
                style={{ fontSize: 12 }}
            />
        );
    if (status === "sent")
        return (
            <FiCheck
                className="message-tick message-tick-default"
                style={{ fontSize: 14 }}
            />
        );
    if (status === "delivered")
        return (
            <div className="message-tick-stack message-tick-default">
                <FiCheck />
                <FiCheck style={{ marginLeft: -8 }} />
            </div>
        );
    if (status === "read")
        return (
            <div className="message-tick-stack message-tick-read">
                <FiCheck />
                <FiCheck style={{ marginLeft: -8 }} />
            </div>
        );
    return null;
};

/* ────────────────────────────────────────────────
 |  Main Message Bubble Component
 * ──────────────────────────────────────────────── */
export default function MessageBubble({
    message,
    text,
    time,
    own = false,
    status = "sent",
    uploadPct,
    onOpenMedia,
}) {
    const attachments = getAttachments(message);
    const type = inferType(message);
    const hasAttachments = attachments.length > 0;
    const hasText = Boolean(text);

    // Separate media (image/video) from other attachments
    const mediaAttachments = attachments.filter((att) => {
        const t = inferTypeFromAttachment(att);
        return t === "image" || t === "video";
    });
    const otherAttachments = attachments.filter((att) => {
        const t = inferTypeFromAttachment(att);
        return t !== "image" && t !== "video";
    });

    const hasMedia = mediaAttachments.length > 0;
    const hasOther = otherAttachments.length > 0;
    const isMediaOnly = hasMedia && !hasText && !hasOther;

    // Grid columns: at least 2 per row, max 3 for many items
    const mediaCount = mediaAttachments.length;
    const gridCols = mediaCount === 1 ? 1 : mediaCount === 2 ? 2 : 3;

    return (
        <div
            className={`message-row ${
                own ? "message-row-own" : "message-row-other"
            }`}
        >
            <div
                className={`message-bubble ${
                    own ? "message-bubble-own" : "message-bubble-other"
                } ${isMediaOnly ? "message-bubble-media" : ""}`}
            >
                {/* Tail */}
                <span
                    className={`message-tail ${
                        own ? "message-tail-own" : "message-tail-other"
                    }`}
                    aria-hidden="true"
                />

                {/* Media Grid (images/videos) */}
                {hasMedia && (
                    <div
                        className="message-media-grid"
                        style={{
                            "--media-cols": gridCols,
                        }}
                    >
                        {mediaAttachments.map((att, i) => (
                            <AttachmentBlock
                                key={`${message.id}-media-${i}`}
                                type={inferTypeFromAttachment(att)}
                                attachment={att}
                                own={own}
                                messageId={message?.id}
                                index={i}
                                onOpenMedia={onOpenMedia}
                            />
                        ))}
                    </div>
                )}

                {/* Other Attachments (files, audio, pdf) */}
                {hasOther && (
                    <div className="message-attachments">
                        {otherAttachments.map((att, i) => (
                            <AttachmentBlock
                                key={`${message.id}-att-${i}`}
                                type={inferTypeFromAttachment(att)}
                                attachment={att}
                                own={own}
                                messageId={message?.id}
                                index={i}
                                onOpenMedia={onOpenMedia}
                            />
                        ))}
                    </div>
                )}

                {/* Text body */}
                {hasText && <div className="message-text">{text}</div>}

                {/* Upload progress */}
                {typeof uploadPct === "number" &&
                    uploadPct > 0 &&
                    uploadPct < 100 && (
                        <div className="message-progress">
                            <div className="progress" style={{ height: 4 }}>
                                <div
                                    className="progress-bar bg-info"
                                    style={{ width: `${uploadPct}%` }}
                                />
                            </div>
                            <span className="message-progress-label">
                                {uploadPct}%
                            </span>
                        </div>
                    )}

                {/* Meta row (time + ticks) */}
                <div
                    className={`message-meta ${
                        own ? "message-meta-own" : "message-meta-other"
                    }`}
                >
                    <span className="message-time">{time}</span>
                    {own && <StatusTicks status={status} />}
                </div>
            </div>
        </div>
    );
}
