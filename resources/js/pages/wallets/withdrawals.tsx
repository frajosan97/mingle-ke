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

import type {
    Withdrawal,
    WithdrawalStatus,
    PaginationLink,
    WithdrawalsWalletProps,
} from "@/types/wallet";

import WithdrawalDialog from "@/components/modals/withdrawal-dialog";
import { StatsCards } from "@/components/stats-cards";
import { PageHeader } from "@/components/page-header";
import { NoticeBanner } from "@/components/ui/notice-banner";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";

function titleCase(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function getWithdrawalStatus(status: WithdrawalStatus) {
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

function WithdrawalStatusBadge({ status }: { status: WithdrawalStatus }) {
    return <StatusBadge config={getWithdrawalStatus(status)} />;
}

function WithdrawalTableRow({ withdrawal }: { withdrawal: Withdrawal }) {
    return (
        <TableRow>
            <TableCell className="whitespace-nowrap font-medium">
                {withdrawal.reference}
            </TableCell>

            <TableCell className="whitespace-nowrap tabular-nums">
                {formatNumber(withdrawal.points)}
            </TableCell>

            <TableCell className="whitespace-nowrap font-semibold tabular-nums">
                {formatCurrency(withdrawal.amount_kes)}
            </TableCell>

            <TableCell className="whitespace-nowrap">
                {withdrawal.phone || "—"}
            </TableCell>

            <TableCell className="whitespace-nowrap">
                <WithdrawalStatusBadge status={withdrawal.status} />
            </TableCell>

            <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDate(withdrawal.created_at)}
            </TableCell>
        </TableRow>
    );
}

function WithdrawalMobileCard({ withdrawal }: { withdrawal: Withdrawal }) {
    return (
        <div className="rounded-xl border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                        {withdrawal.reference}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(withdrawal.created_at)}
                    </p>
                </div>

                <WithdrawalStatusBadge status={withdrawal.status} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                    <p className="text-xs text-muted-foreground">Points</p>
                    <p className="mt-1 font-semibold tabular-nums">
                        {formatNumber(withdrawal.points)}
                    </p>
                </div>

                <div>
                    <p className="text-xs text-muted-foreground">Withdrawal</p>
                    <p className="mt-1 font-semibold tabular-nums">
                        {formatCurrency(withdrawal.amount_kes)}
                    </p>
                </div>

                <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">
                        M-PESA number
                    </p>

                    <p className="mt-1 text-sm font-medium">
                        {withdrawal.phone || "—"}
                    </p>
                </div>
            </div>

            {withdrawal.failure_reason && (
                <div className="mt-3 rounded-lg bg-destructive/5 p-3 text-xs text-destructive">
                    {withdrawal.failure_reason}
                </div>
            )}
        </div>
    );
}

function WithdrawalPagination({ links }: { links: PaginationLink[] }) {
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

export default function WithdrawalsWallet() {
    const {
        pointsBalance = 0,
        conversionRate = 1,
        minimumPoints = 20,
        phone,
        phoneConfigured,
        mpesaAvailable,
        paybill,
        phoneSetupUrl,
        withdrawals,
    } = usePage<WithdrawalsWalletProps>().props;

    const [submitting, setSubmitting] = useState(false);

    const records = withdrawals?.data ?? [];
    const paginationLinks = withdrawals?.links ?? [];

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
            toast.error("M-PESA withdrawals are currently unavailable.");
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
            "/wallets/withdrawals/request",
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
                    <NoticeBanner
                        variant="warning"
                        icon={LockKeyhole}
                        title="Withdrawal not yet available"
                        description={
                            <>
                                You need{" "}
                                <strong>{formatNumber(minimumPoints)}</strong>{" "}
                                points to make a withdrawal. Your current
                                balance is{" "}
                                <strong>{formatNumber(pointsBalance)}</strong>{" "}
                                points. You need{" "}
                                <strong>
                                    {formatNumber(
                                        Math.max(
                                            minimumPoints - pointsBalance,
                                            0,
                                        ),
                                    )}
                                </strong>{" "}
                                more points to unlock withdrawals.
                            </>
                        }
                    />
                )}

                {/* Phone configuration notice */}
                {!hasPhone && (
                    <NoticeBanner
                        variant="warning"
                        icon={Phone}
                        title="M-PESA phone number required"
                        description="Add your phone number to receive withdrawal payments."
                        action={{
                            label: "Set up phone number",
                            href: phoneSetupUrl || "/settings/profile",
                        }}
                    />
                )}

                {/* M-PESA unavailable notice */}
                {mpesaAvailable === false && (
                    <NoticeBanner
                        variant="destructive"
                        icon={LockKeyhole}
                        title="M-PESA withdrawals unavailable"
                        description="Withdrawals are currently unavailable. Please try again later."
                    />
                )}

                {/* Withdrawal history */}
                <SectionCard
                    icon={History}
                    title="Withdrawal history"
                    description="Track your previous withdrawal requests."
                    meta={`${formatNumber(withdrawals?.total ?? 0)} transactions`}
                >
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
                                        {records.map((withdrawal) => (
                                            <WithdrawalTableRow
                                                key={withdrawal.id}
                                                withdrawal={withdrawal}
                                            />
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile cards */}
                            <div className="space-y-3 p-4 md:hidden">
                                {records.map((withdrawal) => (
                                    <WithdrawalMobileCard
                                        key={withdrawal.id}
                                        withdrawal={withdrawal}
                                    />
                                ))}
                            </div>

                            <WithdrawalPagination links={paginationLinks} />
                        </>
                    ) : (
                        <EmptyState
                            icon={ReceiptText}
                            title="No withdrawals yet"
                            description="Your withdrawal requests will appear here once you make your first withdrawal."
                        />
                    )}
                </SectionCard>
            </div>
        </>
    );
}
