import { Head, usePage } from "@inertiajs/react";
import {
    ArrowDownLeft,
    ArrowUpRight,
    Award,
    Gift,
    History,
    ReceiptText,
    Users,
    Wallet,
} from "lucide-react";

import { formatNumber, formatDate } from "@/lib/wallet/formatters";
import { StatsCards } from "@/components/stats-cards";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { SectionCard } from "@/components/ui/section-card";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

import type {
    PointDirection,
    PointTransaction,
    PointsWalletProps,
} from "@/types/wallet";

function titleCase(value: string) {
    return value
        .replace(/[_-]/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getTransactionLabel(type: string) {
    switch (type.toLowerCase()) {
        case "earned":
            return "Points earned";

        case "referral":
            return "Referral reward";

        case "bonus":
            return "Bonus points";

        case "withdrawal":
            return "Points withdrawal";

        case "adjustment":
            return "Points adjustment";

        default:
            return titleCase(type);
    }
}

function getTransactionIcon(type: string) {
    switch (type.toLowerCase()) {
        case "referral":
            return Users;

        case "bonus":
            return Gift;

        case "earned":
            return Award;

        case "withdrawal":
            return Wallet;

        default:
            return History;
    }
}

function getDirectionConfig(direction: PointDirection) {
    if (direction === "credit") {
        return {
            label: "Earned",
            icon: ArrowDownLeft,
            className: "bg-green-500/10 text-green-600 dark:text-green-400",
            amountClass: "text-green-600 dark:text-green-400",
            prefix: "+",
        };
    }

    return {
        label: "Spent",
        icon: ArrowUpRight,
        className: "bg-destructive/10 text-destructive",
        amountClass: "text-destructive",
        prefix: "-",
    };
}

function PointDirectionBadge({ direction }: { direction: PointDirection }) {
    return <StatusBadge config={getDirectionConfig(direction)} />;
}

function PointTransactionMobileCard({
    transaction,
}: {
    transaction: PointTransaction;
}) {
    const Icon = getTransactionIcon(transaction.type);
    const config = getDirectionConfig(transaction.direction);

    return (
        <div className="rounded-xl border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                            {getTransactionLabel(transaction.type)}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                            {formatDate(transaction.created_at)}
                        </p>
                    </div>
                </div>

                <PointDirectionBadge direction={transaction.direction} />
            </div>

            <div className="mt-4 flex items-end justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Reference</p>

                    <p className="mt-1 truncate text-sm font-medium">
                        {transaction.reference || "—"}
                    </p>
                </div>

                <p
                    className={`shrink-0 text-lg font-bold tabular-nums ${config.amountClass}`}
                >
                    {config.prefix}
                    {formatNumber(transaction.points)}
                    <span className="ml-1 text-xs font-medium">pts</span>
                </p>
            </div>

            {transaction.description && (
                <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
                    {transaction.description}
                </p>
            )}
        </div>
    );
}

const pointColumns: DataTableColumn<PointTransaction>[] = [
    {
        key: "transaction",
        header: "Transaction",
        cell: (transaction) => {
            const Icon = getTransactionIcon(transaction.type);

            return (
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="min-w-0">
                        <p className="truncate font-medium">
                            {getTransactionLabel(transaction.type)}
                        </p>

                        <p className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">
                            {transaction.description ||
                                transaction.reference ||
                                "Points transaction"}
                        </p>
                    </div>
                </div>
            );
        },
    },
    {
        key: "direction",
        header: "Direction",
        cell: (transaction) => (
            <PointDirectionBadge direction={transaction.direction} />
        ),
    },
    {
        key: "points",
        header: "Points",
        cell: (transaction) => {
            const config = getDirectionConfig(transaction.direction);

            return (
                <span
                    className={`whitespace-nowrap font-semibold tabular-nums ${config.amountClass}`}
                >
                    {config.prefix}
                    {formatNumber(transaction.points)}
                </span>
            );
        },
    },
    {
        key: "reference",
        header: "Reference",
        className: "max-w-[200px] truncate text-sm text-muted-foreground",
        cell: (transaction) => transaction.reference || "—",
    },
    {
        key: "date",
        header: "Date",
        className: "whitespace-nowrap text-muted-foreground",
        cell: (transaction) => formatDate(transaction.created_at),
    },
];

export default function PointsWallet() {
    const { summary, transactions } = usePage<PointsWalletProps>().props;

    const pointsBalance = summary?.points_balance ?? 0;
    const totalEarned = summary?.total_earned ?? 0;
    const totalSpent = summary?.total_spent ?? 0;

    return (
        <>
            <Head title="Points History" />

            <div className="space-y-8 pb-8">
                <PageHeader
                    title="Points History"
                    description="Track your points earned and spent."
                    backHref="/wallets"
                    backHrefTitle="Back to Wallet"
                />

                {/* Points statistics */}
                <StatsCards
                    cols={3}
                    data={[
                        {
                            id: "points-balance",
                            label: "Available Points",
                            value: formatNumber(pointsBalance),
                            icon: Wallet,
                            hint: "Your current points balance",
                            accent: true,
                        },
                        {
                            id: "points-earned",
                            label: "Total Earned",
                            value: formatNumber(totalEarned),
                            icon: ArrowDownLeft,
                            hint: "Points credited to your account",
                            accent: true,
                        },
                        {
                            id: "points-spent",
                            label: "Total Spent",
                            value: formatNumber(totalSpent),
                            icon: ArrowUpRight,
                            hint: "Points deducted from your account",
                            accent: true,
                        },
                    ]}
                />

                {/* Points history */}
                <SectionCard
                    icon={History}
                    title="Points transactions"
                    description="A record of all points credited and deducted from your account."
                    meta={`${formatNumber(transactions?.total ?? 0)} transactions`}
                >
                    <DataTable
                        data={transactions}
                        columns={pointColumns}
                        getRowKey={(transaction) => transaction.id}
                        renderMobileCard={(transaction) => (
                            <PointTransactionMobileCard
                                transaction={transaction}
                            />
                        )}
                        emptyState={{
                            icon: <ReceiptText />,
                            title: "No points transactions yet",
                            description:
                                "Your points earnings and deductions will appear here once you start earning or using points.",
                        }}
                    />
                </SectionCard>
            </div>
        </>
    );
}
