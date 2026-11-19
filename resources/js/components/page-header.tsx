import { ReactNode } from "react";
import { Link, router } from "@inertiajs/react";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const easeOut = [0.16, 1, 0.3, 1] as const;

export interface PageHeaderProps {
    title: string;
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
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easeOut }}
            className={cn(
                "flex flex-col gap-3 md:flex-row md:items-start md:justify-between",
                className,
            )}
        >
            {/* Left Side: Icon, Title, Description, Meta, Statuses */}
            <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                    {icon && (
                        <div className="flex shrink-0 items-center">{icon}</div>
                    )}

                    <div className="flex min-w-0 flex-col">
                        <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">
                            {title}
                        </h1>

                        {description && (
                            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                                {description}
                            </p>
                        )}

                        {meta && (
                            <div className="mt-2 flex flex-wrap items-center text-sm text-muted-foreground">
                                {meta}
                            </div>
                        )}
                    </div>
                </div>

                {/* Statuses */}
                {statuses && (
                    <div className="flex flex-wrap items-center gap-2">
                        {statuses}
                    </div>
                )}
            </div>

            {/* Right Side: Action Buttons */}
            <div className="flex shrink-0 items-center gap-2 pt-1 md:pt-0">
                {backHref && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-muted-foreground"
                        asChild
                    >
                        <Link href={backHref}>
                            <ArrowLeft className="h-3.5 w-3.5" />
                            {backHrefTitle}
                        </Link>
                    </Button>
                )}

                {onRefresh !== undefined && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-muted-foreground"
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
                    <div className="ml-1 flex items-center gap-1 border-l border-border pl-2">
                        {actions}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
