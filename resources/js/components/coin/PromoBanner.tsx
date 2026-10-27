// resources/js/components/coin/PromoBanner.tsx
import { ChevronRight } from "lucide-react";

export default function PromoBanner() {
    return (
        <button
            type="button"
            className="group mt-4 flex w-full items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-brand-pink/40 hover:bg-accent/40 sm:mt-6 sm:p-5"
        >
            <div className="flex min-w-0 items-center gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-brand-soft text-xl">
                    🤝
                </span>
                <div className="min-w-0">
                    <h3 className="font-semibold text-foreground">
                        Invite friends, earn coins
                    </h3>
                    <p className="truncate text-sm text-muted-foreground">
                        Share your link — you both get rewarded.
                    </p>
                </div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </button>
    );
}
