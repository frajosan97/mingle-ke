import type { LucideIcon } from "lucide-react";

export interface StatusBadgeConfig {
    label: string;
    icon: LucideIcon;
    className: string;
}

export function StatusBadge({ config }: { config: StatusBadgeConfig }) {
    const Icon = config.icon;

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}
        >
            <Icon className="h-3.5 w-3.5" />
            {config.label}
        </span>
    );
}
