// resources/js/pages/coin/history.tsx
import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import {
    ArrowDownLeft,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    Gift,
    XCircle,
    RotateCcw,
    Sparkles,
    Receipt,
    ChevronLeft,
    ChevronRight,
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CoinTransaction, CoinHistorySummary, Paginated } from "@/types/coin";

interface Props {
    transactions: Paginated<CoinTransaction>;
    summary: CoinHistorySummary;
}

const TYPE_META: Record<
    CoinTransaction["type"],
    { label: string; icon: typeof Gift; tone: string }
> = {
    purchase: {
        label: "Purchase",
        icon: ArrowDownLeft,
        tone: "text-brand-green",
    },
    bonus: { label: "Bonus", icon: Sparkles, tone: "text-brand-pink" },
    invite: { label: "Invite reward", icon: Gift, tone: "text-brand-pink" },
    spend: {
        label: "Spent",
        icon: ArrowUpRight,
        tone: "text-muted-foreground",
    },
    refund: { label: "Refund", icon: RotateCcw, tone: "text-brand-green" },
};

const STATUS_META: Record<
    CoinTransaction["status"],
    { label: string; icon: typeof Clock; tone: string }
> = {
    pending: {
        label: "Pending",
        icon: Clock,
        tone: "text-amber-600 bg-amber-50 border-amber-200",
    },
    processing: {
        label: "Processing",
        icon: Clock,
        tone: "text-amber-600 bg-amber-50 border-amber-200",
    },
    completed: {
        label: "Completed",
        icon: CheckCircle2,
        tone: "text-green-700 bg-green-50 border-green-200",
    },
    failed: {
        label: "Failed",
        icon: XCircle,
        tone: "text-red-700 bg-red-50 border-red-200",
    },
    cancelled: {
        label: "Cancelled",
        icon: XCircle,
        tone: "text-muted-foreground bg-muted border-border",
    },
};

function formatDate(iso: string | null): string {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString("en-KE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function CoinHistory({ transactions, summary }: Props) {
    const items = transactions.data;
    const [retryingId, setRetryingId] = useState<number | null>(null);

    function handleRetry(id: number) {
        setRetryingId(id);
        router.post(
            `/coins/retry/${id}`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setRetryingId(null),
                onSuccess: (page) => {
                    const checkoutId = (page.props as any)
                        .checkout_request_id as string | null;
                    if (checkoutId) {
                        // Bounce the user back to /coins with the checkout id
                        // seeded so the polling kicks off.
                        router.visit("/coins", { preserveScroll: true });
                    }
                },
            },
        );
    }

    return (
        <>
            <Head title="Coin transactions · MingleKE" />

            <div className="flex h-full flex-col overflow-hidden bg-background">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="orb orb-pink absolute -left-24 top-0 h-80 w-80 opacity-[0.08]" />
                    <div className="orb orb-orange absolute -right-24 bottom-0 h-80 w-80 opacity-[0.06]" />
                </div>

                <div className="relative z-10 flex-1 overflow-y-auto">
                    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
                        {/* ── Header ──────────────────────────────── */}
                        <div className="mb-6 flex items-center gap-3">
                            <Link
                                href="/coins"
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:bg-accent hover:text-foreground"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    Transactions
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Your coin purchases, rewards and spends.
                                </p>
                            </div>
                        </div>

                        {/* ── Summary ──────────────────────────────── */}
                        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <SummaryCard
                                label="Current balance"
                                value={`${summary.coins_balance.toLocaleString()} coins`}
                                tone="pink"
                                icon={Sparkles}
                            />
                            <SummaryCard
                                label="Total purchased"
                                value={`${summary.total_purchased.toLocaleString()} coins`}
                                tone="green"
                                icon={ArrowDownLeft}
                            />
                            <SummaryCard
                                label="Total spent"
                                value={`KES ${summary.total_spent_kes.toLocaleString()}`}
                                tone="orange"
                                icon={Receipt}
                            />
                        </div>

                        {/* ── List ──────────────────────────────── */}
                        <section className="overflow-hidden rounded-2xl border border-border bg-card">
                            {items.length === 0 ? (
                                <EmptyState />
                            ) : (
                                <ul className="divide-y divide-border">
                                    {items.map((tx) => (
                                        <TransactionRow
                                            key={tx.id}
                                            tx={tx}
                                            retrying={retryingId === tx.id}
                                            onRetry={() => handleRetry(tx.id)}
                                        />
                                    ))}
                                </ul>
                            )}
                        </section>

                        {/* ── Pagination ─────────────────────────── */}
                        {transactions.last_page > 1 && (
                            <div className="mt-6 flex items-center justify-between gap-2">
                                <button
                                    type="button"
                                    disabled={transactions.current_page <= 1}
                                    onClick={() =>
                                        router.get(
                                            transactions.links[0].url ??
                                                "/coins/history",
                                            {},
                                            { preserveScroll: true },
                                        )
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </button>

                                <span className="text-xs text-muted-foreground">
                                    Page {transactions.current_page} of{" "}
                                    {transactions.last_page}
                                </span>

                                <button
                                    type="button"
                                    disabled={
                                        transactions.current_page >=
                                        transactions.last_page
                                    }
                                    onClick={() =>
                                        router.get(
                                            transactions.links[
                                                transactions.links.length - 1
                                            ].url ?? "/coins/history",
                                            {},
                                            { preserveScroll: true },
                                        )
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}

                        <div className="pb-6" />
                    </div>
                </div>
            </div>
        </>
    );
}

/* ── Subcomponents ────────────────────────────────────────────── */

function SummaryCard({
    label,
    value,
    tone,
    icon: Icon,
}: {
    label: string;
    value: string;
    tone: "pink" | "green" | "orange";
    icon: typeof Sparkles;
}) {
    const tones = {
        pink: "from-brand-pink/10 to-brand-pink/0 text-brand-pink",
        green: "from-brand-green/10 to-brand-green/0 text-brand-green",
        orange: "from-brand-orange/10 to-brand-orange/0 text-brand-orange",
    };

    return (
        <div
            className={cn(
                "rounded-2xl border border-border bg-gradient-to-br p-4",
                tones[tone],
            )}
        >
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {label}
                </span>
                <Icon className="h-4 w-4" />
            </div>
            <p className="mt-2 text-xl font-bold text-foreground">{value}</p>
        </div>
    );
}

function TransactionRow({
    tx,
    retrying,
    onRetry,
}: {
    tx: CoinTransaction;
    retrying: boolean;
    onRetry: () => void;
}) {
    const type = TYPE_META[tx.type];
    const status = STATUS_META[tx.status];
    const TypeIcon = type.icon;
    const StatusIcon = status.icon;
    const isCredit =
        tx.type === "purchase" ||
        tx.type === "bonus" ||
        tx.type === "invite" ||
        tx.type === "refund";
    const canRetry =
        tx.type === "purchase" &&
        tx.status === "failed" &&
        tx.coins > 0 &&
        tx.amount_kes > 0;

    return (
        <li className="flex items-start gap-3 p-4 transition-colors hover:bg-accent/40 sm:p-5">
            <span
                className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                    isCredit
                        ? "bg-brand-green/10 text-brand-green"
                        : "bg-muted text-muted-foreground",
                )}
            >
                <TypeIcon className="h-4 w-4" />
            </span>

            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                            {type.label}
                            {tx.amount_kes > 0 && (
                                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                                    · KES {tx.amount_kes.toLocaleString()}
                                </span>
                            )}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatDate(tx.created_at)}
                            {tx.mpesa_receipt && (
                                <>
                                    {" · "}
                                    <span className="font-mono">
                                        {tx.mpesa_receipt}
                                    </span>
                                </>
                            )}
                        </p>
                        {tx.failure_reason && (
                            <p className="mt-1 text-xs text-red-600">
                                {tx.failure_reason}
                            </p>
                        )}
                    </div>

                    <div className="shrink-0 text-right">
                        <p
                            className={cn(
                                "text-sm font-bold",
                                isCredit
                                    ? "text-brand-green"
                                    : "text-foreground",
                            )}
                        >
                            {isCredit ? "+" : "−"}
                            {tx.coins.toLocaleString()}
                        </p>
                        <span
                            className={cn(
                                "mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                                status.tone,
                            )}
                        >
                            <StatusIcon className="h-2.5 w-2.5" />
                            {status.label}
                        </span>

                        {canRetry && (
                            <div className="mt-2">
                                <button
                                    type="button"
                                    onClick={onRetry}
                                    disabled={retrying}
                                    className={cn(
                                        "inline-flex items-center gap-1 rounded-full bg-brand-pink px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white transition",
                                        "hover:bg-brand-pink/90 disabled:cursor-not-allowed disabled:opacity-60",
                                    )}
                                >
                                    {retrying ? (
                                        <>
                                            <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                            Retrying…
                                        </>
                                    ) : (
                                        <>
                                            <RotateCcw className="h-2.5 w-2.5" />
                                            Retry
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </li>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-pink/10 text-brand-pink">
                <Receipt className="h-6 w-6" />
            </span>
            <p className="text-base font-semibold text-foreground">
                No transactions yet
            </p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Once you buy coins or receive a reward, it will show up here.
            </p>
            <Link
                href="/coins"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-glow-pink transition-all hover:shadow-glow-pink-strong"
            >
                Buy coins
                <ChevronRight className="h-4 w-4" />
            </Link>
        </div>
    );
}
