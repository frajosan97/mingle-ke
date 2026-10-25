import type { MessageAttachment } from "@/types";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ImageBubbleProps {
    attachment: MessageAttachment & { url: string };
    mine?: boolean;
    onDownload?: (attachment: MessageAttachment) => void;
    onMediaClick?: (url: string) => void;
    className?: string;
}

export default function ImageBubble({
    attachment,
    onDownload,
    onMediaClick,
    className,
}: ImageBubbleProps) {
    return (
        <div className={cn("group/media relative overflow-hidden", className)}>
            <img
                src={attachment.url}
                alt={attachment.original_name ?? "Image"}
                loading="lazy"
                decoding="async"
                onClick={() => onMediaClick?.(attachment.url)}
                onError={() => {
                    // Silenced: broken media shows as empty box; avoid console spam.
                }}
                className="h-full w-full cursor-pointer object-contain transition-transform group-hover/media:scale-[1.02]"
            />

            {onDownload && (
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onDownload(attachment);
                    }}
                    className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition hover:bg-black/70 group-hover/media:opacity-100 focus:opacity-100"
                    aria-label={`Download ${attachment.original_name ?? "image"}`}
                >
                    <Download className="h-3.5 w-3.5" />
                </button>
            )}
        </div>
    );
}
