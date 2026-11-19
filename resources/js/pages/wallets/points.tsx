import { Head, Link, usePage } from "@inertiajs/react";
import {
    ArrowDownLeft,
    ArrowLeft,
    ArrowRight,
    ArrowUpRight,
    Award,
    Gift,
    History,
    ReceiptText,
    Users,
    Wallet,
} from "lucide-react";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatNumber, formatDate } from "@/lib/wallet/formatters";
import { StatsCards } from "@/components/stats-cards";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import type {
    PaginationLink,
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

function PointTransactionTableRow({
    transaction,
}: {
    transaction: PointTransaction;
}) {
    const Icon = getTransactionIcon(transaction.type);
    const config = getDirectionConfig(transaction.direction);

    return (
        <TableRow>
            <TableCell>
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
            </TableCell>

            <TableCell>
                <PointDirectionBadge direction={transaction.direction} />
            </TableCell>

            <TableCell>
                <span
                    className={`whitespace-nowrap font-semibold tabular-nums ${config.amountClass}`}
                >
                    {config.prefix}
                    {formatNumber(transaction.points)}
                </span>
            </TableCell>

            <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                {transaction.reference || "—"}
            </TableCell>

            <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDate(transaction.created_at)}
            </TableCell>
        </TableRow>
    );
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

function PointsPagination({ links }: { links: PaginationLink[] }) {
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

export default function PointsWallet() {
    const { summary, transactions } = usePage<PointsWalletProps>().props;

    const pointsBalance = summary?.points_balance ?? 0;
    const totalEarned = summary?.total_earned ?? 0;
    const totalSpent = summary?.total_spent ?? 0;

    const records = transactions?.data ?? [];
    const paginationLinks = transactions?.links ?? [];

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
                    {records.length > 0 ? (
                        <>
                            {/* Desktop table */}
                            <div className="hidden overflow-x-auto md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Transaction</TableHead>

                                            <TableHead>Direction</TableHead>

                                            <TableHead>Points</TableHead>

                                            <TableHead>Reference</TableHead>

                                            <TableHead>Date</TableHead>
                                        </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                        {records.map((transaction) => (
                                            <PointTransactionTableRow
                                                key={transaction.id}
                                                transaction={transaction}
                                            />
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile cards */}
                            <div className="space-y-3 p-4 md:hidden">
                                {records.map((transaction) => (
                                    <PointTransactionMobileCard
                                        key={transaction.id}
                                        transaction={transaction}
                                    />
                                ))}
                            </div>

                            <PointsPagination links={paginationLinks} />
                        </>
                    ) : (
                        <EmptyState
                            icon={ReceiptText}
                            title="No points transactions yet"
                            description="Your points earnings and deductions will appear here once you start earning or using points."
                        />
                    )}
                </SectionCard>
            </div>
        </>
    );
}
