import type { MessageAttachment } from "@/types";
import { cn } from "@/lib/utils";

export interface VideoBubbleProps {
    attachment: MessageAttachment & { url: string };
    className?: string;
}

export default function VideoBubble({
    attachment,
    className,
}: VideoBubbleProps) {
    return (
        <div className={cn("relative overflow-hidden bg-black", className)}>
            <video
                src={attachment.url}
                controls
                playsInline
                preload="metadata"
                className="h-full w-full object-contain"
            />
        </div>
    );
}
