// resources/js/components/conversation/bubble/ticks.tsx
import { Check, CheckCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MessageStatus } from "@/types";

interface Props {
    status?: MessageStatus;
    read?: boolean;
    delivered?: boolean;
    mine?: boolean;
    variant: "inline" | "overlay";
}

function resolveStatus(
    status: MessageStatus | undefined,
    read: boolean | undefined,
    delivered: boolean | undefined,
): MessageStatus {
    if (status) return status;
    if (read) return "read";
    if (delivered) return "delivered";
    return "sent";
}

export default function Ticks({
    status,
    read,
    delivered,
    mine,
    variant,
}: Props) {
    if (!mine) return null;

    const resolved = resolveStatus(status, read, delivered);

    const iconSize = variant === "overlay" ? "h-3 w-3" : "h-3.5 w-3.5";
    const mutedColor =
        variant === "overlay" ? "text-white/70" : "text-white/80";
    const readColor = "text-brand-pink";

    if (resolved === "pending") {
        return (
            <Clock
                className={cn(iconSize, mutedColor, "animate-pulse")}
                aria-label="Sending"
            />
        );
    }
    if (resolved === "read") {
        return (
            <CheckCheck className={cn(iconSize, readColor)} aria-label="Read" />
        );
    }
    if (resolved === "delivered") {
        return (
            <CheckCheck
                className={cn(iconSize, mutedColor)}
                aria-label="Delivered"
            />
        );
    }
    return <Check className={cn(iconSize, mutedColor)} aria-label="Sent" />;
}
