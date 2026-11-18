import { Head, Link, router, usePage } from "@inertiajs/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Copy, LockKeyhole, Phone, ShieldCheck } from "lucide-react";

import AccountCards from "@/components/partials/coin/AccountCards";
import RechargeHeader from "@/components/partials/coin/RechargeHeader";
import PackageGrid from "@/components/partials/coin/PackageGrid";
import CheckoutRow from "@/components/partials/coin/CheckoutRow";
import PromoBanner from "@/components/partials/coin/PromoBanner";

import {
    COIN_PACKAGES,
    FALLBACK_INVITE_CODE,
    MINIMUM_COINS,
    SharedProps,
    priceForCoins,
} from "@/types/coin";
import { PageHeader } from "@/components/page-header";

export type PurchaseStatus = "idle" | "pending" | "done" | "failed";

const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS = 90_000;
const COPY_FEEDBACK_MS = 1_500;

type WalletPageProps = {
    phoneConfigured: boolean;
    mpesaAvailable: boolean;
    phoneSetupUrl: string;
    billRef?: string | null;
    paybill?: string | null;
    checkout_request_id?: string | null;
};

function useMpesaPolling({
    checkoutId,
    status,
    onCompleted,
    onFailed,
    onTimeout,
}: {
    checkoutId: string | null;
    status: PurchaseStatus;
    onCompleted: (coins: number) => void;
    onFailed: () => void;
    onTimeout: () => void;
}) {
    const timerRef = useRef<number | null>(null);

    const callbacksRef = useRef({
        onCompleted,
        onFailed,
        onTimeout,
    });

    callbacksRef.current = {
        onCompleted,
        onFailed,
        onTimeout,
    };

    useEffect(() => {
        if (!checkoutId || status !== "pending") return;

        let cancelled = false;
        const startedAt = Date.now();

        const tick = async () => {
            if (cancelled) return;

            if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
                callbacksRef.current.onTimeout();
                return;
            }

            try {
                const response = await fetch(
                    `/wallets/transactions/${encodeURIComponent(checkoutId)}/status`,
                    {
                        headers: {
                            Accept: "application/json",
                        },
                        credentials: "same-origin",
                    },
                );

                if (!response.ok) return;

                const data = await response.json();

                if (cancelled) return;

                if (data.status === "completed") {
                    callbacksRef.current.onCompleted(data.coins);
                } else if (data.status === "failed") {
                    callbacksRef.current.onFailed();
                }
            } catch {
                // Continue polling after temporary network errors.
            }
        };

        void tick();

        timerRef.current = window.setInterval(tick, POLL_INTERVAL_MS);

        return () => {
            cancelled = true;

            if (timerRef.current !== null) {
                window.clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [checkoutId, status]);
}

export default function CoinsWallet() {
    const {
        auth,
        flash,
        checkout_request_id,
        billRef,
        paybill,
        phoneConfigured,
        mpesaAvailable,
        phoneSetupUrl,
    } = usePage<SharedProps & WalletPageProps>().props;

    const user = auth.user;

    const coins = user?.coins ?? 0;
    const username = user?.name ?? "You";
    const avatarUrl = user?.avatar_url ?? null;
    const inviteCode = user?.invite_code ?? FALLBACK_INVITE_CODE;

    const initial = username.charAt(0).toUpperCase() || "?";

    const [selectedId, setSelectedId] = useState<number>(COIN_PACKAGES[0].id);

    const [customAmount, setCustomAmount] = useState("");
    const [copied, setCopied] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState<PurchaseStatus>("idle");
    const [checkoutId, setCheckoutId] = useState<string | null>(null);

    /*
    |--------------------------------------------------------------------------
    | Payment Availability
    |--------------------------------------------------------------------------
    */

    const canUseMpesa = phoneConfigured && mpesaAvailable;

    /*
    |--------------------------------------------------------------------------
    | Flash Messages
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash?.success, flash?.error]);

    /*
    |--------------------------------------------------------------------------
    | Restore Pending Checkout
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (!checkout_request_id) return;

        setCheckoutId(checkout_request_id);
        setStatus("pending");
    }, [checkout_request_id]);

    /*
    |--------------------------------------------------------------------------
    | Payment Callbacks
    |--------------------------------------------------------------------------
    */

    const handleCompleted = useCallback((coinsAdded: number) => {
        setStatus("done");
        setCheckoutId(null);

        router.reload({
            only: ["auth"],
        });

        toast.success(`${coinsAdded} coins added to your wallet 🎉`);
    }, []);

    const handleFailed = useCallback(() => {
        setStatus("failed");
        setCheckoutId(null);

        toast.error("M-PESA payment was not completed. Please try again.");
    }, []);

    const handleTimeout = useCallback(() => {
        setStatus("failed");
        setCheckoutId(null);

        toast.error("M-PESA did not respond. Please try again.");
    }, []);

    useMpesaPolling({
        checkoutId,
        status,
        onCompleted: handleCompleted,
        onFailed: handleFailed,
        onTimeout: handleTimeout,
    });

    /*
    |--------------------------------------------------------------------------
    | Coin Package Selection
    |--------------------------------------------------------------------------
    */

    const selected = useMemo(
        () =>
            COIN_PACKAGES.find((item) => item.id === selectedId) ??
            COIN_PACKAGES[0],
        [selectedId],
    );

    const isCustom = selected.coins === "custom";

    const parsedCustom = Number.parseInt(customAmount, 10);

    const isCustomValid =
        !Number.isNaN(parsedCustom) && parsedCustom >= MINIMUM_COINS;

    const customPrice = isCustomValid ? priceForCoins(parsedCustom) : 0;

    const finalPrice = isCustom ? customPrice : (selected.price ?? 0);

    const canRecharge =
        canUseMpesa &&
        (isCustom ? isCustomValid : selected.price != null) &&
        !submitting &&
        status !== "pending";

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

            window.setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
        } catch {
            toast.error("Couldn't copy invite code.");
        }
    }, [inviteCode]);

    /*
    |--------------------------------------------------------------------------
    | Purchase Coins
    |--------------------------------------------------------------------------
    */

    const handleRecharge = useCallback(() => {
        if (!canRecharge) {
            if (!phoneConfigured) {
                toast.error(
                    "Please set up your phone number before purchasing coins.",
                );
                return;
            }

            if (!mpesaAvailable) {
                toast.error("M-PESA payments are currently locked.");
                return;
            }

            return;
        }

        const amount = isCustom ? parsedCustom : (selected.coins as number);

        router.post(
            "/wallets/coins/purchase",
            {
                package_id: isCustom ? null : selected.id,
                coins: amount,
                method: "mpesa",
            },
            {
                preserveScroll: true,

                onStart: () => {
                    setSubmitting(true);
                    setStatus("idle");
                },

                onFinish: () => {
                    setSubmitting(false);
                },

                onError: (errors) => {
                    setSubmitting(false);
                    setStatus("idle");

                    const firstError = Object.values(errors)[0];

                    toast.error(
                        typeof firstError === "string"
                            ? firstError
                            : "We couldn't start the payment. Please try again.",
                    );
                },
            },
        );
    }, [
        canRecharge,
        phoneConfigured,
        mpesaAvailable,
        isCustom,
        parsedCustom,
        selected.id,
        selected.coins,
    ]);

    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

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

                <section>
                    <AccountCards
                        username={username}
                        initial={initial}
                        avatarUrl={avatarUrl}
                        coins={coins}
                        inviteCode={inviteCode}
                        copied={copied}
                        onCopy={copyInvite}
                    />
                </section>

                {/* Phone Number Requirement */}
                {!phoneConfigured && (
                    <section className="flex flex-col gap-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                                <Phone className="size-5" />
                            </div>

                            <div>
                                <h3 className="font-semibold text-foreground">
                                    Set up your phone number first
                                </h3>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Add your phone number to your profile before
                                    purchasing coins. M-PESA payments will use
                                    your saved number.
                                </p>
                            </div>
                        </div>

                        <Link
                            href={phoneSetupUrl}
                            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
                        >
                            Set up phone number
                        </Link>
                    </section>
                )}

                {/* M-PESA Configuration Lock */}
                {!mpesaAvailable && (
                    <section className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                            <LockKeyhole className="size-5" />
                        </div>

                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-semibold text-foreground">
                                    M-PESA locked
                                </h3>

                                <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                                    Unavailable
                                </span>
                            </div>

                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                M-PESA payment configuration is incomplete. Coin
                                purchases are temporarily disabled. Please try
                                again later.
                            </p>
                        </div>
                    </section>
                )}

                {/* Recharge Coins */}
                <section className="space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <RechargeHeader />

                        {canUseMpesa && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-600">
                                <ShieldCheck className="size-3.5" />
                                M-PESA available
                            </span>
                        )}
                    </div>

                    <PackageGrid
                        selectedId={selectedId}
                        isCustomValid={isCustomValid}
                        customAmount={customAmount}
                        customPrice={customPrice}
                        onSelect={setSelectedId}
                        onCustomChange={setCustomAmount}
                    />

                    <CheckoutRow
                        canRecharge={canRecharge}
                        finalPrice={finalPrice}
                        submitting={submitting}
                        status={status}
                        onRecharge={handleRecharge}
                    />

                    {canUseMpesa && billRef && paybill && (
                        <ManualPaymentCard
                            billRef={billRef}
                            paybill={paybill}
                        />
                    )}

                    {!canUseMpesa && (
                        <p className="text-center text-xs text-muted-foreground">
                            Coin purchases will be available once your phone
                            number and M-PESA payment setup are ready.
                        </p>
                    )}
                </section>

                <PromoBanner />
            </div>
        </>
    );
}

/*
|--------------------------------------------------------------------------
| Manual M-PESA Payment Card
|--------------------------------------------------------------------------
*/

function ManualPaymentCard({
    billRef,
    paybill,
}: {
    billRef: string;
    paybill: string;
}) {
    const [copied, setCopied] = useState(false);

    const copyBillRef = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(billRef);

            setCopied(true);

            toast.success("Account number copied");

            window.setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
        } catch {
            toast.error("Couldn't copy — please copy manually.");
        }
    }, [billRef]);

    return (
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
            <div className="space-y-1">
                <h3 className="font-semibold text-foreground">
                    Prefer to pay from your M-PESA menu?
                </h3>

                <p className="text-sm text-muted-foreground">
                    Use the following details to complete your payment manually.
                </p>
            </div>

            <ol className="mt-4 list-decimal space-y-2 pl-5 leading-relaxed text-muted-foreground">
                <li>
                    Go to{" "}
                    <strong className="text-foreground">
                        M-PESA → Lipa na M-PESA → Pay Bill
                    </strong>
                </li>

                <li>
                    Business Number:{" "}
                    <strong className="text-foreground">{paybill}</strong>
                </li>

                <li>
                    Account Number:{" "}
                    <strong className="font-mono text-foreground">
                        {billRef}
                    </strong>
                </li>

                <li>Enter the amount you want to spend.</li>

                <li>Confirm your payment.</li>
            </ol>

            <button
                type="button"
                onClick={copyBillRef}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
                <Copy className="size-4" />
                {copied ? "Copied" : "Copy account number"}
            </button>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Layout
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
