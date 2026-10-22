// resources/js/components/appearance-toggle-tab.tsx
import type { LucideIcon } from "lucide-react";
import { Monitor, Moon, Sun } from "lucide-react";
import type { HTMLAttributes } from "react";
import type { Appearance } from "@/hooks/use-appearance";
import { useAppearance } from "@/hooks/use-appearance";
import { cn } from "@/lib/utils";

export default function AppearanceToggleTab({
    className = "",
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();

    const tabs: { value: Appearance; icon: LucideIcon; label: string }[] = [
        { value: "light", icon: Sun, label: "Light" },
        { value: "dark", icon: Moon, label: "Dark" },
        { value: "system", icon: Monitor, label: "System" },
    ];

    return (
        <div
            className={cn(
                "inline-flex gap-1 rounded-xl border border-border bg-muted/60 p-1",
                className,
            )}
            {...props}
        >
            {tabs.map(({ value, icon: Icon, label }) => {
                const isActive = appearance === value;
                return (
                    <button
                        key={value}
                        onClick={() => updateAppearance(value)}
                        className={cn(
                            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
                            isActive
                                ? "bg-card text-brand-pink shadow-sm ring-1 ring-border/50"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground",
                        )}
                    >
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                    </button>
                );
            })}
        </div>
    );
}
