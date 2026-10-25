// resources/js/components/coins/top-up-modal.tsx
import { Link } from "@inertiajs/react";
import { Coins } from "lucide-react";
import { useCoins } from "@/contexts/coins-context";
import { cn } from "@/lib/utils";

export default function TopUpModal() {
    const { isOpen, prompt, close } = useCoins();

    if (!isOpen || !prompt) return null;

    const shortfall = Math.max(0, prompt.required - prompt.available);

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="top-up-title"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={close}
        >
            <div
                className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-brand-soft text-brand-pink">
                        <Coins className="h-5 w-5" />
                    </span>
                    <h2
                        id="top-up-title"
                        className="text-lg font-semibold text-foreground"
                    >
                        Not enough coins
                    </h2>
                </div>

                <p className="mt-4 text-sm text-muted-foreground">
                    This message costs{" "}
                    <strong className="text-foreground">
                        {prompt.required}
                    </strong>{" "}
                    coin{prompt.required === 1 ? "" : "s"}, but you only have{" "}
                    <strong className="text-foreground">
                        {prompt.available}
                    </strong>
                    . Top up{" "}
                    <strong className="text-foreground">{shortfall}</strong>{" "}
                    more to send it.
                </p>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={close}
                        className={cn(
                            "rounded-xl px-4 py-2 text-sm font-medium",
                            "text-muted-foreground hover:bg-accent hover:text-foreground",
                            "transition-colors",
                        )}
                    >
                        Cancel
                    </button>

                    <Link
                        href="/coins"
                        onClick={close}
                        className={cn(
                            "rounded-xl px-4 py-2 text-sm font-semibold text-white",
                            "bg-gradient-brand shadow-glow-pink transition-all",
                            "hover:shadow-glow-pink-strong",
                        )}
                    >
                        <Coins className="mr-2 h-4 w-4" />
                        Get Coints
                    </Link>
                </div>
            </div>
        </div>
    );
}
