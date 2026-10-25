import { useRef, useState } from "react";
import type { MessageAttachment } from "@/types";
import { Download, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AudioBubbleProps {
    attachment: MessageAttachment & { url: string };
    mine?: boolean;
}

export default function AudioBubble({ attachment, mine }: AudioBubbleProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [failed, setFailed] = useState(false);

    const toggle = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (audio.paused) {
            void audio.play().catch(() => setFailed(true));
        } else {
            audio.pause();
        }
    };

    const percent =
        duration > 0 ? Math.min(100, (progress / duration) * 100) : 0;

    return (
        <div
            className={cn(
                "mb-1 flex min-w-[220px] max-w-[320px] items-center gap-3 rounded-lg p-2",
                mine ? "bg-black/15" : "bg-muted/60",
            )}
        >
            <audio
                ref={audioRef}
                src={attachment.url}
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
                onError={() => setFailed(true)}
            />

            <button
                type="button"
                onClick={toggle}
                disabled={failed}
                aria-label={playing ? "Pause audio" : "Play audio"}
                className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full disabled:opacity-50",
                    mine ? "bg-white text-black" : "bg-brand-pink text-white",
                )}
            >
                {playing ? (
                    <Pause className="h-4 w-4" fill="currentColor" />
                ) : (
                    <Play
                        className="h-4 w-4 translate-x-0.5"
                        fill="currentColor"
                    />
                )}
            </button>

            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-xs font-medium">
                    {attachment.original_name ?? "Voice message"}
                </span>

                <div
                    onClick={(event) => {
                        const audio = audioRef.current;
                        if (!audio || !duration) return;
                        const rect =
                            event.currentTarget.getBoundingClientRect();
                        audio.currentTime =
                            Math.max(
                                0,
                                Math.min(
                                    1,
                                    (event.clientX - rect.left) / rect.width,
                                ),
                            ) * duration;
                    }}
                    className={cn(
                        "relative h-1.5 cursor-pointer rounded-full",
                        mine ? "bg-white/30" : "bg-muted-foreground/30",
                    )}
                >
                    <div
                        className={cn(
                            "absolute left-0 top-0 h-full rounded-full",
                            mine ? "bg-white" : "bg-brand-pink",
                        )}
                        style={{ width: `${percent}%` }}
                    />
                </div>

                <div
                    className={cn(
                        "flex justify-between gap-2 text-[10px] tabular-nums",
                        mine ? "text-white/70" : "text-muted-foreground",
                    )}
                >
                    <span>{formatDuration(progress)}</span>
                    <span>
                        {failed
                            ? "Unable to load audio"
                            : formatDuration(duration)}
                    </span>
                </div>
            </div>

            <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0"
                aria-label="Open audio file"
            >
                <Download className="h-4 w-4 opacity-70" />
            </a>
        </div>
    );
}

function formatDuration(seconds: number) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainder = Math.floor(seconds % 60);
    return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}
