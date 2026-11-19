import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface SectionCardProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    meta?: ReactNode;
    children: ReactNode;
    className?: string;
}

export function SectionCard({
    icon: Icon,
    title,
    description,
    meta,
    children,
    className = "",
}: SectionCardProps) {
    return (
        <section
            className={`overflow-hidden rounded-xl border bg-card ${className}`}
        >
            <div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />

                    <div>
                        <h2 className="font-semibold">{title}</h2>
                        {description && (
                            <p className="text-sm text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>
                </div>

                {meta && (
                    <span className="text-sm text-muted-foreground">
                        {meta}
                    </span>
                )}
            </div>

            {children}
        </section>
    );
}
