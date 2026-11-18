import { useEffect, useState } from "react";
import {
    ArrowDownToLine,
    Banknote,
    Coins,
    LoaderCircle,
    Phone,
    Wallet,
} from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface WithdrawalDialogProps {
    pointsBalance: number;
    conversionRate: number;
    minimumPoints: number;
    phone: string | null;
    phoneConfigured?: boolean;
    mpesaAvailable?: boolean;
    paybill?: string | null;
    submitting: boolean;
    onSubmit: (points: number) => void;
}

export default function WithdrawalDialog({
    pointsBalance,
    conversionRate,
    minimumPoints,
    phone,
    phoneConfigured = true,
    mpesaAvailable = true,
    paybill,
    submitting,
    onSubmit,
}: WithdrawalDialogProps) {
    const [open, setOpen] = useState(false);
    const [points, setPoints] = useState("");

    const parsedPoints = points === "" ? 0 : Number(points);

    const isValidAmount =
        Number.isSafeInteger(parsedPoints) &&
        parsedPoints >= minimumPoints &&
        parsedPoints <= pointsBalance;

    const estimatedCash = isValidAmount ? parsedPoints * conversionRate : 0;

    const canWithdraw =
        pointsBalance >= minimumPoints &&
        phoneConfigured &&
        mpesaAvailable &&
        isValidAmount &&
        !submitting;

    useEffect(() => {
        if (!open) {
            setPoints("");
        }
    }, [open]);

    const handlePointsChange = (value: string) => {
        setPoints(value.replace(/\D/g, ""));
    };

    const handleSubmit = () => {
        if (!canWithdraw) return;
        onSubmit(parsedPoints);
    };

    // The dialog trigger must not exist until the minimum balance is reached.
    if (pointsBalance < minimumPoints) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    type="button"
                    disabled={!phoneConfigured || !mpesaAvailable}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <ArrowDownToLine className="h-4 w-4" />
                    Withdraw points
                </button>
            </DialogTrigger>

            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Banknote className="h-5 w-5" />
                    </div>

                    <DialogTitle>Withdraw your points</DialogTitle>

                    <DialogDescription>
                        Convert your available points into cash and receive your
                        payout through M-PESA.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    <div className="rounded-xl border bg-muted/40 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Wallet className="h-4 w-4" />
                                Available points
                            </div>

                            <span className="font-semibold tabular-nums">
                                {pointsBalance.toLocaleString()}
                            </span>
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                            <span className="text-muted-foreground">
                                Minimum withdrawal
                            </span>

                            <span className="font-medium tabular-nums">
                                {minimumPoints.toLocaleString()} points
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="withdrawal-points"
                            className="text-sm font-medium"
                        >
                            Points to withdraw
                        </label>

                        <div className="relative">
                            <Coins className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                            <input
                                id="withdrawal-points"
                                type="text"
                                inputMode="numeric"
                                autoComplete="off"
                                placeholder={`Minimum ${minimumPoints}`}
                                value={points}
                                onChange={(event) =>
                                    handlePointsChange(event.target.value)
                                }
                                className="h-11 w-full rounded-lg border bg-background pl-10 pr-20 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />

                            <button
                                type="button"
                                onClick={() => setPoints(String(pointsBalance))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary hover:underline"
                            >
                                MAX
                            </button>
                        </div>

                        {points !== "" && parsedPoints < minimumPoints && (
                            <p className="text-xs text-destructive">
                                You must withdraw at least{" "}
                                {minimumPoints.toLocaleString()} points.
                            </p>
                        )}

                        {parsedPoints > pointsBalance && (
                            <p className="text-xs text-destructive">
                                You do not have enough points.
                            </p>
                        )}
                    </div>

                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                        <p className="text-sm text-muted-foreground">
                            Estimated payout
                        </p>

                        <p className="mt-1 text-2xl font-bold tabular-nums">
                            KES{" "}
                            {estimatedCash.toLocaleString("en-KE", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                            Conversion rate: {conversionRate} KES per point
                        </p>
                    </div>

                    <div className="rounded-xl border p-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-xs text-muted-foreground">
                                    M-PESA destination
                                </p>

                                <p className="truncate text-sm font-semibold">
                                    {phone || "No phone number configured"}
                                </p>
                            </div>
                        </div>

                        {paybill && (
                            <p className="mt-2 text-xs text-muted-foreground">
                                Paybill: {paybill}
                            </p>
                        )}
                    </div>

                    {!phoneConfigured && (
                        <p className="text-sm text-destructive">
                            Configure your phone number before requesting a
                            withdrawal.
                        </p>
                    )}

                    {!mpesaAvailable && (
                        <p className="text-sm text-destructive">
                            M-PESA payouts are currently unavailable.
                        </p>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-2">
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={() => setOpen(false)}
                        className="rounded-lg border px-4 py-2.5 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        disabled={!canWithdraw}
                        onClick={handleSubmit}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {submitting ? (
                            <>
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <ArrowDownToLine className="h-4 w-4" />
                                Confirm withdrawal
                            </>
                        )}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
