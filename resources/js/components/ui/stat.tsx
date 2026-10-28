// resources/js/components/ui/stat.tsx
import type { ReactNode } from "react";

type StatProps = {
    /** The bold value — number, string, or any node. */
    value: ReactNode;
    /** The muted label under the value. */
    label: string;
    /** Optional icon rendered before the label (e.g. Star, Eye, Heart). */
    icon?: ReactNode;
    /** Optional className passthrough for one-off tweaks. */
    className?: string;
};

/**
 * Single stat block used on profile headers.
 * Renders value + label vertically, muted on the label.
 */
export function Stat({ value, label, icon, className = "" }: StatProps) {
    return (
        <div
            className={`flex flex-col items-center md:items-start ${className}`}
        >
            <span className="text-base font-bold text-foreground">{value}</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                {icon}
                {label}
            </span>
        </div>
    );
}

/**
 * Optional wrapper when you want the stats in a single row with
 * separator dots / dividers between them. Mirrors the `gap-6` layout
 * already used in the header, but extracts the divider logic.
 */
export function StatGroup({
    children,
    className = "",
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`flex items-center justify-center gap-6 md:justify-start ${className}`}
        >
            {children}
        </div>
    );
}

/**
 * Optional visual separator — renders a thin vertical rule between
 * two `<Stat>` elements. Use `<StatDivider />` between each stat when
 * you switch to a horizontally-divided layout.
 */
export function StatDivider() {
    return <span aria-hidden="true" className="h-6 w-px bg-border" />;
}
