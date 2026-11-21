import { useEffect, useRef, useState, type ReactNode } from "react";
import { CalendarDays, Copy, Wallet, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export type ManualPaymentIntent = {
    bill_ref: string;
    amount: number;
    currency: string;
    expires_at: string;
};

type PaymentMethod = "stk" | "manual";

type PaymentMethodSelectorProps = {
    amount: number;
    currency?: string;
    stkContent: ReactNode;
    manualIntent: ManualPaymentIntent | null;
    manualIntentLoading?: boolean;
    disabled?: boolean;
    paybill?: string | null;
    onGenerateReference: () => void;
    onMethodChange?: (method: PaymentMethod) => void;
};

function formatMoney(amount: number, currency: string): string {
    try {
        return new Intl.NumberFormat("en-KE", {
            style: "currency",
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(amount);
    } catch {
        return `${currency} ${amount.toFixed(2)}`;
    }
}

function formatDate(value: string): string {
    if (!value) return "Not provided";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Not available";

    return new Intl.DateTimeFormat("en-KE", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

export default function PaymentMethodSelector({
    amount,
    currency = "KES",
    stkContent,
    manualIntent,
    manualIntentLoading = false,
    disabled = false,
    paybill,
    onGenerateReference,
    onMethodChange,
}: PaymentMethodSelectorProps) {
    const [method, setMethod] = useState<PaymentMethod>("stk");
    const generationRequested = useRef(false);

    // Generate a payment reference automatically when manual payment is selected.
    useEffect(() => {
        if (method === "stk") {
            generationRequested.current = false;
            return;
        }

        if (
            method === "manual" &&
            !manualIntent &&
            !manualIntentLoading &&
            !generationRequested.current &&
            !disabled
        ) {
            generationRequested.current = true;
            onGenerateReference();
        }
    }, [
        method,
        manualIntent,
        manualIntentLoading,
        disabled,
        onGenerateReference,
    ]);

    function changeMethod(value: PaymentMethod) {
        setMethod(value);
        onMethodChange?.(value);
    }

    async function copyValue(value: string, label: string) {
        try {
            await navigator.clipboard.writeText(value);
            toast.success(`${label} copied`);
        } catch {
            toast.error(`Unable to copy ${label.toLowerCase()}.`);
        }
    }

    const amountToPay = manualIntent
        ? formatMoney(manualIntent.amount, manualIntent.currency)
        : formatMoney(amount, currency);

    return (
        <section className="rounded-xl bg-muted/40 p-4">
            {/* Payment method heading */}
            <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-foreground">
                    Payment method
                </h2>
            </div>

            {/* Payment method selector */}
            <div
                className="mt-4 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
                role="tablist"
                aria-label="Choose payment method"
            >
                <button
                    type="button"
                    role="tab"
                    aria-selected={method === "stk"}
                    onClick={() => changeMethod("stk")}
                    className={`flex items-center justify-center gap-2 rounded-md px-3 py-3 text-sm font-semibold transition ${
                        method === "stk"
                            ? "bg-background text-primary shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    <Wallet className="h-4 w-4" />
                    STK Push
                </button>

                <button
                    type="button"
                    role="tab"
                    aria-selected={method === "manual"}
                    onClick={() => changeMethod("manual")}
                    className={`flex items-center justify-center gap-2 rounded-md px-3 py-3 text-sm font-semibold transition ${
                        method === "manual"
                            ? "bg-background text-primary shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    <CalendarDays className="h-4 w-4" />
                    Manual M-PESA
                </button>
            </div>

            {/* STK Push */}
            {method === "stk" && (
                <div className="mt-5" role="tabpanel">
                    {stkContent}
                </div>
            )}

            {/* Manual M-PESA */}
            {method === "manual" && (
                <div className="mt-5" role="tabpanel">
                    {manualIntentLoading || !manualIntent ? (
                        <div className="py-8 text-center">
                            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                                <Wallet className="h-5 w-5 text-primary" />
                            </div>

                            <p className="mt-3 font-semibold text-foreground">
                                Preparing your payment
                            </p>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Generating your payment reference...
                            </p>

                            <div className="mx-auto mt-4 h-1.5 max-w-48 overflow-hidden rounded-full bg-muted">
                                <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Payment ready */}
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />

                                <div>
                                    <h3 className="font-semibold text-foreground">
                                        Payment instructions
                                    </h3>

                                    <p className="text-xs text-muted-foreground">
                                        Follow the steps below to complete your
                                        payment.
                                    </p>
                                </div>
                            </div>

                            {/* Amount */}
                            <div className="mt-5 rounded-lg bg-muted/40 p-4">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Exact amount to pay
                                </p>

                                <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                                    {amountToPay}
                                </p>
                            </div>

                            {/* Payment details */}
                            <div className="mt-5 space-y-4">
                                {paybill && (
                                    <div>
                                        <p className="text-sm font-medium text-foreground">
                                            Business number
                                        </p>

                                        <div className="mt-1 flex items-center justify-between gap-3 rounded-lg bg-muted/50 p-3">
                                            <code className="font-mono text-sm font-semibold text-foreground">
                                                {paybill}
                                            </code>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    void copyValue(
                                                        paybill,
                                                        "Business number",
                                                    )
                                                }
                                                className="rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                                aria-label="Copy business number"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <p className="text-sm font-medium text-foreground">
                                        Account number
                                    </p>

                                    <div className="mt-1 flex items-center justify-between gap-3 rounded-lg bg-muted/50 p-3">
                                        <code className="break-all font-mono text-sm font-semibold text-foreground">
                                            {manualIntent.bill_ref}
                                        </code>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                void copyValue(
                                                    manualIntent.bill_ref,
                                                    "Account number",
                                                )
                                            }
                                            className="shrink-0 rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                            aria-label="Copy account number"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Instructions */}
                            <div className="mt-6 border-t border-border pt-5">
                                <h4 className="text-sm font-semibold text-foreground">
                                    How to pay using M-PESA
                                </h4>

                                <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-muted-foreground">
                                    <li>Open M-PESA on your phone.</li>

                                    <li>
                                        Select{" "}
                                        <strong className="text-foreground">
                                            Lipa na M-PESA
                                        </strong>
                                        .
                                    </li>

                                    <li>
                                        Select{" "}
                                        <strong className="text-foreground">
                                            Pay Bill
                                        </strong>
                                        .
                                    </li>

                                    <li>
                                        Enter business number{" "}
                                        <strong className="text-foreground">
                                            {paybill ?? "shown above"}
                                        </strong>
                                        .
                                    </li>

                                    <li>
                                        Enter account number{" "}
                                        <strong className="break-all text-foreground">
                                            {manualIntent.bill_ref}
                                        </strong>
                                        .
                                    </li>

                                    <li>
                                        Enter the amount{" "}
                                        <strong className="text-foreground">
                                            {amountToPay}
                                        </strong>
                                        .
                                    </li>

                                    <li>Confirm your payment.</li>
                                </ol>
                            </div>

                            {/* Expiry */}
                            <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
                                <span className="text-xs text-muted-foreground">
                                    Reference expires
                                </span>

                                <span className="text-right text-xs font-medium text-foreground">
                                    {formatDate(manualIntent.expires_at)}
                                </span>
                            </div>

                            {/* Payment notice */}
                            <div className="mt-4 rounded-lg bg-green-500/5 p-3">
                                <p className="text-xs leading-relaxed text-muted-foreground">
                                    Your order will be processed automatically
                                    once M-PESA confirms your payment. Use the
                                    account number provided for this order only.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            )}
        </section>
    );
}
