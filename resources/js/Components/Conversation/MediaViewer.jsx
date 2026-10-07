// resources/js/Components/Conversation/MediaViewer.jsx
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import {
    FiX,
    FiChevronLeft,
    FiChevronRight,
    FiZoomIn,
    FiZoomOut,
    FiRotateCcw,
    FiDownload,
    FiMoreVertical,
} from "react-icons/fi";
import { getUserAvatar } from "@/Helpers/Functions";

/* ────────────────────────────────────────────────
 |  Helpers
 * ──────────────────────────────────────────────── */
const isBlobUrl = (url) => typeof url === "string" && url.startsWith("blob:");

const resolveUrl = (attachment) => {
    if (!attachment) return null;
    if (isBlobUrl(attachment)) return attachment;
    if (attachment.startsWith("http")) return attachment;
    if (attachment.startsWith("/")) return attachment;
    return `/storage/${attachment}`;
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

const formatReceivedAt = (d) => {
    if (!d) return "";
    const date = d instanceof Date ? d : new Date(d);
    if (isNaN(date)) return "";

    const now = new Date();
    const sameDay = date.toDateString() === now.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const time = date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
    });

    if (sameDay) return `Today at ${time}`;
    if (isYesterday) return `Yesterday at ${time}`;

    const day = date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
    });
    return `${day} at ${time}`;
};

/* ────────────────────────────────────────────────
 |  Sub-components
 * ──────────────────────────────────────────────── */

function IconButton({ children, label, onClick, disabled }) {
    return (
        <button
            type="button"
            className="media-viewer-icon d-inline-flex align-items-center justify-content-center border-0 rounded-circle bg-transparent text-white"
            style={{
                width: 40,
                height: 40,
                opacity: disabled ? 0.4 : 1,
                cursor: disabled ? "not-allowed" : "pointer",
            }}
            title={label}
            aria-label={label}
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
}

function NavArrow({ side, onClick }) {
    const isLeft = side === "left";
    return (
        <button
            type="button"
            className="media-viewer-nav position-absolute top-50 translate-middle-y d-inline-flex align-items-center justify-content-center border-0 rounded-circle text-white"
            style={{
                [isLeft ? "left" : "right"]: 16,
                width: 48,
                height: 48,
                background: "rgba(0,0,0,0.5)",
                zIndex: 2,
            }}
            aria-label={isLeft ? "Previous" : "Next"}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
        >
            {isLeft ? (
                <FiChevronLeft size={28} />
            ) : (
                <FiChevronRight size={28} />
            )}
        </button>
    );
}

const Thumbnail = forwardRef(function Thumbnail(
    { item, active, onClick },
    ref,
) {
    const url = resolveUrl(item.attachment ?? item.url);
    const isImage = item.type === "image";
    const isVideo = item.type === "video";

    return (
        <button
            ref={ref}
            type="button"
            onClick={onClick}
            className="media-viewer-thumb position-relative flex-shrink-0 border-0 p-0 rounded overflow-hidden"
            style={{
                width: 84,
                height: 64,
                background: "#111",
                outline: active ? "3px solid #4f9cf9" : "none",
                outlineOffset: -3,
                cursor: "pointer",
            }}
            aria-label={`View item ${item.id ?? ""}`}
        >
            {isImage && (
                <img
                    src={url}
                    alt=""
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        opacity: active ? 1 : 0.75,
                    }}
                />
            )}

            {isVideo && (
                <>
                    <video
                        src={url}
                        muted
                        playsInline
                        preload="metadata"
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            opacity: active ? 1 : 0.75,
                        }}
                    />
                    <span
                        className="position-absolute top-50 start-50 translate-middle d-inline-flex align-items-center justify-content-center rounded-circle bg-dark bg-opacity-75 text-white"
                        style={{ width: 24, height: 24 }}
                        aria-hidden="true"
                    >
                        ▶
                    </span>
                </>
            )}

            {!isImage && !isVideo && (
                <span className="d-flex align-items-center justify-content-center w-100 h-100 text-white-50 small">
                    FILE
                </span>
            )}
        </button>
    );
});

/* ────────────────────────────────────────────────
 |  Main
 * ──────────────────────────────────────────────── */

export default function MediaViewer({ items = [], startIndex = 0, onClose }) {
    const [index, setIndex] = useState(
        Math.max(0, Math.min(startIndex, items.length - 1)),
    );
    const [zoom, setZoom] = useState(1);
    const [menuOpen, setMenuOpen] = useState(false);

    const stripRef = useRef(null);
    const activeThumbRef = useRef(null);

    const current = items[index] ?? null;
    const src = resolveUrl(current?.attachment ?? current?.url);
    const filename = current?.filename ?? fileNameFromUrl(src);

    const next = useCallback(() => {
        setIndex((i) => (i + 1) % items.length);
    }, [items.length]);

    const prev = useCallback(() => {
        setIndex((i) => (i - 1 + items.length) % items.length);
    }, [items.length]);

    /* Body scroll lock + keyboard navigation */
    useEffect(() => {
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const onKey = (e) => {
            if (e.key === "Escape") onClose?.();
            else if (e.key === "ArrowRight") next();
            else if (e.key === "ArrowLeft") prev();
            else if (e.key === "+" || e.key === "=")
                setZoom((z) => Math.min(5, +(z + 0.25).toFixed(2)));
            else if (e.key === "-")
                setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)));
            else if (e.key === "0") setZoom(1);
        };
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener("keydown", onKey);
        };
    }, [next, prev, onClose]);

    /* Reset zoom + menu on item change */
    useEffect(() => {
        setZoom(1);
        setMenuOpen(false);
    }, [index]);

    /* Auto-scroll active thumbnail into view */
    useEffect(() => {
        activeThumbRef.current?.scrollIntoView({
            behavior: "smooth",
            inline: "center",
            block: "nearest",
        });
    }, [index]);

    const zoomIn = () => setZoom((z) => Math.min(5, +(z + 0.25).toFixed(2)));
    const zoomOut = () => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)));
    const resetZoom = () => setZoom(1);
    const download = () => triggerDownload(src, filename);

    const onBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose?.();
    };

    const hasPrev = items.length > 1;
    const hasNext = items.length > 1;
    const isImage = current?.type === "image";
    const isVideo = current?.type === "video";

    if (!current) return null;

    return (
        <div
            className="media-viewer position-fixed top-0 start-0 w-100 h-100 d-flex flex-column text-white"
            style={{
                background: "rgba(15, 15, 15, 0.96)",
                zIndex: 1080,
            }}
            onClick={onBackdropClick}
            role="dialog"
            aria-modal="true"
        >
            {/* ── Top bar ── */}
            <div className="media-viewer-top d-flex align-items-center gap-3 px-3 px-md-4 py-2 flex-shrink-0 border-bottom border-secondary border-opacity-25">
                <div className="d-flex align-items-center gap-2 flex-grow-1 overflow-hidden">
                    <img
                        src={
                            current.senderAvatar ||
                            getUserAvatar(current.senderName || "User", {
                                fallbackName: "User",
                            })
                        }
                        alt=""
                        width={40}
                        height={40}
                        className="rounded-circle flex-shrink-0"
                        style={{ objectFit: "cover" }}
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = getUserAvatar(
                                current.senderName || "User",
                                { fallbackName: "User" },
                            );
                        }}
                    />
                    <div className="overflow-hidden" style={{ minWidth: 0 }}>
                        <div className="fw-semibold text-truncate">
                            {current.senderName ?? "Unknown"}
                        </div>
                        <div className="small text-white-50 text-truncate">
                            {formatReceivedAt(current.createdAt)}
                        </div>
                    </div>
                </div>

                <div className="d-flex align-items-center gap-1 flex-shrink-0">
                    <IconButton
                        label="Zoom in"
                        onClick={zoomIn}
                        disabled={!isImage && !isVideo}
                    >
                        <FiZoomIn size={20} />
                    </IconButton>
                    <IconButton
                        label="Zoom out"
                        onClick={zoomOut}
                        disabled={(!isImage && !isVideo) || zoom <= 1}
                    >
                        <FiZoomOut size={20} />
                    </IconButton>
                    <IconButton
                        label="Reset zoom"
                        onClick={resetZoom}
                        disabled={zoom === 1}
                    >
                        <FiRotateCcw size={20} />
                    </IconButton>
                    <IconButton label="Download" onClick={download}>
                        <FiDownload size={20} />
                    </IconButton>
                    <div className="position-relative">
                        <IconButton
                            label="More"
                            onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpen((v) => !v);
                            }}
                        >
                            <FiMoreVertical size={20} />
                        </IconButton>
                        {menuOpen && (
                            <div
                                className="media-viewer-menu position-absolute end-0 mt-2 py-1 rounded shadow-lg"
                                style={{
                                    background: "#1f1f1f",
                                    minWidth: 200,
                                    zIndex: 1,
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    type="button"
                                    className="media-viewer-menu-item d-flex align-items-center gap-2 w-100 px-3 py-2 border-0 bg-transparent text-white-50 text-start small"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        download();
                                    }}
                                >
                                    <FiDownload size={14} />
                                    Save as…
                                </button>
                            </div>
                        )}
                    </div>
                    <IconButton label="Close" onClick={onClose}>
                        <FiX size={22} />
                    </IconButton>
                </div>
            </div>

            {/* ── Media stage ── */}
            <div
                className="media-viewer-stage position-relative flex-grow-1 d-flex align-items-center justify-content-center overflow-hidden"
                style={{ minHeight: 0 }}
            >
                {hasPrev && <NavArrow side="left" onClick={prev} />}

                <div
                    className="d-flex align-items-center justify-content-center w-100 h-100 p-2"
                    style={{ overflow: "auto" }}
                >
                    {isImage && (
                        <img
                            src={src}
                            alt={filename}
                            draggable={false}
                            style={{
                                maxWidth: zoom === 1 ? "100%" : "none",
                                maxHeight: zoom === 1 ? "100%" : "none",
                                transform: `scale(${zoom})`,
                                transformOrigin: "center center",
                                transition: "transform 120ms ease-out",
                                userSelect: "none",
                                objectFit: "contain",
                            }}
                        />
                    )}

                    {isVideo && (
                        <video
                            src={src}
                            controls
                            autoPlay
                            playsInline
                            style={{
                                maxWidth: "100%",
                                maxHeight: "100%",
                                borderRadius: 8,
                                transform: `scale(${zoom})`,
                                transformOrigin: "center center",
                                transition: "transform 120ms ease-out",
                            }}
                        />
                    )}

                    {!isImage && !isVideo && (
                        <div className="text-center text-white-50">
                            <div className="mb-2">
                                Preview not available for this file.
                            </div>
                            <button
                                type="button"
                                className="btn btn-outline-light btn-sm"
                                onClick={download}
                            >
                                <FiDownload className="me-2" />
                                Download
                            </button>
                        </div>
                    )}
                </div>

                {hasNext && <NavArrow side="right" onClick={next} />}

                <div
                    className="position-absolute start-50 translate-middle-x text-white-50 small"
                    style={{ bottom: 12 }}
                >
                    {index + 1} of {items.length}
                </div>
            </div>

            {/* ── Thumbnail strip ── */}
            {items.length > 1 && (
                <div
                    ref={stripRef}
                    className="media-viewer-strip flex-shrink-0 d-flex align-items-center gap-2 px-3 py-2 overflow-auto border-top border-secondary border-opacity-25"
                    style={{ background: "rgba(0,0,0,0.35)" }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {items.map((item, i) => (
                        <Thumbnail
                            key={item.id ?? i}
                            item={item}
                            active={i === index}
                            onClick={() => setIndex(i)}
                            ref={i === index ? activeThumbRef : null}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
