import type { MessageAttachment } from "@/types";
import { cn } from "@/lib/utils";
import ImageBubble from "./image-bubble";
import VideoBubble from "./video-bubble";

export interface MediaGridBubbleProps {
    attachments: (MessageAttachment & { url: string })[];
    onDownload?: (attachment: MessageAttachment) => void;
    onMediaClick?: (url: string) => void;
}

function typeOf(attachment: MessageAttachment): "image" | "video" {
    const type = String(attachment.type ?? "").toLowerCase();
    if (type === "video") return "video";
    const mime = attachment.mime_type?.toLowerCase() ?? "";
    if (mime.startsWith("video/")) return "video";
    return "image";
}

export default function MediaGridBubble({
    attachments,
    onDownload,
    onMediaClick,
}: MediaGridBubbleProps) {
    const count = attachments.length;

    return (
        <div
            className={cn(
                "mb-1 grid w-full max-w-[320px] gap-0.5 overflow-hidden rounded-lg",
                count === 1 ? "grid-cols-1" : "grid-cols-2",
            )}
        >
            {attachments.map((attachment, index) => {
                const type = typeOf(attachment);
                const showOverlay = count > 4 && index === 3;

                const cellClass = cn(
                    "group/media relative min-h-24 min-w-0 overflow-hidden bg-black",
                    count === 1
                        ? "max-h-80"
                        : count === 2
                          ? "aspect-square"
                          : index === 0
                            ? "row-span-2 aspect-[1/2]"
                            : "aspect-square",
                );

                return (
                    <div key={attachment.id} className={cellClass}>
                        {type === "video" ? (
                            <VideoBubble
                                attachment={attachment}
                                className="h-full w-full"
                            />
                        ) : (
                            <ImageBubble
                                attachment={attachment}
                                onDownload={onDownload}
                                onMediaClick={onMediaClick}
                                className="h-full w-full"
                            />
                        )}

                        {showOverlay && (
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50 text-2xl font-semibold text-white">
                                +{count - 4}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
