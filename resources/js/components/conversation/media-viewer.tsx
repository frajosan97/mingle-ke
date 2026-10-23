import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    ChevronLeft,
    ChevronRight,
    Download,
    FileWarning,
    Headphones,
    Pause,
    Play,
    RotateCcw,
    X,
    ZoomIn,
    ZoomOut,
} from "lucide-react";

export interface MediaItem {
    url: string;
    type: "image" | "video" | "audio";
    name?: string;
}

interface MediaViewerProps {
    isOpen: boolean;
    onClose: () => void;
    media: MediaItem | null;
    allMedia?: MediaItem[];
    currentIndex?: number;
    onNavigate?: (index: number) => void;
    onDownload?: (media: MediaItem) => void;
}

export default function MediaViewer({
    isOpen,
    onClose,
    media,
    allMedia = [],
    currentIndex = 0,
    onNavigate,
    onDownload,
}: MediaViewerProps) {
    const [zoom, setZoom] = useState(1);

    // Reset zoom whenever the viewer opens or the media changes.
    useEffect(() => {
        setZoom(1);
    }, [media?.url, isOpen]);

    // Prevent background scrolling while the viewer is open.
    useEffect(() => {
        if (!isOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen]);

    // Keyboard navigation.
    useEffect(() => {
        if (!isOpen) return;

        const handleKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            } else if (event.key === "ArrowLeft" && currentIndex > 0) {
                onNavigate?.(currentIndex - 1);
            } else if (
                event.key === "ArrowRight" &&
                currentIndex < allMedia.length - 1
            ) {
                onNavigate?.(currentIndex + 1);
            }
        };

        window.addEventListener("keydown", handleKey);

        return () => {
            window.removeEventListener("keydown", handleKey);
        };
    }, [isOpen, currentIndex, allMedia.length, onClose, onNavigate]);

    if (!isOpen || !media || typeof document === "undefined") {
        return null;
    }

    const canGoPrev = currentIndex > 0 && allMedia.length > 1;

    const canGoNext = currentIndex < allMedia.length - 1 && allMedia.length > 1;

    const canZoom = media.type === "image";

    const zoomIn = () => {
        setZoom((prev) => Math.min(prev + 0.25, 4));
    };

    const zoomOut = () => {
        setZoom((prev) => Math.max(prev - 0.25, 0.25));
    };

    const resetZoom = () => {
        setZoom(1);
    };

    const handleDownload = () => {
        if (onDownload) {
            onDownload(media);
            return;
        }

        // Fallback when no onDownload handler is provided.
        const link = document.createElement("a");
        link.href = media.url;
        link.download = media.name ?? media.url.split("/").pop() ?? "download";
        link.rel = "noopener noreferrer";
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return createPortal(
        <>
            {/* Injecting styles directly to guarantee scrollbar hiding without external CSS files */}
            <style>{`
                .media-viewer-hide-scrollbar {
                    -ms-overflow-style: none !important;  /* IE and Edge */
                    scrollbar-width: none !important;  /* Firefox */
                }
                .media-viewer-hide-scrollbar::-webkit-scrollbar {
                    display: none !important; /* Chrome, Safari and Opera */
                    width: 0 !important;
                    height: 0 !important;
                }
            `}</style>

            <div className="fixed inset-0 z-[99999] flex flex-col overflow-hidden bg-black/95 backdrop-blur-sm">
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between gap-4 p-4 text-white">
                    <div className="min-w-0">
                        <h3 className="truncate text-sm font-medium">
                            {media.name ?? "Media"}
                        </h3>

                        {allMedia.length > 1 && (
                            <p className="text-xs text-gray-400">
                                {currentIndex + 1} of {allMedia.length}
                            </p>
                        )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={handleDownload}
                            className="rounded-full p-2 transition-colors hover:bg-white/10"
                            aria-label="Download media"
                        >
                            <Download className="h-5 w-5" />
                        </button>

                        {canZoom && (
                            <>
                                <button
                                    type="button"
                                    onClick={zoomOut}
                                    disabled={zoom <= 0.25}
                                    className="rounded-full p-2 transition-colors hover:bg-white/10 disabled:opacity-40"
                                    aria-label="Zoom out"
                                >
                                    <ZoomOut className="h-5 w-5" />
                                </button>

                                <span className="min-w-[3rem] text-center text-xs tabular-nums text-gray-300">
                                    {Math.round(zoom * 100)}%
                                </span>

                                <button
                                    type="button"
                                    onClick={zoomIn}
                                    disabled={zoom >= 4}
                                    className="rounded-full p-2 transition-colors hover:bg-white/10 disabled:opacity-40"
                                    aria-label="Zoom in"
                                >
                                    <ZoomIn className="h-5 w-5" />
                                </button>

                                <button
                                    type="button"
                                    onClick={resetZoom}
                                    disabled={zoom === 1}
                                    className="rounded-full p-2 transition-colors hover:bg-white/10 disabled:opacity-40"
                                    aria-label="Reset zoom to 100%"
                                >
                                    <RotateCcw className="h-5 w-5" />
                                </button>
                            </>
                        )}

                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-full p-2 transition-colors hover:bg-white/10"
                            aria-label="Close media viewer"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Media viewport */}
                <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4">
                    {canGoPrev && (
                        <button
                            type="button"
                            onClick={() => onNavigate?.(currentIndex - 1)}
                            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
                            aria-label="Previous media"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                    )}

                    <div className="flex h-full min-h-0 w-full min-w-0 items-center justify-center">
                        {media.type === "image" && (
                            <ViewerImage
                                key={media.url}
                                media={media}
                                zoom={zoom}
                            />
                        )}

                        {media.type === "video" && (
                            <ViewerVideo key={media.url} media={media} />
                        )}

                        {media.type === "audio" && (
                            <ViewerAudioPlayer
                                key={media.url}
                                src={media.url}
                                name={media.name ?? "Audio"}
                            />
                        )}
                    </div>

                    {canGoNext && (
                        <button
                            type="button"
                            onClick={() => onNavigate?.(currentIndex + 1)}
                            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
                            aria-label="Next media"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </button>
                    )}
                </div>

                {/* Thumbnail strip */}
                {allMedia.length > 1 && (
                    <div className="media-viewer-hide-scrollbar flex h-24 shrink-0 items-center justify-center gap-2 overflow-x-auto overflow-y-hidden bg-black/50 p-2">
                        {allMedia.map((item, index) => (
                            <button
                                type="button"
                                key={`${item.url}-${index}`}
                                onClick={() => onNavigate?.(index)}
                                className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-all ${
                                    index === currentIndex
                                        ? "scale-105 border-green-500"
                                        : "border-transparent opacity-50 hover:opacity-100"
                                }`}
                                aria-label={`View ${item.name ?? item.type}`}
                            >
                                {item.type === "video" ? (
                                    <video
                                        src={item.url}
                                        preload="metadata"
                                        muted
                                        playsInline
                                        className="pointer-events-none h-full w-full object-cover"
                                    />
                                ) : item.type === "image" ? (
                                    <img
                                        src={item.url}
                                        alt=""
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-amber-500 text-white">
                                        <Headphones className="h-8 w-8" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </>,
        document.body,
    );
}

/**
 * Image viewer
 *
 * The important fix is separating the scrolling viewport from the image
 * content. The content grows with the zoomed image, so its top and left
 * edges remain reachable when scrolling in either direction.
 */
function ViewerImage({ media, zoom }: { media: MediaItem; zoom: number }) {
    const [failed, setFailed] = useState(false);

    const [fitSize, setFitSize] = useState<{
        width: number;
        height: number;
    } | null>(null);

    const [viewport, setViewport] = useState({
        width: 0,
        height: 0,
    });

    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    // Measure the available viewport and calculate the initial fit size.
    useEffect(() => {
        const container = containerRef.current;

        if (!container) return;

        const measure = () => {
            const img = imgRef.current;

            if (!img) return;

            const width = container.clientWidth;
            const height = container.clientHeight;

            if (!img.naturalWidth || !img.naturalHeight || !width || !height) {
                return;
            }

            setViewport({
                width,
                height,
            });

            const scale = Math.min(
                width / img.naturalWidth,
                height / img.naturalHeight,
            );

            setFitSize({
                width: img.naturalWidth * scale,
                height: img.naturalHeight * scale,
            });
        };

        measure();

        const observer = new ResizeObserver(measure);
        observer.observe(container);

        return () => observer.disconnect();
    }, [media.url]);

    if (failed) {
        return <MediaLoadError url={media.url} type="image" />;
    }

    const imageWidth = fitSize ? fitSize.width * zoom : 0;

    const imageHeight = fitSize ? fitSize.height * zoom : 0;

    // Never let the scrollable content be smaller than the viewport.
    const contentWidth = Math.max(viewport.width, imageWidth);

    const contentHeight = Math.max(viewport.height, imageHeight);

    return (
        <div
            ref={containerRef}
            className="media-viewer-hide-scrollbar h-full w-full min-h-0 min-w-0 overflow-auto overscroll-contain"
            style={{
                WebkitOverflowScrolling: "touch",
            }}
        >
            <div
                className="flex items-center justify-center"
                style={{
                    width: contentWidth || "100%",
                    height: contentHeight || "100%",
                    minWidth: "100%",
                    minHeight: "100%",
                }}
            >
                <img
                    ref={imgRef}
                    src={media.url}
                    alt={media.name ?? "Image"}
                    draggable={false}
                    onLoad={() => {
                        const container = containerRef.current;
                        const img = imgRef.current;

                        if (
                            !container ||
                            !img ||
                            !img.naturalWidth ||
                            !img.naturalHeight
                        ) {
                            return;
                        }

                        const width = container.clientWidth;
                        const height = container.clientHeight;

                        setViewport({
                            width,
                            height,
                        });

                        const scale = Math.min(
                            width / img.naturalWidth,
                            height / img.naturalHeight,
                        );

                        setFitSize({
                            width: img.naturalWidth * scale,
                            height: img.naturalHeight * scale,
                        });
                    }}
                    onError={() => {
                        console.error(
                            "Media viewer image failed to load:",
                            media.url,
                        );

                        setFailed(true);
                    }}
                    style={
                        fitSize
                            ? {
                                  width: imageWidth,
                                  height: imageHeight,
                                  maxWidth: "none",
                                  maxHeight: "none",
                                  flex: "none",
                              }
                            : {
                                  maxWidth: "100%",
                                  maxHeight: "100%",
                              }
                    }
                    className="select-none object-contain"
                />
            </div>
        </div>
    );
}

/**
 * Video viewer
 */
function ViewerVideo({ media }: { media: MediaItem }) {
    const [failed, setFailed] = useState(false);

    if (failed) {
        return <MediaLoadError url={media.url} type="video" />;
    }

    return (
        <video
            src={media.url}
            controls
            autoPlay
            playsInline
            preload="metadata"
            onError={() => {
                console.error("Media viewer video failed to load:", media.url);

                setFailed(true);
            }}
            className="max-h-full max-w-full rounded-lg"
        />
    );
}

/**
 * Media loading error
 */
function MediaLoadError({ url, type }: { url: string; type: string }) {
    return (
        <div className="flex max-w-lg flex-col items-center gap-3 rounded-xl border border-white/20 bg-white/5 p-8 text-center text-white">
            <FileWarning className="h-12 w-12 text-red-400" />

            <p className="font-medium">Unable to load {type}</p>

            <p className="break-all text-xs text-gray-400">
                The file may be missing, inaccessible, or have an invalid URL.
            </p>

            <button
                type="button"
                onClick={() =>
                    window.open(url, "_blank", "noopener,noreferrer")
                }
                className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
            >
                Open file URL
            </button>
        </div>
    );
}

/**
 * Audio player
 */
function ViewerAudioPlayer({ src, name }: { src: string; name: string }) {
    const audioRef = useRef<HTMLAudioElement>(null);

    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [failed, setFailed] = useState(false);

    const toggle = () => {
        const audio = audioRef.current;

        if (!audio) return;

        if (audio.paused) {
            void audio.play().catch((error: unknown) => {
                console.error("Audio playback failed:", src, error);

                setFailed(true);
            });
        } else {
            audio.pause();
        }
    };

    const seek = (event: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRef.current;

        if (!audio || !duration) return;

        const rect = event.currentTarget.getBoundingClientRect();

        const fraction = Math.max(
            0,
            Math.min(1, (event.clientX - rect.left) / rect.width),
        );

        audio.currentTime = fraction * duration;
    };

    const percent =
        duration > 0 ? Math.min(100, (progress / duration) * 100) : 0;

    return (
        <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl bg-[#1f1f1f] p-6 shadow-2xl">
            <audio
                ref={audioRef}
                src={src}
                preload="metadata"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => {
                    setPlaying(false);
                    setProgress(0);
                }}
                onTimeUpdate={(event) =>
                    setProgress(event.currentTarget.currentTime)
                }
                onLoadedMetadata={(event) =>
                    setDuration(event.currentTarget.duration || 0)
                }
                onError={() => {
                    console.error("Audio file failed to load:", src);

                    setFailed(true);
                    setPlaying(false);
                }}
            />

            <div className="relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-400 shadow-lg">
                <Headphones className="h-20 w-20 text-white/90" />

                <span className="absolute bottom-3 left-3 text-lg font-bold text-white">
                    {formatDuration(duration)}
                </span>
            </div>

            <div className="w-full text-center">
                <p className="mb-1 truncate px-4 text-base font-medium text-white">
                    {name}
                </p>

                <p className="text-xs text-gray-400">Voice Note</p>

                {failed && (
                    <p className="mt-2 text-sm text-red-400">
                        Audio could not be loaded. Check the file URL.
                    </p>
                )}
            </div>

            <div className="flex w-full items-center gap-4 px-2">
                <button
                    type="button"
                    onClick={toggle}
                    disabled={failed}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-black transition hover:scale-105 disabled:opacity-50"
                    aria-label={playing ? "Pause audio" : "Play audio"}
                >
                    {playing ? (
                        <Pause className="h-6 w-6" fill="currentColor" />
                    ) : (
                        <Play
                            className="h-6 w-6 translate-x-0.5"
                            fill="currentColor"
                        />
                    )}
                </button>

                <div className="flex flex-1 flex-col gap-1">
                    <div
                        onClick={seek}
                        className="relative h-2 w-full cursor-pointer rounded-full bg-gray-600"
                        role="progressbar"
                        aria-label="Audio playback progress"
                        aria-valuemin={0}
                        aria-valuemax={duration || 0}
                        aria-valuenow={progress}
                    >
                        <div
                            className="absolute left-0 top-0 h-full rounded-full bg-white"
                            style={{
                                width: `${percent}%`,
                            }}
                        />
                    </div>

                    <div className="flex justify-between text-[11px] tabular-nums text-gray-400">
                        <span>{formatDuration(progress)}</span>

                        <span>{formatDuration(duration)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function formatDuration(seconds: number) {
    if (!Number.isFinite(seconds) || seconds < 0) {
        return "0:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainder = Math.floor(seconds % 60);

    return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}
