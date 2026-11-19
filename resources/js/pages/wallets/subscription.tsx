import {
    ArrowLeft,
    CalendarDays,
    Check,
    CheckCircle2,
    Clock,
    Crown,
    ShieldCheck,
    Sparkles,
    Wallet,
} from "lucide-react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import type {
    PricingPlan,
    SubscriptionPageProps,
    CustomMode,
} from "@/types/subscription";

const MINIMUM_DAYS = 1;
const MAXIMUM_DAYS = 3650;
const DISCOUNT_START_DAYS = 7;

type FlashProps = {
    flash?: {
        success?: string | null;
        error?: string | null;
    };
};

function formatDate(date?: string | null): string {
    if (!date) return "Not available";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return "Not available";

    return new Intl.DateTimeFormat("en-KE", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(parsed);
}

function formatMoney(amount: number, currency = "KES"): string {
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

function calculatePrice(
    days: number,
    unitPrice: number,
    discountPercent: number,
): number {
    if (days < MINIMUM_DAYS || unitPrice <= 0) return 0;

    const discount =
        days >= DISCOUNT_START_DAYS ? Math.max(0, discountPercent) : 0;

    return Math.round(days * unitPrice * (1 - discount / 100) * 100) / 100;
}

function calculateDaysFromAmount(
    amount: number,
    unitPrice: number,
    discountPercent: number,
): number {
    if (amount < unitPrice || unitPrice <= 0) return 0;

    let low = MINIMUM_DAYS;
    let high = MAXIMUM_DAYS;
    let affordableDays = 0;

    while (low <= high) {
        const middle = Math.floor((low + high) / 2);
        const price = calculatePrice(middle, unitPrice, discountPercent);

        if (price <= amount) {
            affordableDays = middle;
            low = middle + 1;
        } else {
            high = middle - 1;
        }
    }

    return affordableDays;
}

export default function EscortSubscription({
    plans,
    subscription,
    phone: savedPhone,
}: SubscriptionPageProps) {
    const { flash } = usePage<FlashProps>().props;

    const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
    const [customMode, setCustomMode] = useState<CustomMode>("days");
    const [customDays, setCustomDays] = useState("7");
    const [customAmount, setCustomAmount] = useState("");
    const [phone, setPhone] = useState(savedPhone ?? "");
    const [processing, setProcessing] = useState(false);
    const [requestError, setRequestError] = useState("");

    const isActive = subscription?.isActive === true;

    const isCustomPlan = Boolean(
        selectedPlan &&
        (selectedPlan.isCustom ||
            selectedPlan.key === "custom" ||
            selectedPlan.days === null),
    );

    const presetPlans = useMemo(
        () => plans.filter((plan) => !plan.isCustom && plan.days !== null),
        [plans],
    );

    const customPlans = useMemo(
        () => plans.filter((plan) => plan.isCustom || plan.days === null),
        [plans],
    );

    const selectedDays = useMemo(() => {
        if (!selectedPlan) return 0;

        if (!isCustomPlan) {
            return selectedPlan.days ?? 0;
        }

        if (customMode === "days") {
            const days = Number(customDays);

            return Number.isFinite(days) ? Math.floor(days) : 0;
        }

        return calculateDaysFromAmount(
            Number(customAmount) || 0,
            selectedPlan.unitPrice,
            selectedPlan.discountPercent,
        );
    }, [selectedPlan, isCustomPlan, customMode, customDays, customAmount]);

    const selectedPrice = useMemo(() => {
        if (!selectedPlan || selectedDays < MINIMUM_DAYS) return 0;

        if (!isCustomPlan) {
            return selectedPlan.totalPrice ?? 0;
        }

        return calculatePrice(
            selectedDays,
            selectedPlan.unitPrice,
            selectedPlan.discountPercent,
        );
    }, [selectedPlan, selectedDays, isCustomPlan]);

    const selectedSavings = useMemo(() => {
        if (!selectedPlan || selectedDays < MINIMUM_DAYS) return 0;

        if (!isCustomPlan) {
            return selectedPlan.savings ?? 0;
        }

        const subtotal = selectedDays * selectedPlan.unitPrice;

        return Math.max(0, Math.round((subtotal - selectedPrice) * 100) / 100);
    }, [selectedPlan, selectedDays, selectedPrice, isCustomPlan]);

    const customBudget = Number(customAmount) || 0;

    const remainingBudget =
        customMode === "amount" ? Math.max(0, customBudget - selectedPrice) : 0;

    const customPlanIsValid =
        !isCustomPlan ||
        Boolean(
            selectedPlan &&
            selectedDays >= MINIMUM_DAYS &&
            selectedDays <= MAXIMUM_DAYS &&
            selectedPrice >= selectedPlan.unitPrice &&
            (customMode !== "amount" || customBudget >= selectedPrice),
        );

    const selectedPlanIsValid = Boolean(
        selectedPlan &&
        selectedDays >= MINIMUM_DAYS &&
        selectedDays <= MAXIMUM_DAYS &&
        selectedPrice > 0 &&
        customPlanIsValid,
    );

    function selectPlan(plan: PricingPlan) {
        setSelectedPlan(plan);
        setCustomMode("days");
        setCustomDays("7");
        setCustomAmount("");
        setRequestError("");
    }

    function continueToPayment() {
        if (!selectedPlan || !selectedPlanIsValid || processing) return;

        const cleanPhone = phone.trim();

        if (!/^\+?[0-9]{9,15}$/.test(cleanPhone)) {
            setRequestError("Enter a valid M-PESA phone number.");
            return;
        }

        setProcessing(true);
        setRequestError("");

        router.post(
            "/escorts/subscription/checkout",
            {
                plan_id: selectedPlan.id,
                days: selectedDays,
                phone: cleanPhone,
            },
            {
                preserveScroll: true,

                onError: (errors) => {
                    const firstError = Object.values(errors)[0];

                    setRequestError(
                        typeof firstError === "string"
                            ? firstError
                            : "Unable to process your payment. Please check your details.",
                    );
                },

                onFinish: () => {
                    setProcessing(false);
                },
            },
        );
    }

    return (
        <>
            <Head title="Escort subscription" />

            <div className="space-y-8 pb-10">
                <PageHeader
                    title="Escort subscription"
                    description="Choose how long you want your escort listing to remain active."
                    backHref="/settings/escorts"
                />

                {/* Flash messages */}
                {flash?.success && (
                    <div
                        role="status"
                        className="rounded-xl border border-brand-green/20 bg-brand-green/10 p-4 text-sm text-brand-green"
                    >
                        {flash.success}
                    </div>
                )}

                {flash?.error && (
                    <div
                        role="alert"
                        className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600"
                    >
                        {flash.error}
                    </div>
                )}

                {/* Current subscription */}
                <section className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                                isActive
                                    ? "bg-brand-green/10 text-brand-green"
                                    : "bg-amber-500/10 text-amber-600"
                            }`}
                        >
                            {isActive ? (
                                <CheckCircle2 className="h-6 w-6" />
                            ) : (
                                <Clock className="h-6 w-6" />
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="font-semibold text-foreground">
                                    Current subscription
                                </h2>

                                <span
                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                        isActive
                                            ? "bg-brand-green/10 text-brand-green"
                                            : "bg-amber-500/10 text-amber-600"
                                    }`}
                                >
                                    {isActive
                                        ? "Active"
                                        : "No active subscription"}
                                </span>
                            </div>

                            <p className="mt-1 text-sm text-muted-foreground">
                                {isActive
                                    ? "Your escort listing subscription is currently active."
                                    : "Choose a plan below to activate your escort listing."}
                            </p>
                        </div>
                    </div>

                    {isActive && (
                        <div className="mt-5 grid grid-cols-1 gap-3 border-t border-border pt-5 sm:grid-cols-2">
                            <div className="rounded-xl bg-muted/40 p-3">
                                <p className="text-xs text-muted-foreground">
                                    Current plan
                                </p>

                                <p className="mt-1 font-semibold text-foreground">
                                    {subscription.plan || "Active subscription"}
                                </p>
                            </div>

                            <div className="rounded-xl bg-muted/40 p-3">
                                <p className="text-xs text-muted-foreground">
                                    Expires on
                                </p>

                                <p className="mt-1 font-semibold text-foreground">
                                    {formatDate(subscription.expiresAt)}
                                </p>
                            </div>
                        </div>
                    )}
                </section>

                {/* Subscription information */}
                <section className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

                    <div>
                        <h3 className="text-sm font-semibold text-foreground">
                            Subscription information
                        </h3>

                        <p className="mt-1 text-sm text-muted-foreground">
                            All plans provide the same listing services. Only
                            the subscription duration and price differ.
                            Verification and approval remain subject to platform
                            requirements.
                        </p>
                    </div>
                </section>

                {/* Subscription plans */}
                <section className="space-y-5">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">
                            Choose your listing duration
                        </h2>

                        <p className="mt-1 text-sm text-muted-foreground">
                            KES 100 per day. Get 10% off when you subscribe for
                            at least 7 days.
                        </p>
                    </div>

                    {plans.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                            <Wallet className="mx-auto h-9 w-9 text-muted-foreground" />

                            <h3 className="mt-3 font-semibold text-foreground">
                                No subscription plans available
                            </h3>

                            <p className="mt-1 text-sm text-muted-foreground">
                                There are currently no active escort listing
                                plans. Please check again later.
                            </p>
                        </div>
                    ) : (
                        <>
                            {presetPlans.length > 0 && (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {presetPlans.map((plan) => {
                                        const isSelected =
                                            selectedPlan?.id === plan.id;

                                        const days = plan.days ?? 0;
                                        const subtotal = days * plan.unitPrice;

                                        const discount =
                                            days >= DISCOUNT_START_DAYS
                                                ? plan.discountPercent
                                                : 0;

                                        return (
                                            <button
                                                key={plan.id}
                                                type="button"
                                                onClick={() => selectPlan(plan)}
                                                aria-pressed={isSelected}
                                                className={`relative flex h-full flex-col rounded-2xl border p-5 text-left transition ${
                                                    isSelected
                                                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                                        : "border-border bg-card hover:border-primary/50"
                                                }`}
                                            >
                                                {plan.badge && (
                                                    <span className="absolute -top-3 right-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                                                        {plan.badge}
                                                    </span>
                                                )}

                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                                        <Crown className="h-5 w-5" />
                                                    </span>

                                                    {isSelected && (
                                                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white">
                                                            <Check className="h-4 w-4" />
                                                        </span>
                                                    )}
                                                </div>

                                                <h3 className="mt-5 text-lg font-bold text-foreground">
                                                    {plan.label}
                                                </h3>

                                                <p className="mt-3 text-2xl font-bold text-foreground">
                                                    {formatMoney(
                                                        plan.totalPrice ?? 0,
                                                        plan.currency,
                                                    )}
                                                </p>

                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    {days}{" "}
                                                    {days === 1
                                                        ? "day"
                                                        : "days"}{" "}
                                                    of listing
                                                </p>

                                                {discount > 0 ? (
                                                    <div className="mt-3 space-y-1">
                                                        <p className="text-xs text-muted-foreground line-through">
                                                            {formatMoney(
                                                                subtotal,
                                                                plan.currency,
                                                            )}
                                                        </p>

                                                        <span className="inline-flex rounded-full bg-brand-green/10 px-2.5 py-1 text-xs font-semibold text-brand-green">
                                                            Save {discount}%
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <p className="mt-3 text-xs text-muted-foreground">
                                                        Standard daily rate
                                                    </p>
                                                )}

                                                <span
                                                    className={`mt-5 block rounded-full px-4 py-2.5 text-center text-sm font-semibold transition ${
                                                        isSelected
                                                            ? "bg-primary text-white"
                                                            : "bg-muted text-foreground"
                                                    }`}
                                                >
                                                    {isSelected
                                                        ? "Selected"
                                                        : "Select plan"}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Custom plan */}
                            {customPlans.map((plan) => {
                                const isSelected = selectedPlan?.id === plan.id;

                                return (
                                    <button
                                        key={plan.id}
                                        type="button"
                                        onClick={() => selectPlan(plan)}
                                        aria-pressed={isSelected}
                                        className={`flex w-full items-center justify-between gap-4 rounded-2xl border p-5 text-left transition ${
                                            isSelected
                                                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                                : "border-border bg-card hover:border-primary/50"
                                        }`}
                                    >
                                        <div className="flex min-w-0 items-center gap-4">
                                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                                <CalendarDays className="h-5 w-5" />
                                            </span>

                                            <div className="min-w-0">
                                                <h3 className="font-bold text-foreground">
                                                    {plan.label}
                                                </h3>

                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    Choose your own listing
                                                    duration
                                                </p>

                                                <p className="mt-1 text-sm font-semibold text-foreground">
                                                    {formatMoney(
                                                        plan.unitPrice,
                                                        plan.currency,
                                                    )}{" "}
                                                    per day
                                                </p>

                                                {plan.discountPercent > 0 && (
                                                    <span className="mt-2 inline-flex rounded-full bg-brand-green/10 px-2.5 py-1 text-xs font-semibold text-brand-green">
                                                        {plan.discountPercent}%
                                                        off for 7+ days
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <span
                                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                                isSelected
                                                    ? "bg-primary text-white"
                                                    : "border border-border text-transparent"
                                            }`}
                                        >
                                            <Check className="h-4 w-4" />
                                        </span>
                                    </button>
                                );
                            })}
                        </>
                    )}
                </section>

                {/* Custom subscription calculator */}
                {isCustomPlan && selectedPlan && (
                    <section className="rounded-2xl border border-border bg-card p-5">
                        <div className="flex items-center gap-2">
                            <CalendarDays className="h-5 w-5 text-primary" />

                            <h3 className="font-semibold text-foreground">
                                Custom subscription
                            </h3>
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Daily rate:{" "}
                            <strong className="text-foreground">
                                {formatMoney(
                                    selectedPlan.unitPrice,
                                    selectedPlan.currency,
                                )}
                            </strong>
                            . Minimum subscription: 1 day.
                        </p>

                        <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
                            <button
                                type="button"
                                onClick={() => setCustomMode("days")}
                                className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                                    customMode === "days"
                                        ? "bg-card text-foreground shadow-sm"
                                        : "text-muted-foreground"
                                }`}
                            >
                                Choose days
                            </button>

                            <button
                                type="button"
                                onClick={() => setCustomMode("amount")}
                                className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                                    customMode === "amount"
                                        ? "bg-card text-foreground shadow-sm"
                                        : "text-muted-foreground"
                                }`}
                            >
                                Enter amount
                            </button>
                        </div>

                        {customMode === "days" ? (
                            <div className="mt-5">
                                <label
                                    htmlFor="custom-days"
                                    className="mb-2 block text-sm font-medium text-foreground"
                                >
                                    How many days do you want?
                                </label>

                                <input
                                    id="custom-days"
                                    type="number"
                                    min={MINIMUM_DAYS}
                                    max={MAXIMUM_DAYS}
                                    step={1}
                                    value={customDays}
                                    onChange={(event) =>
                                        setCustomDays(event.target.value)
                                    }
                                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
                                    placeholder="Enter number of days"
                                />

                                <p className="mt-2 text-xs text-muted-foreground">
                                    Your total and applicable discount are
                                    calculated automatically.
                                </p>
                            </div>
                        ) : (
                            <div className="mt-5">
                                <label
                                    htmlFor="custom-amount"
                                    className="mb-2 block text-sm font-medium text-foreground"
                                >
                                    How much do you want to spend?
                                </label>

                                <input
                                    id="custom-amount"
                                    type="number"
                                    min={selectedPlan.unitPrice}
                                    step="1"
                                    value={customAmount}
                                    onChange={(event) =>
                                        setCustomAmount(event.target.value)
                                    }
                                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
                                    placeholder={`Minimum ${formatMoney(
                                        selectedPlan.unitPrice,
                                        selectedPlan.currency,
                                    )}`}
                                />

                                <p className="mt-2 text-xs text-muted-foreground">
                                    We calculate the maximum whole days your
                                    budget can buy. Any unused balance is not
                                    charged.
                                </p>
                            </div>
                        )}

                        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="rounded-xl bg-muted/50 p-4">
                                <p className="text-xs text-muted-foreground">
                                    Subscription duration
                                </p>

                                <p className="mt-1 text-xl font-bold text-foreground">
                                    {selectedDays}{" "}
                                    {selectedDays === 1 ? "day" : "days"}
                                </p>
                            </div>

                            <div className="rounded-xl bg-muted/50 p-4">
                                <p className="text-xs text-muted-foreground">
                                    Amount payable
                                </p>

                                <p className="mt-1 text-xl font-bold text-foreground">
                                    {formatMoney(
                                        selectedPrice,
                                        selectedPlan.currency,
                                    )}
                                </p>
                            </div>
                        </div>

                        {selectedSavings > 0 && (
                            <div className="mt-3 rounded-xl bg-brand-green/10 p-3">
                                <div className="flex items-center justify-between gap-3 text-sm">
                                    <span className="font-medium text-brand-green">
                                        Subscription discount
                                    </span>

                                    <span className="font-bold text-brand-green">
                                        -
                                        {formatMoney(
                                            selectedSavings,
                                            selectedPlan.currency,
                                        )}
                                    </span>
                                </div>
                            </div>
                        )}

                        {customMode === "amount" &&
                            selectedDays > 0 &&
                            remainingBudget > 0 && (
                                <p className="mt-3 text-xs text-muted-foreground">
                                    Unused budget:{" "}
                                    {formatMoney(
                                        remainingBudget,
                                        selectedPlan.currency,
                                    )}
                                </p>
                            )}

                        {!customPlanIsValid && (
                            <p className="mt-3 text-sm text-red-500">
                                Enter a valid amount for at least one day and
                                choose no more than{" "}
                                {MAXIMUM_DAYS.toLocaleString()} days.
                            </p>
                        )}
                    </section>
                )}

                {/* Checkout */}
                {selectedPlan && (
                    <section className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />

                            <h2 className="font-bold text-foreground">
                                Your selected subscription
                            </h2>
                        </div>

                        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="font-semibold text-foreground">
                                    {selectedPlan.label}
                                </p>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    {selectedDays}{" "}
                                    {selectedDays === 1 ? "day" : "days"} of
                                    listing
                                </p>

                                {selectedSavings > 0 && (
                                    <p className="mt-1 text-sm font-medium text-brand-green">
                                        You save{" "}
                                        {formatMoney(
                                            selectedSavings,
                                            selectedPlan.currency,
                                        )}
                                    </p>
                                )}
                            </div>

                            <div className="sm:text-right">
                                <p className="text-xs text-muted-foreground">
                                    Amount payable
                                </p>

                                <p className="text-2xl font-bold text-foreground">
                                    {formatMoney(
                                        selectedPrice,
                                        selectedPlan.currency,
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 border-t border-primary/10 pt-5">
                            <label
                                htmlFor="payment-phone"
                                className="mb-2 block text-sm font-medium text-foreground"
                            >
                                M-PESA phone number
                            </label>

                            <input
                                id="payment-phone"
                                type="tel"
                                value={phone}
                                onChange={(event) => {
                                    setPhone(event.target.value);
                                    setRequestError("");
                                }}
                                placeholder="e.g. 0712345678"
                                autoComplete="tel"
                                required
                                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
                            />

                            <p className="mt-2 text-xs text-muted-foreground">
                                Your saved phone number is filled in
                                automatically. You can change it before
                                requesting payment.
                            </p>
                        </div>

                        {requestError && (
                            <div
                                role="alert"
                                className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600"
                            >
                                {requestError}
                            </div>
                        )}

                        <div className="mt-5">
                            <button
                                type="button"
                                onClick={continueToPayment}
                                disabled={!selectedPlanIsValid || processing}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                            >
                                <Wallet className="h-4 w-4" />

                                {processing
                                    ? "Sending payment request..."
                                    : "Continue to payment"}
                            </button>

                            <p className="mt-3 text-xs text-muted-foreground">
                                An M-PESA prompt will be sent to the phone
                                number above. Your subscription activates only
                                after successful payment confirmation.
                            </p>
                        </div>
                    </section>
                )}

                <div>
                    <Link
                        href="/settings/escorts"
                        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to escort dashboard
                    </Link>
                </div>
            </div>
        </>
    );
}

EscortSubscription.layout = {
    breadcrumbs: [
        {
            title: "Escorts",
            href: "/escorts",
        },
        {
            title: "Subscription",
            href: "/escorts/subscription",
        },
    ],
};
