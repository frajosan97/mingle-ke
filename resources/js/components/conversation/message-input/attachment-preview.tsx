// resources/js/components/conversation/message-input/attachment-preview.tsx
import { FileText, Mic, X } from "lucide-react";
import {
    isAudioFile,
    isImageFile,
    isVideoFile,
    type PendingFile,
} from "@/types/message-input";

interface Props {
    files: PendingFile[];
    onRemove: (index: number) => void;
}

export default function AttachmentPreview({ files, onRemove }: Props) {
    if (files.length === 0) return null;

    return (
        <div className="mb-2 flex flex-wrap gap-2 px-1">
            {files.map(({ file, url, category }, index) => {
                const image = isImageFile(file);
                const video = isVideoFile(file);
                const audio = isAudioFile(file);

                return (
                    <div
                        key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                        className="relative flex max-w-full items-center gap-2 rounded-xl border border-border/60 bg-card p-2 pr-9 shadow-sm"
                    >
                        {image ? (
                            <img
                                src={url}
                                alt={file.name}
                                className="h-12 w-12 shrink-0 rounded-lg object-cover"
                            />
                        ) : video ? (
                            <video
                                src={url}
                                className="h-12 w-12 shrink-0 rounded-lg object-cover"
                                muted
                                playsInline
                            />
                        ) : audio ? (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-pink/10 text-brand-pink">
                                <Mic className="h-6 w-6" />
                            </div>
                        ) : (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                                <FileText className="h-6 w-6 text-muted-foreground" />
                            </div>
                        )}

                        <div className="min-w-0 max-w-[180px]">
                            <p className="truncate text-xs font-medium text-foreground">
                                {file.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                                {(file.size / 1024).toFixed(0)} KB
                            </p>
                            {audio && (
                                <audio
                                    src={url}
                                    controls
                                    preload="metadata"
                                    className="mt-1 h-7 w-full max-w-[160px]"
                                />
                            )}
                            <span className="sr-only">{category}</span>
                        </div>

                        <button
                            type="button"
                            onClick={() => onRemove(index)}
                            aria-label={`Remove ${file.name}`}
                            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:bg-destructive/15 hover:text-destructive"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
