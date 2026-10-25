import type { MessageAttachment } from "@/types";
import { Download, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FileBubbleProps {
    attachment: MessageAttachment & { url: string };
    mine?: boolean;
    onDownload?: (attachment: MessageAttachment) => void;
}

export default function FileBubble({
    attachment,
    mine,
    onDownload,
}: FileBubbleProps) {
    return (
        <div
            className={cn(
                "flex min-w-0 items-center gap-2 rounded-lg p-2",
                mine ? "bg-black/15 text-white" : "bg-muted/60 text-foreground",
            )}
        >
            <span
                className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    mine
                        ? "bg-white/20 text-white"
                        : "bg-brand-pink/15 text-brand-pink",
                )}
            >
                <FileText className="h-4 w-4" />
            </span>

            <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 hover:underline"
            >
                <span className="block truncate text-xs font-medium">
                    {attachment.original_name ?? "File"}
                </span>

                {attachment.size_bytes != null && (
                    <span
                        className={cn(
                            "block text-[10px]",
                            mine ? "text-white/70" : "text-muted-foreground",
                        )}
                    >
                        {formatBytes(attachment.size_bytes)}
                    </span>
                )}
            </a>

            {onDownload ? (
                <button
                    type="button"
                    onClick={() => onDownload(attachment)}
                    className="shrink-0 rounded-full p-2 hover:bg-black/10"
                    aria-label="Download attachment"
                >
                    <Download className="h-4 w-4" />
                </button>
            ) : (
                <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-full p-2 hover:bg-black/10"
                    aria-label="Open attachment"
                >
                    <Download className="h-4 w-4" />
                </a>
            )}
        </div>
    );
}

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
