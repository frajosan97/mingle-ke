// resources/js/components/coin/PackageCard.tsx
import { Check, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { CoinPackage, MINIMUM_COINS, bonusLabel } from "@/types/coin";

interface Props {
    pkg: CoinPackage;
    isSelected: boolean;
    isCustomValid: boolean;
    customAmount: string;
    customPrice: number;
    onSelect: () => void;
    onCustomChange: (value: string) => void;
}

export default function PackageCard({
    pkg,
    isSelected,
    isCustomValid,
    customAmount,
    customPrice,
    onSelect,
    onCustomChange,
}: Props) {
    const isCustom = pkg.coins === "custom";
    const showError =
        isCustom && isSelected && !isCustomValid && customAmount !== "";
    const showCustomPrice =
        isCustom && isSelected && isCustomValid && customPrice > 0;

    const parsedCustom = parseInt(customAmount, 10);
    const customBonusLabel =
        isCustom && isCustomValid && !isNaN(parsedCustom)
            ? bonusLabel(parsedCustom)
            : null;

    return (
        <button
            type="button"
            onClick={onSelect}
            className={cn(
                "group relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4 text-center transition-all sm:p-5",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink/40",
                isSelected
                    ? "border-brand-pink bg-gradient-brand-soft shadow-glow-pink"
                    : "border-border bg-muted/40 hover:border-brand-pink/40 hover:bg-muted/60",
                showError && "border-red-500/50 bg-red-500/5 shadow-none",
            )}
        >
            {pkg.popular && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-gradient-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-glow-pink">
                    Popular
                </span>
            )}

            {isSelected && !isCustom && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-pink text-white">
                    <Check className="h-3 w-3" />
                </span>
            )}

            <div className="flex w-full items-center justify-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-[10px] font-black italic text-white shadow-inner">
                    <Coins className="h-4 w-4" />
                </span>

                {isCustom && isSelected ? (
                    <input
                        type="number"
                        min={MINIMUM_COINS}
                        value={customAmount}
                        onChange={(e) => onCustomChange(e.target.value)}
                        placeholder="Any"
                        className="w-full min-w-0 border-b-2 border-foreground/30 bg-transparent py-0.5 text-center text-xl font-bold text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-brand-pink sm:text-2xl"
                        autoFocus
                    />
                ) : (
                    <span className="text-xl font-bold text-foreground sm:text-2xl">
                        {isCustom ? "Any" : pkg.coins}
                    </span>
                )}
            </div>

            {isCustom ? (
                showError ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] text-white">
                            x
                        </span>
                        Minimum: {MINIMUM_COINS}
                    </span>
                ) : showCustomPrice ? (
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-foreground">
                            KES {customPrice.toLocaleString()}
                        </span>
                        {customBonusLabel && (
                            <span className="rounded-full bg-brand-green/10 px-2 py-0.5 text-[10px] font-bold text-brand-green">
                                {customBonusLabel}
                            </span>
                        )}
                    </div>
                ) : (
                    <span className="text-xs font-medium text-muted-foreground">
                        {isSelected
                            ? `Minimum: ${MINIMUM_COINS}`
                            : "Large amount supported"}
                    </span>
                )
            ) : (
                <>
                    <span
                        className={cn(
                            "text-sm font-semibold",
                            isSelected
                                ? "text-foreground"
                                : "text-muted-foreground",
                        )}
                    >
                        KES {pkg.price}
                    </span>
                    {pkg.bonus && (
                        <span className="rounded-full bg-brand-green/10 px-2 py-0.5 text-[10px] font-bold text-brand-green">
                            {pkg.bonus}
                        </span>
                    )}
                </>
            )}
        </button>
    );
}
