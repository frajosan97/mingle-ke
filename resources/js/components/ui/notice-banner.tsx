import type { LucideIcon } from "lucide-react";
import { Link } from "@inertiajs/react";
import type { ReactNode } from "react";

type NoticeVariant = "warning" | "destructive" | "info";

interface NoticeBannerProps {
    variant?: NoticeVariant;
    icon: LucideIcon;
    title: string;
    description: ReactNode;
    action?: {
        label: string;
        href: string;
    };
    /** Renders as a small pill next to the title */
    badge?: string;
}

const variantStyles: Record<
    NoticeVariant,
    {
        container: string;
        iconWrap: string;
        iconColor: string;
        action: string;
        badge: string;
    }
> = {
    warning: {
        container: "border-amber-500/30 bg-amber-500/5",
        iconWrap: "bg-amber-500/10",
        iconColor: "text-amber-600",
        action: "bg-amber-600 text-white hover:bg-amber-700",
        badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    },
    destructive: {
        container: "border-destructive/30 bg-destructive/5",
        iconWrap: "bg-destructive/10",
        iconColor: "text-destructive",
        action: "border border-destructive/30 text-destructive hover:bg-destructive/10",
        badge: "bg-destructive/10 text-destructive",
    },
    info: {
        container: "border-border bg-muted/30",
        iconWrap: "bg-muted",
        iconColor: "text-muted-foreground",
        action: "border border-border hover:bg-muted",
        badge: "bg-muted text-muted-foreground",
    },
};

export function NoticeBanner({
    variant = "warning",
    icon: Icon,
    title,
    description,
    action,
    badge,
}: NoticeBannerProps) {
    const styles = variantStyles[variant];

    return (
        <section
            className={`flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 ${styles.container}`}
        >
            <div className="flex items-start gap-3">
                <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-full ${styles.iconWrap} ${styles.iconColor}`}
                >
                    <Icon className="size-5" />
                </div>

                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-foreground">
                            {title}
                        </h3>
                        {badge && (
                            <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles.badge}`}
                            >
                                {badge}
                            </span>
                        )}
                    </div>

                    <div className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {description}
                    </div>
                </div>
            </div>

            {action && (
                <Link
                    href={action.href}
                    className={`inline-flex shrink-0 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${styles.action}`}
                >
                    {action.label}
                </Link>
            )}
        </section>
    );
}
