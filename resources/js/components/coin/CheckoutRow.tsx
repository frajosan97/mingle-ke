// resources/js/components/coin/CheckoutRow.tsx
import { Check, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PurchaseStatus } from "@/pages/coin";

interface Props {
    canRecharge: boolean;
    finalPrice: number;
    submitting: boolean;
    status: PurchaseStatus;
    onRecharge: () => void;
}

export default function CheckoutRow({
    canRecharge,
    finalPrice,
    submitting,
    status,
    onRecharge,
}: Props) {
    const isPending = status === "pending";

    return (
        <div className="mt-6 flex flex-col gap-5 border-t border-border pt-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-4">
                <div>
                    <p className="mb-2 text-sm font-medium text-muted-foreground">
                        Payment method
                    </p>
                    <button
                        type="button"
                        className="flex w-max items-center gap-3 rounded-xl border border-brand-pink/30 bg-brand-pink/5 px-4 py-2.5 transition-all hover:border-brand-pink/50 hover:bg-brand-pink/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink/40"
                    >
                        <div className="flex h-6 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-white p-1">
                            <img
                                src="/storage/icons/mpesa.png"
                                alt="M-Pesa"
                                className="h-full w-full object-contain"
                            />
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                            M-PESA
                        </span>
                        <div className="ml-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand-pink text-white">
                            <Check className="h-2.5 w-2.5" strokeWidth={3} />
                        </div>
                    </button>
                </div>

                <div>
                    <p className="text-sm font-medium text-muted-foreground">
                        Total
                    </p>
                    <p className="text-2xl font-bold text-foreground transition-all">
                        {finalPrice > 0
                            ? `KES ${finalPrice.toLocaleString()}`
                            : "KES —"}
                    </p>
                </div>
            </div>

            <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:items-end">
                <button
                    type="button"
                    onClick={onRecharge}
                    disabled={!canRecharge || isPending}
                    className={cn(
                        "w-full rounded-xl bg-gradient-brand px-6 py-3 text-sm font-semibold text-white shadow-glow-pink transition-all sm:w-64",
                        "hover:shadow-glow-pink-strong",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink/50",
                        "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
                    )}
                >
                    {submitting ? (
                        <span className="inline-flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing…
                        </span>
                    ) : isPending ? (
                        <span className="inline-flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Waiting for M-PESA…
                        </span>
                    ) : (
                        "Recharge"
                    )}
                </button>

                {status !== "idle" && (
                    <div
                        className={cn(
                            "inline-flex items-center gap-1.5 self-start rounded-full border px-3 py-1 text-[11px] font-semibold sm:self-end",
                            status === "pending" &&
                                "border-amber-400/40 bg-amber-50 text-amber-700",
                            status === "done" &&
                                "border-green-500/30 bg-green-50 text-green-700",
                            status === "failed" &&
                                "border-red-500/30 bg-red-50 text-red-700",
                        )}
                    >
                        {status === "pending" && (
                            <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Check your phone for the M-PESA PIN prompt
                            </>
                        )}
                        {status === "done" && (
                            <>
                                <Check className="h-3 w-3" />
                                Coins added — thanks!
                            </>
                        )}
                        {status === "failed" && (
                            <>Payment not completed — try again</>
                        )}
                    </div>
                )}

                <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-brand-green/30 bg-brand-green/10 px-3 py-1 text-brand-green sm:self-end">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                        Secure payment
                    </span>
                </div>
            </div>
        </div>
    );
}
