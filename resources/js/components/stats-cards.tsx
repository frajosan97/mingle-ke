// resources/js/components/stats-cards.tsx
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const easeOut = [0.16, 1, 0.3, 1] as const;

export type StatCardTone = "success" | "warning" | "danger";

export interface StatCardData {
    id: string;
    label: string;
    value: React.ReactNode;
    icon: React.ComponentType<{ className?: string }>;
    hint?: React.ReactNode;
    accent?: boolean;
    tone?: StatCardTone;
    className?: string;
}

export interface StatsCardsProps {
    data: StatCardData[];
    className?: string;
    staggerDelay?: number;
    cols?: number;
}

export function StatsCards({
    data,
    className,
    staggerDelay = 0.05,
    cols,
}: StatsCardsProps) {
    if (data.length === 0) return null;

    // Pre-defined map of classes so Tailwind doesn't purge them in production
    const colClasses: Record<number, string> = {
        1: "grid-cols-1",
        2: "grid-cols-1 sm:grid-cols-2",
        3: "grid-cols-1 sm:grid-cols-3",
        4: "grid-cols-2 md:grid-cols-4",
        5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
        6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
    };

    // Use the explicit `cols` prop if provided, otherwise use the fallback auto-fit
    const gridClass = cols
        ? colClasses[cols] ||
          `grid-cols-1 sm:grid-cols-2 md:grid-cols-${Math.min(cols, 12)}`
        : cn(
              // Original default behavior
              data.length === 1 && "grid-cols-1",
              data.length === 2 && "grid-cols-1 sm:grid-cols-2",
              data.length === 3 && "grid-cols-1 sm:grid-cols-3",
              data.length === 4 && "grid-cols-2 md:grid-cols-4",
              data.length >= 5 &&
                  "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
          );

    return (
        <div className={cn("grid gap-3", gridClass, className)}>
            {data.map((stat, idx) => (
                <StatCardItem
                    key={stat.id}
                    {...stat}
                    delay={idx * staggerDelay}
                />
            ))}
        </div>
    );
}

function StatCardItem({
    icon: Icon,
    label,
    value,
    hint,
    accent,
    tone,
    className,
    delay = 0,
}: StatCardData & { delay?: number }) {
    const toneRing =
        tone === "success"
            ? "border-emerald-500/30"
            : tone === "warning"
              ? "border-amber-500/30"
              : tone === "danger"
                ? "border-red-500/30"
                : "";

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay, ease: easeOut }}
            className={cn(
                "group relative overflow-hidden rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md",
                accent && "border-primary/30",
                toneRing,
                className,
            )}
        >
            <div
                aria-hidden
                className={cn(
                    "pointer-events-none absolute inset-0 opacity-[0.04] transition-opacity duration-500 group-hover:opacity-[0.07]",
                    "[background-image:radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] [background-size:12px_12px]",
                    accent ? "text-primary" : "text-foreground",
                )}
            />

            <div
                aria-hidden
                className={cn(
                    "absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-[0.06] transition-transform duration-500 group-hover:scale-125",
                    accent ? "bg-primary" : "bg-foreground",
                )}
            />

            <div className="relative">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {Icon && <Icon className="h-3.5 w-3.5" />}
                    {label}
                </div>
                <div className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                    {value}
                </div>
                {hint && (
                    <div className="mt-0.5 text-xs text-muted-foreground">
                        {hint}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
