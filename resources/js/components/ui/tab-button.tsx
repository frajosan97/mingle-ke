// resources/js/components/ui/tab-button.tsx
import type { ReactNode } from "react";

export function TabButton({
    active,
    onClick,
    icon,
    label,
    count,
}: {
    active: boolean;
    onClick: () => void;
    icon: ReactNode;
    label: string;
    count?: number;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 pb-3 text-sm font-semibold transition-colors ${
                active
                    ? "border-b-2 border-brand-pink text-foreground"
                    : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
            {icon}
            {label}
            {typeof count === "number" && (
                <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        active
                            ? "bg-gradient-brand-soft text-brand-pink"
                            : "bg-accent text-muted-foreground"
                    }`}
                >
                    {count}
                </span>
            )}
        </button>
    );
}
