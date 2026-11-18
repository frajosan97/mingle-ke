import { Head, Link, router, usePage } from "@inertiajs/react";
import {
    ArrowLeft,
    ArrowRight,
    Banknote,
    CheckCircle2,
    Clock3,
    Coins,
    History,
    LockKeyhole,
    Phone,
    Wallet,
    XCircle,
    ReceiptText,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import {
    formatCurrency,
    formatNumber,
    formatDate,
} from "@/lib/wallet/formatters";
import type { SharedProps } from "@/types/coin";
import WithdrawalDialog from "@/components/modals/withdrawal-dialog";
import { StatsCards } from "@/components/stats-cards";
import { PageHeader } from "@/components/page-header";

type PayoutStatus =
    | "pending"
    | "processing"
    | "completed"
    | "failed"
    | "rejected";

interface Payout {
    id: number;
    points: number;
    amount_kes: number;
    phone: string | null;
    status: PayoutStatus;
    reference: string;
    failure_reason: string | null;
    created_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PayoutPaginator {
    data: Payout[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
}

interface PayoutsPageProps {
    pointsBalance: number;
    conversionRate: number;
    minimumPoints: number;
    phone: string | null;
    phoneConfigured?: boolean;
    mpesaAvailable?: boolean;
    paybill?: string | null;
    phoneSetupUrl?: string;
    payouts: PayoutPaginator;
}

function titleCase(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function getPayoutStatus(status: PayoutStatus) {
    switch (status) {
        case "completed":
            return {
                label: "Paid",
                icon: CheckCircle2,
                className: "bg-green-500/10 text-green-600 dark:text-green-400",
            };

        case "failed":
        case "rejected":
            return {
                label: titleCase(status),
                icon: XCircle,
                className: "bg-destructive/10 text-destructive",
            };

        case "processing":
            return {
                label: "Processing",
                icon: Clock3,
                className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
            };

        default:
            return {
                label: "Pending",
                icon: Clock3,
                className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
            };
    }
}

function PayoutStatusBadge({ status }: { status: PayoutStatus }) {
    const config = getPayoutStatus(status);
    const Icon = config.icon;

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}
        >
            <Icon className="h-3.5 w-3.5" />
            {config.label}
        </span>
    );
}

function PayoutTableRow({ payout }: { payout: Payout }) {
    return (
        <TableRow>
            <TableCell className="whitespace-nowrap font-medium">
                {payout.reference}
            </TableCell>

            <TableCell className="whitespace-nowrap tabular-nums">
                {formatNumber(payout.points)}
            </TableCell>

            <TableCell className="whitespace-nowrap font-semibold tabular-nums">
                {formatCurrency(payout.amount_kes)}
            </TableCell>

            <TableCell className="whitespace-nowrap">
                {payout.phone || "—"}
            </TableCell>

            <TableCell className="whitespace-nowrap">
                <PayoutStatusBadge status={payout.status} />
            </TableCell>

            <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDate(payout.created_at)}
            </TableCell>
        </TableRow>
    );
}

function PayoutMobileCard({ payout }: { payout: Payout }) {
    return (
        <div className="rounded-xl border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                        {payout.reference}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(payout.created_at)}
                    </p>
                </div>

                <PayoutStatusBadge status={payout.status} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                    <p className="text-xs text-muted-foreground">Points</p>
                    <p className="mt-1 font-semibold tabular-nums">
                        {formatNumber(payout.points)}
                    </p>
                </div>

                <div>
                    <p className="text-xs text-muted-foreground">Payout</p>
                    <p className="mt-1 font-semibold tabular-nums">
                        {formatCurrency(payout.amount_kes)}
                    </p>
                </div>

                <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">
                        M-PESA number
                    </p>
                    <p className="mt-1 text-sm font-medium">
                        {payout.phone || "—"}
                    </p>
                </div>
            </div>

            {payout.failure_reason && (
                <div className="mt-3 rounded-lg bg-destructive/5 p-3 text-xs text-destructive">
                    {payout.failure_reason}
                </div>
            )}
        </div>
    );
}

function PayoutPagination({ links }: { links: PaginationLink[] }) {
    if (!links.length || links.length <= 3) {
        return null;
    }

    const previous = links[0];
    const next = links[links.length - 1];
    const pages = links.slice(1, -1);

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-4">
            <Link
                href={previous.url || "#"}
                preserveScroll
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    previous.url
                        ? "hover:bg-muted"
                        : "pointer-events-none opacity-40"
                }`}
                aria-disabled={!previous.url}
            >
                <ArrowLeft className="h-4 w-4" />
                Previous
            </Link>

            <div className="flex flex-wrap items-center gap-1">
                {pages.map((link, index) => {
                    const label = link.label.replace(/<[^>]*>/g, "").trim();

                    return (
                        <Link
                            key={`${label}-${index}`}
                            href={link.url || "#"}
                            preserveScroll
                            aria-current={link.active ? "page" : undefined}
                            aria-disabled={!link.url}
                            className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm transition ${
                                link.active
                                    ? "bg-primary text-primary-foreground"
                                    : link.url
                                      ? "hover:bg-muted"
                                      : "pointer-events-none opacity-40"
                            }`}
                        >
                            {label}
                        </Link>
                    );
                })}
            </div>

            <Link
                href={next.url || "#"}
                preserveScroll
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    next.url
                        ? "hover:bg-muted"
                        : "pointer-events-none opacity-40"
                }`}
                aria-disabled={!next.url}
            >
                Next
                <ArrowRight className="h-4 w-4" />
            </Link>
        </div>
    );
}

export default function PayoutsWallet() {
    const {
        pointsBalance = 0,
        conversionRate = 1,
        minimumPoints = 20,
        phone,
        phoneConfigured,
        mpesaAvailable,
        paybill,
        phoneSetupUrl,
        payouts,
    } = usePage<SharedProps & PayoutsPageProps>().props;

    const [submitting, setSubmitting] = useState(false);

    const records = payouts?.data ?? [];
    const paginationLinks = payouts?.links ?? [];

    const hasPhone = phoneConfigured ?? Boolean(phone?.trim());
    const canMeetMinimum = pointsBalance >= minimumPoints;

    const handleWithdrawal = (requestedPoints: number) => {
        if (!canMeetMinimum) {
            toast.error(
                `You need at least ${formatNumber(minimumPoints)} points to withdraw.`,
            );
            return;
        }

        if (!hasPhone) {
            toast.error("Please configure your phone number first.");
            return;
        }

        if (mpesaAvailable === false) {
            toast.error("M-PESA payouts are currently unavailable.");
            return;
        }

        if (
            !Number.isSafeInteger(requestedPoints) ||
            requestedPoints < minimumPoints ||
            requestedPoints > pointsBalance
        ) {
            toast.error("Please enter a valid withdrawal amount.");
            return;
        }

        router.post(
            "/wallets/payouts/request",
            { points: requestedPoints },
            {
                preserveScroll: true,

                onStart: () => setSubmitting(true),

                onSuccess: () => {
                    toast.success(
                        "Your withdrawal request has been submitted.",
                    );
                },

                onError: (errors) => {
                    const firstError = Object.values(errors).find(
                        (value) => typeof value === "string",
                    );

                    toast.error(
                        firstError ||
                            "Unable to submit your withdrawal request.",
                    );
                },

                onFinish: () => setSubmitting(false),
            },
        );
    };

    return (
        <>
            <Head title="Withdrawals" />

            <div className="space-y-8 pb-8">
                <PageHeader
                    title="Withdrawals"
                    description="Convert your earned points into cash through M-PESA."
                    backHref="/wallets"
                    backHrefTitle="Back to Wallet"
                    actions={
                        <>
                            {canMeetMinimum && (
                                <WithdrawalDialog
                                    pointsBalance={pointsBalance}
                                    conversionRate={conversionRate}
                                    minimumPoints={minimumPoints}
                                    phone={phone}
                                    phoneConfigured={hasPhone}
                                    mpesaAvailable={mpesaAvailable !== false}
                                    paybill={paybill}
                                    submitting={submitting}
                                    onSubmit={handleWithdrawal}
                                />
                            )}
                        </>
                    }
                />

                {/* Wallet statistics */}
                <StatsCards
                    cols={3}
                    data={[
                        {
                            id: "points",
                            label: "Available Points",
                            value: formatNumber(pointsBalance),
                            icon: Coins,
                            hint: "Available points",
                            accent: true,
                        },
                        {
                            id: "conversion-rate",
                            label: "Conversion rate",
                            value: formatCurrency(conversionRate),
                            icon: Banknote,
                            hint: "Value of 1 point",
                            accent: true,
                        },
                        {
                            id: "minimum-withdrawal",
                            label: "Minimum withdrawal",
                            value: formatNumber(minimumPoints),
                            icon: LockKeyhole,
                            hint: "Points needed to withdraw",
                            accent: true,
                        },
                    ]}
                />

                {/* Minimum threshold notice */}
                {!canMeetMinimum && (
                    <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                        <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                        <div>
                            <p className="font-semibold">
                                Withdrawal not yet available
                            </p>

                            <p className="mt-1 text-sm text-muted-foreground">
                                You need{" "}
                                <strong>{formatNumber(minimumPoints)}</strong>{" "}
                                points to make a withdrawal. Your current
                                balance is{" "}
                                <strong>{formatNumber(pointsBalance)}</strong>{" "}
                                points.
                            </p>

                            <p className="mt-1 text-sm text-muted-foreground">
                                You need{" "}
                                <strong>
                                    {formatNumber(
                                        Math.max(
                                            minimumPoints - pointsBalance,
                                            0,
                                        ),
                                    )}
                                </strong>{" "}
                                more points to unlock withdrawals.
                            </p>
                        </div>
                    </div>
                )}

                {/* Phone configuration notice */}
                {!hasPhone && (
                    <div className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <Phone className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                            <div>
                                <p className="font-semibold">
                                    M-PESA phone number required
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Add your phone number to receive withdrawal
                                    payments.
                                </p>
                            </div>
                        </div>

                        <Link
                            href={phoneSetupUrl || "/settings/profile"}
                            className="inline-flex shrink-0 items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold transition hover:bg-muted"
                        >
                            Set up phone number
                        </Link>
                    </div>
                )}

                {mpesaAvailable === false && (
                    <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                        <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />

                        <div>
                            <p className="font-semibold">
                                M-PESA payouts unavailable
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Payouts are currently unavailable. Please try
                                again later.
                            </p>
                        </div>
                    </div>
                )}

                {/* Withdrawal history */}
                <section className="overflow-hidden rounded-xl border bg-card">
                    <div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                            <History className="h-5 w-5 text-muted-foreground" />

                            <div>
                                <h2 className="font-semibold">
                                    Withdrawal history
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Track your previous withdrawal requests.
                                </p>
                            </div>
                        </div>

                        <span className="text-sm text-muted-foreground">
                            {formatNumber(payouts?.total ?? 0)} transactions
                        </span>
                    </div>

                    {records.length > 0 ? (
                        <>
                            {/* Desktop table */}
                            <div className="hidden overflow-x-auto md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Reference</TableHead>
                                            <TableHead>Points</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>M-PESA number</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Date</TableHead>
                                        </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                        {records.map((payout) => (
                                            <PayoutTableRow
                                                key={payout.id}
                                                payout={payout}
                                            />
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile cards */}
                            <div className="space-y-3 p-4 md:hidden">
                                {records.map((payout) => (
                                    <PayoutMobileCard
                                        key={payout.id}
                                        payout={payout}
                                    />
                                ))}
                            </div>

                            <PayoutPagination links={paginationLinks} />
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                                <ReceiptText className="h-6 w-6 text-muted-foreground" />
                            </div>

                            <h3 className="mt-4 font-semibold">
                                No withdrawals yet
                            </h3>

                            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                Your withdrawal requests will appear here once
                                you make your first withdrawal.
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}
