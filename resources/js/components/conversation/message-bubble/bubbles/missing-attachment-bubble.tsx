// resources/js/components/conversation/bubble/missing-attachment-bubble.tsx
import { FileWarning } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MessageAttachment } from "@/types";

interface Props {
    attachment: MessageAttachment;
    mine?: boolean;
}

export default function MissingAttachmentBubble({ attachment, mine }: Props) {
    return (
        <div
            className={cn(
                "flex items-center gap-2 rounded-lg p-2 text-xs",
                mine
                    ? "bg-black/15 text-white"
                    : "bg-muted text-muted-foreground",
            )}
        >
            <FileWarning className="h-4 w-4 shrink-0" />
            <span className="min-w-0 break-words">
                {attachment.original_name ?? "Attachment"} — file URL is missing
            </span>
        </div>
    );
}
