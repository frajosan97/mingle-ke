// resources/js/components/conversation/message-bubble/meta-footer.tsx
import { cn } from "@/lib/utils";
import type { MessageStatus } from "@/types";
import { Ticks } from "./bubbles";

interface Props {
    timeLabel: string;
    status?: MessageStatus;
    read?: boolean;
    delivered?: boolean;
    mine?: boolean;
    onlyMedia: boolean;
}

export default function MetaFooter({
    timeLabel,
    status,
    read,
    delivered,
    mine,
    onlyMedia,
}: Props) {
    if (onlyMedia) {
        return (
            <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] text-white backdrop-blur-sm">
                {timeLabel}
                <Ticks
                    status={status}
                    read={read}
                    delivered={delivered}
                    mine={mine}
                    variant="overlay"
                />
            </span>
        );
    }

    return (
        <span
            className={cn(
                "absolute bottom-1 right-2 flex items-center gap-1 text-[11px] tabular-nums",
                mine ? "text-white/70" : "text-muted-foreground",
            )}
        >
            {timeLabel}
            <Ticks
                status={status}
                read={read}
                delivered={delivered}
                mine={mine}
                variant="inline"
            />
        </span>
    );
}
