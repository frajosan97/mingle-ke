import { Head, router, usePage } from "@inertiajs/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
    Check,
    Coins,
    Gift,
    Info,
    LockKeyhole,
    Phone,
    ShieldCheck,
    Sparkles,
    Wallet,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { NoticeBanner } from "@/components/ui/notice-banner";
import PaymentMethodSelector from "@/components/partials/payments/payment-method-selector";

import type {
    CoinsWalletProps,
    PurchaseStatus,
    ManualPaymentIntent,
    CoinPackage,
} from "@/types/wallet";

import {
    COIN_PACKAGES,
    FALLBACK_INVITE_CODE,
    MINIMUM_COINS,
    priceForCoins,
} from "@/types/coin";

export type { PurchaseStatus } from "@/types/wallet";

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS = 90_000;
const MAXIMUM_COINS = 1_000_000;

const COINS_PURCHASE_URL = "/wallets/coins/purchase";
const COINS_REFERENCE_URL = "/wallets/coins/bill-ref";

type ManualCoinIntent = ManualPaymentIntent & {
    coins: number;
};

type PollingResponse = {
    status?: string;
    coins?: number;
    message?: string;
};

type ManualReferenceResponse = {
    success?: boolean;
    bill_ref?: string;
    amount?: number | string;
    coins?: number;
    paybill?: string;
    expires_at?: string;
    message?: string;
};

type PollingCallbacks = {
    onCompleted: (coins: number) => void;
    onFailed: () => void;
    onTimeout: () => void;
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function getCsrfToken(): string {
    return (
        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.content ?? ""
    );
}

function formatKes(amount: number): string {
    return new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

function getFirstError(errors: Record<string, unknown>): string | null {
    const firstError = Object.values(errors)[0];

    return typeof firstError === "string" ? firstError : null;
}

/*
|--------------------------------------------------------------------------
| M-PESA Polling Hook
|--------------------------------------------------------------------------
*/

function useMpesaPolling({
    checkoutId,
    status,
    restartKey,
    onCompleted,
    onFailed,
    onTimeout,
}: {
    checkoutId: string | null;
    status: PurchaseStatus;
    restartKey: number;
} & PollingCallbacks): void {
    const callbacksRef = useRef<PollingCallbacks>({
        onCompleted,
        onFailed,
        onTimeout,
    });

    const completedRef = useRef(false);

    useEffect(() => {
        callbacksRef.current = {
            onCompleted,
            onFailed,
            onTimeout,
        };
    }, [onCompleted, onFailed, onTimeout]);

    useEffect(() => {
        if (!checkoutId || status !== "pending") {
            completedRef.current = false;
            return;
        }

        let cancelled = false;
        let timer: ReturnType<typeof setTimeout> | null = null;
        const startedAt = Date.now();

        const scheduleNextPoll = () => {
            if (cancelled) return;

            timer = setTimeout(() => {
                void poll();
            }, POLL_INTERVAL_MS);
        };

        const poll = async (): Promise<void> => {
            if (cancelled || completedRef.current) return;

            if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
                callbacksRef.current.onTimeout();
                return;
            }

            try {
                const response = await fetch(
                    `/wallets/transactions/${encodeURIComponent(checkoutId)}/status`,
                    {
                        method: "GET",
                        credentials: "same-origin",
                        headers: {
                            Accept: "application/json",
                            "X-Requested-With": "XMLHttpRequest",
                        },
                    },
                );

                if (cancelled) return;

                if (response.ok) {
                    const data = (await response.json()) as PollingResponse;

                    if (cancelled) return;

                    if (data.status === "completed") {
                        completedRef.current = true;

                        callbacksRef.current.onCompleted(
                            Number.isFinite(Number(data.coins))
                                ? Number(data.coins)
                                : 0,
                        );

                        return;
                    }

                    if (data.status === "failed") {
                        completedRef.current = true;
                        callbacksRef.current.onFailed();
                        return;
                    }
                }
            } catch {
                // Temporary network errors do not mean payment failure.
            }

            scheduleNextPoll();
        };

        void poll();

        return () => {
            cancelled = true;

            if (timer !== null) {
                clearTimeout(timer);
            }
        };
    }, [checkoutId, status, restartKey]);
}

/*
|--------------------------------------------------------------------------
| Main Component
|--------------------------------------------------------------------------
*/

export default function CoinsWallet() {
    const {
        auth,
        flash,
        checkout_request_id,
        paybill,
        phoneConfigured,
        mpesaAvailable,
        phoneSetupUrl,
    } = usePage<CoinsWalletProps>().props;

    /*
    |--------------------------------------------------------------------------
    | User Information
    |--------------------------------------------------------------------------
    */

    const user = auth.user;

    const coins = user?.coins ?? 0;
    const username = user?.name ?? "You";
    const avatarUrl = user?.avatar_url ?? null;
    const inviteCode = user?.invite_code ?? FALLBACK_INVITE_CODE;

    const initial = username.trim().charAt(0).toUpperCase() || "?";
    const canUseMpesa = Boolean(phoneConfigured && mpesaAvailable);

    /*
    |--------------------------------------------------------------------------
    | Component State
    |--------------------------------------------------------------------------
    */

    const [selectedId, setSelectedId] = useState<number>(
        COIN_PACKAGES[0]?.id ?? 0,
    );

    const [customAmount, setCustomAmount] = useState("");
    const [copied, setCopied] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [status, setStatus] = useState<PurchaseStatus>("idle");
    const [checkoutId, setCheckoutId] = useState<string | null>(null);
    const [pollTimedOut, setPollTimedOut] = useState(false);
    const [pollRestartKey, setPollRestartKey] = useState(0);

    const [manualIntent, setManualIntent] = useState<ManualCoinIntent | null>(
        null,
    );

    const [manualIntentLoading, setManualIntentLoading] = useState(false);
    const [currentPaybill, setCurrentPaybill] = useState<string | null>(
        paybill ?? null,
    );

    /*
    |--------------------------------------------------------------------------
    | Flash Messages
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    /*
    |--------------------------------------------------------------------------
    | Restore Pending STK Checkout
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (!checkout_request_id) return;

        setCheckoutId(checkout_request_id);
        setStatus("pending");
        setPollTimedOut(false);
    }, [checkout_request_id]);

    /*
    |--------------------------------------------------------------------------
    | Selected Package and Price
    |--------------------------------------------------------------------------
    */

    const selected = useMemo(
        () =>
            COIN_PACKAGES.find((item) => item.id === selectedId) ??
            COIN_PACKAGES[0],
        [selectedId],
    );

    const isCustom = selected?.coins === "custom";

    const parsedCustom = useMemo(() => {
        if (!/^\d+$/.test(customAmount.trim())) return 0;

        return Number(customAmount);
    }, [customAmount]);

    const isCustomValid =
        Number.isSafeInteger(parsedCustom) &&
        parsedCustom >= MINIMUM_COINS &&
        parsedCustom <= MAXIMUM_COINS;

    const customPrice = isCustomValid ? priceForCoins(parsedCustom) : 0;

    const finalPrice = isCustom ? customPrice : (selected?.price ?? 0);

    const selectedCoins = isCustom
        ? parsedCustom
        : typeof selected?.coins === "number"
          ? selected.coins
          : 0;

    const canRecharge =
        canUseMpesa &&
        Boolean(selected) &&
        (isCustom
            ? isCustomValid
            : selected?.price != null && selected.price > 0) &&
        !submitting &&
        status !== "pending";

    /*
    |--------------------------------------------------------------------------
    | Package Selection
    |--------------------------------------------------------------------------
    */

    const handleSelectPackage = useCallback((id: number) => {
        setSelectedId(id);
        setManualIntent(null);
    }, []);

    const handleCustomAmountChange = useCallback((value: string) => {
        setCustomAmount(value);
        setManualIntent(null);
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Payment Completion
    |--------------------------------------------------------------------------
    */

    const handleCompleted = useCallback((coinsAdded: number) => {
        setStatus("done");
        setCheckoutId(null);
        setPollTimedOut(false);
        setManualIntent(null);

        router.reload({
            only: ["auth"],
        });

        toast.success(
            coinsAdded > 0
                ? `${coinsAdded} coins added to your wallet 🎉`
                : "Your coin purchase has been confirmed.",
        );
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Payment Failure
    |--------------------------------------------------------------------------
    */

    const handleFailed = useCallback(() => {
        setStatus("failed");
        setCheckoutId(null);
        setPollTimedOut(false);

        toast.error("M-PESA payment was not completed. You can try again.");
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Payment Polling Timeout
    |--------------------------------------------------------------------------
    */

    const handleTimeout = useCallback(() => {
        setPollTimedOut(true);

        toast.info(
            "Payment confirmation is taking longer than expected. This does not mean your payment failed.",
        );
    }, []);

    useMpesaPolling({
        checkoutId,
        status,
        restartKey: pollRestartKey,
        onCompleted: handleCompleted,
        onFailed: handleFailed,
        onTimeout: handleTimeout,
    });

    /*
    |--------------------------------------------------------------------------
    | Retry Payment Status Polling
    |--------------------------------------------------------------------------
    */

    const checkPaymentAgain = useCallback(() => {
        if (!checkoutId) {
            toast.error("No payment reference is available to check.");
            return;
        }

        setPollTimedOut(false);
        setPollRestartKey((current) => current + 1);

        toast.info("Checking your payment status...");
    }, [checkoutId]);

    /*
    |--------------------------------------------------------------------------
    | Copy Invite Code
    |--------------------------------------------------------------------------
    */

    const copyInvite = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(inviteCode);

            setCopied(true);
            toast.success("Invite code copied");

            window.setTimeout(() => {
                setCopied(false);
            }, 1_500);
        } catch {
            toast.error("Couldn't copy invite code.");
        }
    }, [inviteCode]);

    /*
    |--------------------------------------------------------------------------
    | STK Purchase
    |--------------------------------------------------------------------------
    */

    const handleRecharge = useCallback(() => {
        if (!phoneConfigured) {
            toast.error(
                "Please set up your phone number before purchasing coins.",
            );
            return;
        }

        if (!mpesaAvailable) {
            toast.error("M-PESA payments are currently unavailable.");
            return;
        }

        if (status === "pending") {
            toast.error(
                "A payment is still awaiting confirmation. Please check its status first.",
            );
            return;
        }

        if (!canRecharge) {
            toast.error(
                isCustom
                    ? "Enter a valid coin quantity."
                    : "Select a valid coin package.",
            );
            return;
        }

        setManualIntent(null);
        setPollTimedOut(false);

        const payload = {
            ...(isCustom
                ? { coins: parsedCustom }
                : { package_id: selected?.id }),
            method: "mpesa",
        };

        router.post(COINS_PURCHASE_URL, payload, {
            preserveScroll: true,

            onStart: () => {
                setSubmitting(true);
                setStatus("idle");
            },

            onSuccess: (page) => {
                const props = page.props as unknown as CoinsWalletProps;

                if (props.checkout_request_id) {
                    setCheckoutId(props.checkout_request_id);
                    setStatus("pending");
                }
            },

            onError: (errors) => {
                toast.error(
                    getFirstError(errors) ??
                        "We couldn't start the payment. Please try again.",
                );
            },

            onFinish: () => {
                setSubmitting(false);
            },
        });
    }, [
        phoneConfigured,
        mpesaAvailable,
        status,
        canRecharge,
        isCustom,
        parsedCustom,
        selected,
    ]);

    /*
    |--------------------------------------------------------------------------
    | Generate C2B Reference
    |--------------------------------------------------------------------------
    */

    const requestManualReference = useCallback(async () => {
        if (!canUseMpesa) {
            toast.error("M-PESA payments are currently unavailable.");
            return;
        }

        if (manualIntentLoading || submitting) return;

        if (status === "pending") {
            toast.error(
                "Please wait for your existing STK payment to be resolved.",
            );
            return;
        }

        if (isCustom && !isCustomValid) {
            toast.error(
                `Enter between ${MINIMUM_COINS.toLocaleString()} and ${MAXIMUM_COINS.toLocaleString()} coins.`,
            );
            return;
        }

        if (!isCustom && (!selected || selected.price == null)) {
            toast.error("Select a valid coin package.");
            return;
        }

        setManualIntentLoading(true);
        setManualIntent(null);

        try {
            const payload = isCustom
                ? { coins: parsedCustom }
                : { package_id: selected.id };

            const response = await fetch(COINS_REFERENCE_URL, {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                    "X-CSRF-TOKEN": getCsrfToken(),
                },
                body: JSON.stringify(payload),
            });

            const data = (await response.json()) as ManualReferenceResponse;

            if (!response.ok) {
                throw new Error(
                    data.message ?? "Unable to generate a payment reference.",
                );
            }

            const amount = Number(data.amount);

            if (
                typeof data.bill_ref !== "string" ||
                !Number.isFinite(amount) ||
                amount <= 0
            ) {
                throw new Error(
                    "The server returned an invalid payment reference.",
                );
            }

            if (data.paybill) {
                setCurrentPaybill(data.paybill);
            }

            setManualIntent({
                bill_ref: data.bill_ref,
                amount,
                currency: "KES",
                coins: Number(data.coins ?? selectedCoins),
                // Do not fabricate an expiry; display the server value.
                expires_at:
                    typeof data.expires_at === "string" ? data.expires_at : "",
            });

            toast.success("Payment reference generated.");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Unable to generate a payment reference.",
            );
        } finally {
            setManualIntentLoading(false);
        }
    }, [
        canUseMpesa,
        manualIntentLoading,
        submitting,
        status,
        isCustom,
        isCustomValid,
        parsedCustom,
        selected,
        selectedCoins,
    ]);

    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    const stkContent = (
        <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-semibold text-foreground">M-PESA STK Push</h3>

            <p className="mt-1 text-sm text-muted-foreground">
                Send a payment prompt to your saved M-PESA phone number.
            </p>

            <div className="mt-4 rounded-xl bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">Amount payable</p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                    {formatKes(finalPrice)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                    {selectedCoins.toLocaleString()} coins
                </p>
            </div>

            {!phoneConfigured ? (
                <p className="mt-4 text-sm text-amber-600">
                    Set up your phone number before requesting an STK Push.
                </p>
            ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                    Your saved phone number will receive the M-PESA prompt.
                    Confirm the payment on your phone to complete the purchase.
                </p>
            )}

            <button
                type="button"
                onClick={handleRecharge}
                disabled={!canRecharge}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <Wallet className="h-4 w-4" />
                {submitting
                    ? "Sending payment request..."
                    : status === "pending"
                      ? "Payment awaiting confirmation"
                      : "Pay with M-PESA"}
            </button>

            {status === "pending" && (
                <p className="mt-3 text-center text-xs text-muted-foreground">
                    Waiting for M-PESA payment confirmation...
                </p>
            )}
        </div>
    );

    return (
        <>
            <Head title="Coins Wallet" />

            <div className="space-y-8 pb-8">
                <PageHeader
                    title="Coins Wallet"
                    description="Manage your coins, recharge your balance, and enjoy chatting with other members."
                    backHref="/wallets"
                    backHrefTitle="Back to Wallet"
                />

                {/* Account overview */}
                <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-card p-5">
                        <div className="flex items-center gap-4">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={`${username}'s avatar`}
                                    className="h-14 w-14 rounded-full object-cover"
                                />
                            ) : (
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                                    {initial}
                                </div>
                            )}

                            <div className="min-w-0">
                                <p className="text-sm text-muted-foreground">
                                    Your account
                                </p>
                                <h2 className="truncate text-lg font-bold text-foreground">
                                    {username}
                                </h2>
                                <p className="text-xs capitalize text-muted-foreground">
                                    {user?.tier ?? "Member"}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 rounded-xl bg-primary/5 p-4">
                            <div className="flex items-center gap-2 text-primary">
                                <Coins className="h-5 w-5" />
                                <span className="text-sm font-semibold">
                                    Available coin balance
                                </span>
                            </div>

                            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                                {coins.toLocaleString()}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Coins available in your wallet
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-5">
                        <div className="flex items-center gap-2">
                            <Gift className="h-5 w-5 text-primary" />
                            <h2 className="font-bold text-foreground">
                                Invite and earn
                            </h2>
                        </div>

                        <p className="mt-2 text-sm text-muted-foreground">
                            Share your invite code with friends. Your code is:
                        </p>

                        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-muted/60 p-3">
                            <code className="break-all font-mono text-lg font-bold tracking-wider text-foreground">
                                {inviteCode}
                            </code>

                            <button
                                type="button"
                                onClick={() => void copyInvite()}
                                className="shrink-0 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
                            >
                                {copied ? "Copied" : "Copy code"}
                            </button>
                        </div>

                        <p className="mt-3 text-xs text-muted-foreground">
                            Share this code with people you invite to the
                            platform.
                        </p>
                    </div>
                </section>

                {/* Phone configuration */}
                {!phoneConfigured && (
                    <NoticeBanner
                        variant="warning"
                        icon={Phone}
                        title="Set up your phone number first"
                        description="Add your phone number to your profile before purchasing coins. M-PESA payments will use your saved number."
                        action={{
                            label: "Set up phone number",
                            href: phoneSetupUrl,
                        }}
                    />
                )}

                {/* M-PESA availability */}
                {!mpesaAvailable && (
                    <NoticeBanner
                        variant="destructive"
                        icon={LockKeyhole}
                        title="M-PESA unavailable"
                        badge="Unavailable"
                        description="M-PESA payment configuration is incomplete. Coin purchases are temporarily disabled."
                    />
                )}

                {/* Delayed payment */}
                {pollTimedOut && checkoutId && (
                    <div
                        role="status"
                        className="flex flex-col gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                        <div>
                            <p className="font-semibold text-foreground">
                                Payment confirmation is delayed
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Your payment may still be processing. Check your
                                M-PESA messages and verify your wallet before
                                starting another payment.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={checkPaymentAgain}
                            className="shrink-0 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-background"
                        >
                            Check payment status
                        </button>
                    </div>
                )}

                {/* Recharge */}
                <section className="space-y-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-lg font-bold text-foreground">
                                    Recharge your coins
                                </h2>

                                <span className="rounded-full bg-brand-green/10 px-2.5 py-1 text-xs font-semibold text-brand-green">
                                    Bonus coins available
                                </span>
                            </div>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Choose a package or enter a custom coin amount.
                            </p>
                        </div>

                        {canUseMpesa && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-600">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                M-PESA available
                            </span>
                        )}
                    </div>

                    {/* Package grid */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                        {COIN_PACKAGES.map((item: CoinPackage) => {
                            const isSelected = selectedId === item.id;
                            const custom = item.coins === "custom";

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleSelectPackage(item.id)}
                                    aria-pressed={isSelected}
                                    className={`relative flex min-h-32 flex-col rounded-xl border p-4 text-left transition ${
                                        isSelected
                                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                            : "border-border bg-background hover:border-primary/50"
                                    }`}
                                >
                                    {item.popular && (
                                        <span className="absolute -top-2.5 right-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-white">
                                            Popular
                                        </span>
                                    )}

                                    <div className="flex items-center justify-between gap-2">
                                        <Coins className="h-5 w-5 text-primary" />
                                        {isSelected && (
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                                                <Check className="h-3 w-3" />
                                            </span>
                                        )}
                                    </div>

                                    <p className="mt-3 font-bold text-foreground">
                                        {custom
                                            ? "Custom amount"
                                            : `${item.coins.toLocaleString()} coins`}
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-foreground">
                                        {custom
                                            ? "Choose your amount"
                                            : formatKes(item.price ?? 0)}
                                    </p>

                                    {item.bonus && (
                                        <span className="mt-2 inline-flex w-fit rounded-full bg-brand-green/10 px-2 py-1 text-xs font-semibold text-brand-green">
                                            {item.bonus} bonus
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Custom coin amount */}
                    {isCustom && (
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                            <label
                                htmlFor="custom-coins"
                                className="block text-sm font-semibold text-foreground"
                            >
                                Enter coin quantity
                            </label>

                            <input
                                id="custom-coins"
                                type="number"
                                min={MINIMUM_COINS}
                                max={MAXIMUM_COINS}
                                step={1}
                                value={customAmount}
                                onChange={(event) =>
                                    handleCustomAmountChange(event.target.value)
                                }
                                placeholder={`Minimum ${MINIMUM_COINS} coins`}
                                className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
                            />

                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                <p className="text-xs text-muted-foreground">
                                    Minimum {MINIMUM_COINS.toLocaleString()}{" "}
                                    coins. Maximum{" "}
                                    {MAXIMUM_COINS.toLocaleString()} coins.
                                </p>

                                {isCustomValid && (
                                    <p className="text-sm font-semibold text-foreground">
                                        Total: {formatKes(customPrice)}
                                    </p>
                                )}
                            </div>

                            {customAmount.trim() !== "" && !isCustomValid && (
                                <p className="mt-2 text-xs text-red-500">
                                    Enter a whole number between{" "}
                                    {MINIMUM_COINS.toLocaleString()} and{" "}
                                    {MAXIMUM_COINS.toLocaleString()}.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Selected package summary */}
                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Selected purchase
                                </p>

                                <p className="mt-1 font-semibold text-foreground">
                                    {selectedCoins > 0
                                        ? `${selectedCoins.toLocaleString()} coins`
                                        : "Choose a valid coin quantity"}
                                </p>
                            </div>

                            <div className="sm:text-right">
                                <p className="text-xs text-muted-foreground">
                                    Amount payable
                                </p>
                                <p className="text-2xl font-bold text-foreground">
                                    {formatKes(finalPrice)}
                                </p>
                            </div>
                        </div>

                        {selectedCoins > 0 && (
                            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                                <Info className="h-3.5 w-3.5 shrink-0" />
                                Your coins will be credited after payment
                                confirmation.
                            </p>
                        )}
                    </div>

                    {/* Shared payment selector */}
                    <PaymentMethodSelector
                        key={`${selectedId}-${selectedCoins}`}
                        amount={finalPrice}
                        currency="KES"
                        stkContent={stkContent}
                        manualIntent={manualIntent}
                        manualIntentLoading={manualIntentLoading}
                        disabled={
                            submitting ||
                            status === "pending" ||
                            !canUseMpesa ||
                            selectedCoins <= 0 ||
                            finalPrice <= 0
                        }
                        paybill={currentPaybill}
                        onGenerateReference={requestManualReference}
                    />

                    {!canUseMpesa && (
                        <p className="text-center text-xs text-muted-foreground">
                            Coin purchases will be available once your phone
                            number and M-PESA payment configuration are ready.
                        </p>
                    )}
                </section>

                {/* Promotion */}
                <section className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Sparkles className="h-6 w-6" />
                        </div>

                        <div className="min-w-0 flex-1">
                            <h2 className="font-bold text-foreground">
                                Get more from your coins
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Larger packages include bonus coins. Choose a
                                package that suits your needs and enjoy more
                                value on your wallet recharge.
                            </p>
                        </div>

                        <div className="rounded-xl bg-card/80 px-4 py-3 text-center">
                            <p className="text-xs text-muted-foreground">
                                Your invite code
                            </p>
                            <p className="mt-1 font-mono font-bold tracking-wider text-foreground">
                                {inviteCode}
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}

/*
|--------------------------------------------------------------------------
| Inertia Layout
|--------------------------------------------------------------------------
*/

CoinsWallet.layout = {
    breadcrumbs: [
        {
            title: "Wallet",
            href: "/wallets",
        },
        {
            title: "Coins",
        },
    ],
};
