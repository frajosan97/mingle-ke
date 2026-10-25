// resources/js/pages/coin/index.tsx
import { Head, usePage } from "@inertiajs/react";
import { useMemo, useState } from "react";
import {
    Check,
    ChevronRight,
    Coins,
    Copy,
    HandCoins,
    History,
    Info,
    ShieldCheck,
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Shared-prop shape (mirrors HandleInertiaRequests) ───────────
interface AuthUser {
    id: number;
    name: string;
    email: string;
    avatar_url?: string | null;
    coins: number;
    tier: string;
    is_verified: boolean;
    invite_code?: string | null;
}

interface SharedProps {
    auth: { user: AuthUser | null };
    [key: string]: unknown;
}

// ── Static data ─────────────────────────────────────────────────
interface CoinPackage {
    id: number;
    coins: number | "custom";
    price: number | null;
    bonus?: string;
    popular?: boolean;
}

const COIN_PACKAGES: CoinPackage[] = [
    { id: 1, coins: 30, price: 50 },
    { id: 2, coins: 60, price: 100 },
    { id: 3, coins: 100, price: 165, bonus: "+10%" },
    { id: 4, coins: 150, price: 250, popular: true },
    { id: 5, coins: 200, price: 330, bonus: "+15%" },
    { id: 6, coins: 300, price: 500 },
    { id: 7, coins: 500, price: 820, bonus: "+25%" },
    { id: 8, coins: "custom", price: null },
];

const FALLBACK_INVITE_CODE = "ZT6AZEKT";
const CUSTOM_RATE = 1.67; // 50 KES / 30 coins
const MINIMUM_COINS = 30;

// ── Component ───────────────────────────────────────────────────
export default function CoinIndex() {
    const { auth } = usePage<SharedProps>().props;
    const user = auth.user;

    const coins = user?.coins ?? 0;
    const username = user?.name ?? "You";
    const avatarUrl = user?.avatar_url ?? null;
    const inviteCode = user?.invite_code ?? FALLBACK_INVITE_CODE;
    const initial = username.charAt(0).toUpperCase() || "?";

    // State
    const [selectedId, setSelectedId] = useState<number>(COIN_PACKAGES[0].id);
    const [customAmount, setCustomAmount] = useState<string>("");
    const [copied, setCopied] = useState(false);

    // Derived state
    const selected = useMemo(
        () =>
            COIN_PACKAGES.find((p) => p.id === selectedId) ?? COIN_PACKAGES[0],
        [selectedId],
    );

    const isCustom = selected.coins === "custom";

    // Calculate custom price
    const parsedCustomAmount = parseInt(customAmount, 10);
    const isCustomValid =
        !isNaN(parsedCustomAmount) && parsedCustomAmount >= MINIMUM_COINS;
    const customPrice = isCustomValid
        ? Math.round(parsedCustomAmount * CUSTOM_RATE)
        : 0;

    // Determine final price and validity
    const finalPrice = isCustom
        ? isCustomValid
            ? customPrice
            : 0
        : (selected.price ?? 0);
    const canRecharge = isCustom ? isCustomValid : selected.price != null;

    async function copyInvite() {
        try {
            await navigator.clipboard.writeText(inviteCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            /* ignore */
        }
    }

    return (
        <>
            <Head title="Get Coins · Top Up" />

            {/* Fixed-height layout: page never grows past device height */}
            <div className="flex h-full flex-col overflow-hidden bg-background">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="orb orb-pink absolute -left-24 top-0 h-80 w-80 opacity-[0.08]" />
                    <div className="orb orb-orange absolute -right-24 bottom-0 h-80 w-80 opacity-[0.06]" />
                </div>

                {/* Scrollable content area */}
                <div className="relative z-10 flex-1 overflow-y-auto">
                    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                        {/* ── Header ──────────────────────────────── */}
                        <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                    Get coins
                                </h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Top up your balance to keep chatting, unlock
                                    gifts and stand out.
                                </p>
                            </div>

                            <button
                                type="button"
                                className={cn(
                                    "inline-flex w-max items-center gap-2 rounded-xl border border-border bg-card px-3 py-2",
                                    "text-sm font-medium text-muted-foreground transition-colors",
                                    "hover:bg-accent hover:text-foreground",
                                )}
                            >
                                <History className="h-4 w-4" />
                                Transaction history
                            </button>
                        </header>

                        {/* ── Account & Invite ────────────────────── */}
                        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                            {/* Balance card */}
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

                            {/* Invite card */}
                            <button
                                type="button"
                                onClick={copyInvite}
                                className={cn(
                                    "group flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors sm:p-5",
                                    "hover:border-brand-pink/40 hover:bg-accent/40",
                                )}
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

                        {/* ── Packages ────────────────────────────── */}
                        <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
                            <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1">
                                <h2 className="text-base font-bold text-foreground sm:text-lg">
                                    Recharge
                                </h2>
                                <span className="rounded-full bg-brand-green/10 px-2 py-0.5 text-xs font-semibold text-brand-green">
                                    Save ~25% on fees
                                </span>
                                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                                {COIN_PACKAGES.map((pkg) => {
                                    const isSelected = selectedId === pkg.id;
                                    const pkgCustom = pkg.coins === "custom";

                                    return (
                                        <button
                                            key={pkg.id}
                                            type="button"
                                            onClick={() =>
                                                setSelectedId(pkg.id)
                                            }
                                            className={cn(
                                                "group relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4 text-center transition-all sm:p-5",
                                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink/40",
                                                isSelected
                                                    ? "border-brand-pink bg-gradient-brand-soft shadow-glow-pink"
                                                    : "border-border bg-muted/40 hover:border-brand-pink/40 hover:bg-muted/60",
                                                isSelected &&
                                                    pkgCustom &&
                                                    !isCustomValid &&
                                                    customAmount !== "" &&
                                                    "border-red-500/50 bg-red-500/5 shadow-none",
                                            )}
                                        >
                                            {pkg.popular && (
                                                <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-gradient-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-glow-pink">
                                                    Popular
                                                </span>
                                            )}

                                            {isSelected && !pkgCustom && (
                                                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-pink text-white">
                                                    <Check className="h-3 w-3" />
                                                </span>
                                            )}

                                            <div className="flex w-full items-center justify-center gap-2">
                                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-[10px] font-black italic text-white shadow-inner">
                                                    <Coins className="h-4 w-4" />
                                                </span>

                                                {pkgCustom && isSelected ? (
                                                    <input
                                                        type="number"
                                                        min={MINIMUM_COINS}
                                                        value={customAmount}
                                                        onChange={(e) =>
                                                            setCustomAmount(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Any"
                                                        className="w-full min-w-0 border-b-2 border-foreground/30 bg-transparent py-0.5 text-center text-xl font-bold text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-brand-pink sm:text-2xl"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <span className="text-xl font-bold text-foreground sm:text-2xl">
                                                        {pkgCustom
                                                            ? "Any"
                                                            : pkg.coins}
                                                    </span>
                                                )}
                                            </div>

                                            {pkgCustom ? (
                                                isSelected &&
                                                !isCustomValid &&
                                                customAmount !== "" ? (
                                                    <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                                                        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] text-white">
                                                            x
                                                        </span>
                                                        Minimum: {MINIMUM_COINS}
                                                    </span>
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
                                })}
                            </div>

                            {/* ── Checkout ────────────────────────── */}
                            <div className="mt-6 flex flex-col gap-5 border-t border-border pt-6 sm:flex-row sm:items-end sm:justify-between">
                                <div className="space-y-4">
                                    <div>
                                        <p className="mb-2 text-sm font-medium text-muted-foreground">
                                            Payment method
                                        </p>
                                        <button
                                            type="button"
                                            className={cn(
                                                "flex w-max items-center gap-3 rounded-xl border border-brand-pink/30 bg-brand-pink/5 px-4 py-2.5 transition-all",
                                                "hover:border-brand-pink/50 hover:bg-brand-pink/10",
                                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink/40",
                                            )}
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
                                                <Check
                                                    className="h-2.5 w-2.5"
                                                    strokeWidth={3}
                                                />
                                            </div>
                                        </button>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Total
                                        </p>
                                        <p className="text-2xl font-bold text-foreground transition-all">
                                            {canRecharge
                                                ? `KES ${finalPrice.toLocaleString()}`
                                                : "KES —"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:items-end">
                                    <button
                                        type="button"
                                        disabled={!canRecharge}
                                        className={cn(
                                            "w-full rounded-xl bg-gradient-brand px-6 py-3 text-sm font-semibold text-white shadow-glow-pink transition-all sm:w-64",
                                            "hover:shadow-glow-pink-strong",
                                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink/50",
                                            "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
                                        )}
                                    >
                                        Recharge
                                    </button>

                                    <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-brand-green/30 bg-brand-green/10 px-3 py-1 text-brand-green sm:self-end">
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">
                                            Secure payment
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* ── Promo banner ────────────────────────── */}
                        <button
                            type="button"
                            className={cn(
                                "group mt-4 flex w-full items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 text-left transition-colors sm:mt-6 sm:p-5",
                                "hover:border-brand-pink/40 hover:bg-accent/40",
                            )}
                        >
                            <div className="flex min-w-0 items-center gap-4">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-brand-soft text-xl">
                                    🤝
                                </span>
                                <div className="min-w-0">
                                    <h3 className="font-semibold text-foreground">
                                        Invite friends, earn coins
                                    </h3>
                                    <p className="truncate text-sm text-muted-foreground">
                                        Share your link — you both get rewarded.
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                        </button>

                        <div className="pb-6" />
                    </div>
                </div>
            </div>
        </>
    );
}
