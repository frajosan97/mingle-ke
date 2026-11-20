import type { ReactNode } from "react";
import { Link, router } from "@inertiajs/react";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const easeOut = [0.16, 1, 0.3, 1] as const;

export interface PageHeaderProps {
    title?: string;
    description?: string;
    icon?: ReactNode;
    meta?: ReactNode;
    statuses?: ReactNode;
    backHref?: string;
    backHrefTitle?: string;
    onRefresh?: () => void;
    isRefreshing?: boolean;
    actions?: ReactNode;
    className?: string;
}

export function PageHeader({
    title,
    description,
    icon,
    meta,
    statuses,
    backHref,
    backHrefTitle = "Back",
    onRefresh,
    isRefreshing = false,
    actions,
    className,
}: PageHeaderProps) {
    const handleRefresh = () => {
        if (onRefresh) {
            onRefresh();
        } else {
            router.reload();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: easeOut }}
            className={cn(
                "flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-6",
                className,
            )}
        >
            {/* Left Side */}
            <div className="flex min-w-0 flex-col gap-1.5">
                {backHref && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-2 -mt-1 h-6 w-fit gap-1 px-2 text-muted-foreground hover:text-foreground md:hidden"
                        asChild
                    >
                        <Link href={backHref}>
                            <ArrowLeft className="h-3.5 w-3.5" />
                            <span>{backHrefTitle}</span>
                        </Link>
                    </Button>
                )}

                <div className="flex min-w-0 items-start gap-2">
                    {icon && (
                        <div className="flex shrink-0 items-center pt-0.5">
                            {icon}
                        </div>
                    )}

                    <div className="flex min-w-0 flex-col">
                        {title && (
                            <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">
                                {title}
                            </h1>
                        )}

                        {description && (
                            <p className="mt-0.5 max-w-2xl text-sm leading-snug text-muted-foreground">
                                {description}
                            </p>
                        )}

                        {meta && (
                            <div className="mt-1 flex flex-wrap items-center text-sm text-muted-foreground">
                                {meta}
                            </div>
                        )}

                        {statuses && (
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                {statuses}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Side */}
            <div className="flex shrink-0 items-center gap-1.5">
                {onRefresh !== undefined && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 px-2.5 text-muted-foreground"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                    >
                        <RefreshCw
                            className={cn(
                                "h-3.5 w-3.5",
                                isRefreshing && "animate-spin",
                            )}
                        />
                        Refresh
                    </Button>
                )}

                {actions && (
                    <div className="ml-0.5 flex items-center gap-1 border-l border-border pl-1.5">
                        {actions}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
