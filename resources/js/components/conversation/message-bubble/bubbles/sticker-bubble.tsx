import type { MessageAttachment } from "@/types";

export interface StickerBubbleProps {
    attachment: MessageAttachment & { url: string };
    onMediaClick?: (url: string) => void;
}

export default function StickerBubble({
    attachment,
    onMediaClick,
}: StickerBubbleProps) {
    return (
        <div className="cursor-pointer p-1">
            <img
                src={attachment.url}
                alt={attachment.original_name ?? "Sticker"}
                loading="lazy"
                decoding="async"
                onClick={() => onMediaClick?.(attachment.url)}
                className="h-32 w-32 object-contain"
            />
        </div>
    );
}
