// resources/js/components/conversation/bubble-shell.tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
    mine: boolean;
    children: ReactNode;
    bare?: boolean;
    className?: string;
}

export default function BubbleShell({
    mine,
    children,
    bare = false,
    className,
}: Props) {
    return (
        <div
            className={cn(
                "flex w-full",
                mine ? "justify-end" : "justify-start",
            )}
        >
            <div
                className={cn(
                    "relative max-w-[75%] text-sm md:max-w-[65%]",
                    // Outgoing: brand gradient. Incoming: card surface.
                    mine
                        ? "rounded-2xl rounded-tr-md bg-gradient-brand text-white shadow-md ring-1 ring-black/5"
                        : "rounded-2xl rounded-tl-md border border-border/60 bg-card text-card-foreground shadow-sm",
                    // Bare mode: media takes the full bubble; timestamp
                    // overlay sits on top of the media (see MessageBubble).
                    // Non-bare mode: leave room for inline meta at bottom.
                    bare ? "overflow-hidden p-0.5" : "px-3 pb-2 pt-2",
                    className,
                )}
            >
                {children}
            </div>
        </div>
    );
}
