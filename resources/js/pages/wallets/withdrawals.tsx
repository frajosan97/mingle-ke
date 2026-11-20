import { Head, router, usePage } from "@inertiajs/react";
import {
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
    formatCurrency,
    formatNumber,
    formatDate,
} from "@/lib/wallet/formatters";

import type {
    Withdrawal,
    WithdrawalStatus,
    WithdrawalsWalletProps,
} from "@/types/wallet";

import WithdrawalDialog from "@/components/modals/withdrawal-dialog";
import { StatsCards } from "@/components/stats-cards";
import { PageHeader } from "@/components/page-header";
import { NoticeBanner } from "@/components/ui/notice-banner";
import { StatusBadge } from "@/components/ui/status-badge";
import { SectionCard } from "@/components/ui/section-card";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

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

const withdrawalColumns: DataTableColumn<Withdrawal>[] = [
    {
        key: "reference",
        header: "Reference",
        className: "whitespace-nowrap font-medium",
        cell: (w) => w.reference,
    },
    {
        key: "points",
        header: "Points",
        className: "whitespace-nowrap tabular-nums",
        cell: (w) => formatNumber(w.points),
    },
    {
        key: "amount",
        header: "Amount",
        className: "whitespace-nowrap font-semibold tabular-nums",
        cell: (w) => formatCurrency(w.amount_kes),
    },
    {
        key: "phone",
        header: "M-PESA number",
        className: "whitespace-nowrap",
        cell: (w) => w.phone || "—",
    },
    {
        key: "status",
        header: "Status",
        className: "whitespace-nowrap",
        cell: (w) => <WithdrawalStatusBadge status={w.status} />,
    },
    {
        key: "date",
        header: "Date",
        className: "whitespace-nowrap text-muted-foreground",
        cell: (w) => formatDate(w.created_at),
    },
];

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
                    <DataTable
                        data={withdrawals}
                        columns={withdrawalColumns}
                        getRowKey={(w) => w.id}
                        renderMobileCard={(w) => (
                            <WithdrawalMobileCard withdrawal={w} />
                        )}
                        emptyState={{
                            icon: <ReceiptText />,
                            title: "No withdrawals yet",
                            description:
                                "Your withdrawal requests will appear here once you make your first withdrawal.",
                        }}
                    />
                </SectionCard>
            </div>
        </>
    );
}
