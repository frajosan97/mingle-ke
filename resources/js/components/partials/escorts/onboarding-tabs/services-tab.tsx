import { useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import InputError from "@/components/input-error";
import { SERVICE_OPTIONS } from "@/types/escort";
import { cn } from "@/lib/utils";

export default function ServicesTab({
    services,
    onChange,
    error,
}: {
    services: string[];
    onChange: (next: string[]) => void;
    error?: string;
}) {
    const [query, setQuery] = useState("");

    const allSelected = services.length === SERVICE_OPTIONS.length;

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return SERVICE_OPTIONS;
        return SERVICE_OPTIONS.filter((svc) => svc.toLowerCase().includes(q));
    }, [query]);

    const toggle = (svc: string) =>
        onChange(
            services.includes(svc)
                ? services.filter((s) => s !== svc)
                : [...services, svc],
        );

    const hasSelection = services.length > 0;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm text-muted-foreground">
                        Select everything you offer. This is what clients filter
                        by.
                    </p>
                    {hasSelection && (
                        <p className="mt-1 text-xs font-medium text-brand-pink">
                            {services.length} selected
                        </p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() =>
                        onChange(allSelected ? [] : [...SERVICE_OPTIONS])
                    }
                    className={cn(
                        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                        allSelected
                            ? "border-brand-pink bg-primary-soft text-brand-pink"
                            : "border-border bg-card text-foreground hover:border-brand-pink/40",
                    )}
                >
                    {allSelected ? "Clear all" : "Select all"}
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search services…"
                    className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-pink focus:outline-none focus:ring-2 focus:ring-brand-pink/20"
                />
                {query && (
                    <button
                        type="button"
                        onClick={() => setQuery("")}
                        className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label="Clear search"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {/* Chips */}
            {filtered.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                    No services match “{query}”.
                </p>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {filtered.map((svc) => {
                        const active = services.includes(svc);
                        return (
                            <button
                                key={svc}
                                type="button"
                                onClick={() => toggle(svc)}
                                className={cn(
                                    "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
                                    active
                                        ? "border-brand-pink bg-primary-soft text-brand-pink"
                                        : "border-border bg-card text-muted-foreground hover:border-brand-pink/40 hover:text-foreground",
                                )}
                            >
                                {active && (
                                    <Check className="mr-1 inline h-3 w-3" />
                                )}
                                {svc}
                            </button>
                        );
                    })}
                </div>
            )}

            <InputError message={error} />
        </div>
    );
}
