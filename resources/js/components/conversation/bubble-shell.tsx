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
                    "relative max-w-[75%] text-sm shadow-sm md:max-w-[65%]",
                    // Outgoing: brand gradient. Incoming: card surface.
                    mine
                        ? "rounded-2xl rounded-tr-md bg-gradient-brand text-white shadow-glow-pink/20"
                        : "rounded-2xl rounded-tl-md border border-border/60 bg-card text-card-foreground",
                    bare ? "overflow-hidden p-0.5" : "px-3 pb-1.5 pt-2",

                    // Tail — use rounded corners instead of clip-path
                    // (cleaner, theme-agnostic, matches modern chat UIs)
                    className,
                )}
            >
                {children}
            </div>
        </div>
    );
}
