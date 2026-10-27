// resources/js/pages/coin/index.tsx
import { Head, router, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Copy } from "lucide-react";

import Header from "@/components/coin/Header";
import AccountCards from "@/components/coin/AccountCards";
import RechargeHeader from "@/components/coin/RechargeHeader";
import PackageGrid from "@/components/coin/PackageGrid";
import CheckoutRow from "@/components/coin/CheckoutRow";
import PromoBanner from "@/components/coin/PromoBanner";
import {
    COIN_PACKAGES,
    FALLBACK_INVITE_CODE,
    MINIMUM_COINS,
    SharedProps,
    priceForCoins,
} from "@/types/coin";

export type PurchaseStatus = "idle" | "pending" | "done" | "failed";

const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS = 90_000;

export default function CoinIndex() {
    const { auth, flash, checkout_request_id, billRef, paybill } =
        usePage<SharedProps>().props;
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
    const timerRef = useRef<number | null>(null);

    /* ── Flash toasts ──────────────────────────────────────────── */
    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash?.success, flash?.error]);

    /* ── Seed checkout id from server flash ────────────────────── */
    useEffect(() => {
        if (checkout_request_id) {
            setCheckoutId(checkout_request_id);
            setStatus("pending");
        }
    }, [checkout_request_id]);

    /* ── Poll M-PESA until terminal or timeout ─────────────────── */
    useEffect(() => {
        if (!checkoutId || status !== "pending") return;

        let cancelled = false;
        const startedAt = Date.now();

        const tick = async () => {
            if (cancelled) return;

            if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
                setStatus("failed");
                setCheckoutId(null);
                toast.error("M-PESA did not respond. Please try again.");
                return;
            }

            try {
                const res = await fetch(`/coins/status/${checkoutId}`, {
                    headers: { Accept: "application/json" },
                });
                if (!res.ok) return;

                const data = await res.json();

                if (data.status === "completed") {
                    setStatus("done");
                    setCheckoutId(null);
                    router.reload({ only: ["auth"] });
                    toast.success(
                        `${data.coins} coins added to your wallet 🎉`,
                    );
                } else if (data.status === "failed") {
                    setStatus("failed");
                    setCheckoutId(null);
                    toast.error(
                        "M-PESA payment was not completed. Please try again.",
                    );
                }
            } catch {
                // network hiccup — keep polling
            }
        };

        timerRef.current = window.setInterval(tick, POLL_INTERVAL_MS);

        return () => {
            cancelled = true;
            if (timerRef.current !== null) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [checkoutId, status]);

    /* ── Derived package / price state ─────────────────────────── */
    const selected = useMemo(
        () =>
            COIN_PACKAGES.find((p) => p.id === selectedId) ?? COIN_PACKAGES[0],
        [selectedId],
    );
    const isCustom = selected.coins === "custom";

    const parsedCustom = parseInt(customAmount, 10);
    const isCustomValid = !isNaN(parsedCustom) && parsedCustom >= MINIMUM_COINS;
    const customPrice = isCustomValid ? priceForCoins(parsedCustom) : 0;

    const finalPrice = isCustom
        ? isCustomValid
            ? customPrice
            : 0
        : (selected.price ?? 0);

    const canRecharge =
        (isCustom ? isCustomValid : selected.price != null) &&
        !submitting &&
        status !== "pending";

    /* ── Actions ───────────────────────────────────────────────── */
    async function copyInvite() {
        try {
            await navigator.clipboard.writeText(inviteCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // clipboard unavailable
        }
    }

    function handleRecharge() {
        if (!canRecharge) return;

        const amount = isCustom ? parsedCustom : (selected.coins as number);

        router.post(
            "/coins/purchase",
            {
                package_id: isCustom ? null : selected.id,
                coins: amount,
                method: "mpesa",
                // amount_kes intentionally omitted — server computes it.
            },
            {
                preserveScroll: true,
                onStart: () => {
                    setSubmitting(true);
                    setStatus("idle");
                },
                onFinish: () => setSubmitting(false),
                onError: () => {
                    setSubmitting(false);
                    setStatus("idle");
                    toast.error(
                        "We couldn't start the payment. Please try again.",
                    );
                },
            },
        );
    }

    /* ── Render ───────────────────────────────────────────────── */
    return (
        <>
            <Head title="Get Coins · Top Up" />

            <div className="flex h-full flex-col overflow-hidden bg-background">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="orb orb-pink absolute -left-24 top-0 h-80 w-80 opacity-[0.08]" />
                    <div className="orb orb-orange absolute -right-24 bottom-0 h-80 w-80 opacity-[0.06]" />
                </div>

                <div className="relative z-10 flex-1 overflow-y-auto">
                    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                        <Header />

                        <AccountCards
                            username={username}
                            initial={initial}
                            avatarUrl={avatarUrl}
                            coins={coins}
                            inviteCode={inviteCode}
                            copied={copied}
                            onCopy={copyInvite}
                        />

                        <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
                            <RechargeHeader />

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

                            {billRef && paybill && (
                                <ManualPaymentCard
                                    billRef={billRef}
                                    paybill={paybill}
                                />
                            )}
                        </section>

                        <PromoBanner />
                        <div className="pb-6" />
                    </div>
                </div>
            </div>
        </>
    );
}

/* ── Subcomponent ─────────────────────────────────────────────── */

function ManualPaymentCard({
    billRef,
    paybill,
}: {
    billRef: string;
    paybill: string;
}) {
    const [copied, setCopied] = useState(false);

    async function copyBillRef() {
        try {
            await navigator.clipboard.writeText(billRef);
            setCopied(true);
            toast.success("Account number copied");
            setTimeout(() => setCopied(false), 1500);
        } catch {
            toast.error("Couldn't copy — please copy manually");
        }
    }

    return (
        <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-4 text-sm">
            <p className="font-semibold text-foreground">
                Prefer to pay from your M-PESA menu?
            </p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
                <li>
                    Go to <strong>M-PESA → Lipa na M-PESA → Pay Bill</strong>
                </li>
                <li>
                    Business Number: <strong>{paybill}</strong>
                </li>
                <li>
                    Account Number:{" "}
                    <strong className="font-mono">{billRef}</strong>
                </li>
                <li>Enter the amount you want to spend</li>
                <li>Confirm — coins land in your wallet within ~30 seconds</li>
            </ol>
            <button
                type="button"
                onClick={copyBillRef}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold transition hover:bg-accent"
            >
                <Copy className="h-3 w-3" />
                {copied ? "Copied" : "Copy account number"}
            </button>
        </div>
    );
}
