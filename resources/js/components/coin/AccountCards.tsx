// resources/js/components/coin/AccountCards.tsx
import { Check, ChevronRight, Copy, HandCoins, Sparkles } from "lucide-react";

interface Props {
    username: string;
    initial: string;
    avatarUrl: string | null;
    coins: number;
    inviteCode: string;
    copied: boolean;
    onCopy: () => void;
}

export default function AccountCards({
    username,
    initial,
    avatarUrl,
    coins,
    inviteCode,
    copied,
    onCopy,
}: Props) {
    return (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-brand text-base font-semibold text-white shadow-glow-pink">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={username}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        initial
                    )}
                </div>
                <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">
                        {username}
                    </p>
                    <div className="mt-0.5 inline-flex items-center gap-1.5 rounded-full bg-gradient-brand-soft px-2.5 py-0.5 text-sm font-semibold text-brand-pink">
                        <HandCoins className="h-3.5 w-3.5" />
                        {coins} coin{coins === 1 ? "" : "s"}
                    </div>
                </div>
            </div>

            <button
                type="button"
                onClick={onCopy}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-brand-pink/40 hover:bg-accent/40 sm:p-5"
            >
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-brand-pink" />
                        <span className="font-semibold text-foreground">
                            Invite & earn
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-mono tracking-wide">
                            {inviteCode}
                        </span>
                        {copied ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-green">
                                <Check className="h-3.5 w-3.5" />
                                Copied
                            </span>
                        ) : (
                            <Copy className="h-3.5 w-3.5" />
                        )}
                    </div>
                </div>
            </button>
        </div>
    );
}
