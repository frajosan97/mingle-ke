// resources/js/components/partials/escort-onboarding/tabs/videos-tab.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Trash2, UploadCloud } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useFileDrop } from "@/hooks/use-file-drop";
import InputError from "@/components/input-error";

import {
    MAX_VIDEOS,
    MAX_VIDEO_BYTES as MAX_BYTES,
    ACCEPTED_VIDEO_MIME as ACCEPTED,
} from "@/types/escort";

type Props = {
    videoFiles: File[];
    onVideoChange: (files: File[]) => void;
    existingVideos: string[];
    removedVideos: string[];
    onRemoveExisting: (url: string) => void;
    errors: Record<string, string>;
    progress: number | undefined;
};

export default function VideosTab({
    videoFiles,
    onVideoChange,
    existingVideos,
    removedVideos,
    onRemoveExisting,
    errors,
    progress,
}: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [localError, setLocalError] = useState<string | null>(null);

    const objectUrls = useMemo(
        () => videoFiles.map((f) => URL.createObjectURL(f)),
        [videoFiles],
    );
    useEffect(
        () => () => objectUrls.forEach((u) => URL.revokeObjectURL(u)),
        [objectUrls],
    );

    const visibleExisting = existingVideos.filter(
        (u) => !removedVideos.includes(u),
    );
    const totalSlots = visibleExisting.length + videoFiles.length;
    const remaining = MAX_VIDEOS - totalSlots;

    function addFiles(incoming: File[]) {
        setLocalError(null);
        const accepted: File[] = [];
        for (const f of incoming) {
            if (!ACCEPTED.includes(f.type)) {
                setLocalError("Only MP4, WebM or MOV videos are allowed.");
                continue;
            }
            if (f.size > MAX_BYTES) {
                setLocalError(`"${f.name}" exceeds 50 MB.`);
                continue;
            }
            if (
                visibleExisting.length + videoFiles.length + accepted.length >=
                MAX_VIDEOS
            ) {
                setLocalError(`You can upload up to ${MAX_VIDEOS} videos.`);
                break;
            }
            accepted.push(f);
        }
        if (accepted.length) onVideoChange([...videoFiles, ...accepted]);
    }

    const drop = useFileDrop(addFiles);

    function removeNew(index: number) {
        onVideoChange(videoFiles.filter((_, i) => i !== index));
    }

    return (
        <div className="space-y-8">
            <div>
                <Label className="text-sm font-medium text-foreground">
                    Videos
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">
                    Short clips — up to {MAX_VIDEOS} videos, max 50 MB each
                    (MP4, WebM or MOV).
                </p>

                <div
                    {...drop}
                    onClick={() => inputRef.current?.click()}
                    className={cn(
                        "mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition",
                        drop.isDragging
                            ? "border-brand-pink bg-brand-pink/5"
                            : "border-border bg-muted/40 hover:border-brand-pink/40",
                    )}
                >
                    <UploadCloud className="h-7 w-7 text-muted-foreground" />
                    <p className="text-sm font-medium">
                        Drop videos here or{" "}
                        <span className="text-brand-pink">browse</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {remaining > 0
                            ? `${remaining} slot${remaining === 1 ? "" : "s"} remaining`
                            : "Video gallery is full"}
                    </p>
                    <input
                        ref={inputRef}
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                            const files = Array.from(e.target.files ?? []);
                            if (files.length) addFiles(files);
                            e.target.value = "";
                        }}
                    />
                </div>
                <InputError message={localError ?? errors.videos} />
            </div>

            {(visibleExisting.length > 0 || videoFiles.length > 0) && (
                <div>
                    <Label className="text-sm font-medium text-foreground">
                        Uploaded videos
                    </Label>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {visibleExisting.map((url) => (
                            <VideoTile
                                key={url}
                                src={url}
                                onRemove={() => onRemoveExisting(url)}
                            />
                        ))}
                        {videoFiles.map((f, i) => (
                            <VideoTile
                                key={`${f.name}-${i}`}
                                src={objectUrls[i]}
                                onRemove={() => removeNew(i)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {progress !== undefined && (
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
        </div>
    );
}

/* -------------------------------------------------------------------------- */

function VideoTile({ src, onRemove }: { src: string; onRemove: () => void }) {
    const [duration, setDuration] = useState<number | null>(null);

    return (
        <div className="group relative overflow-hidden rounded-xl border border-border bg-black">
            <video
                src={src}
                className="aspect-[9/16] w-full object-cover"
                muted
                playsInline
                preload="metadata"
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            />

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition group-hover:opacity-100">
                <Play className="h-8 w-8 text-white" />
            </div>

            {duration !== null && (
                <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {formatDuration(duration)}
                </span>
            )}

            <button
                type="button"
                onClick={onRemove}
                title="Remove"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition hover:bg-destructive group-hover:opacity-100"
            >
                <Trash2 className="h-3 w-3" />
            </button>
        </div>
    );
}

function formatDuration(seconds: number): string {
    if (!Number.isFinite(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}
