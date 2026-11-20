import { Head, usePage } from "@inertiajs/react";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

import { formatDate, formatNumber } from "@/lib/wallet/formatters";

import {
    getMethodLabel,
    getTransactionStatus,
} from "@/lib/wallet/transaction-utils";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

type Transaction = {
    id: number;
    type: string;
    direction?: string | null;
    status: string;

    amount: number | string;
    currency?: string | null;
    amount_kes?: number | string | null;

    coins?: number | null;

    method?: string | null;
    payment_method?: string | null;
    phone?: string | null;

    reference?: string | null;
    bill_ref?: string | null;
    mpesa_receipt?: string | null;
    receipt?: string | null;

    description?: string | null;
    failure_reason?: string | null;

    meta?: Record<string, unknown> | null;

    created_at: string;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type TransactionPaginator = {
    data: Transaction[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
};

type TransactionsPageProps = {
    transactions: TransactionPaginator;
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function getTransactionAmount(transaction: Transaction): number {
    const amount = transaction.amount ?? transaction.amount_kes ?? 0;
    const parsed = Number(amount);

    return Number.isFinite(parsed) ? parsed : 0;
}

function formatTransactionAmount(transaction: Transaction): string {
    const amount = getTransactionAmount(transaction);
    const currency = transaction.currency || "KES";

    try {
        return new Intl.NumberFormat("en-KE", {
            style: "currency",
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(amount);
    } catch {
        return `${currency} ${amount.toFixed(2)}`;
    }
}

function normalizeValue(value?: string | null): string {
    return (value ?? "").toLowerCase().replace(/[_\s-]+/g, "");
}

function getTransactionDirection(transaction: Transaction): "in" | "out" {
    const direction = normalizeValue(transaction.direction);
    const type = normalizeValue(transaction.type);

    if (
        ["outbound", "outgoing", "debit", "withdrawal", "payout"].includes(
            direction,
        ) ||
        ["withdrawal", "payout"].includes(type)
    ) {
        return "out";
    }

    return "in";
}

function getTransactionTitle(transaction: Transaction): string {
    if (transaction.description) {
        return transaction.description;
    }

    const meta = transaction.meta ?? {};
    const metaLabel = meta.label ?? meta.plan_label ?? meta.description;

    if (typeof metaLabel === "string" && metaLabel.trim()) {
        return metaLabel;
    }

    const type = normalizeValue(transaction.type);

    const titles: Record<string, string> = {
        coinpurchase: "Coin purchase",
        coinpurchasepayment: "Coin purchase",
        coinspurchase: "Coin purchase",
        escortlistingfees: "Escort subscription",
        escortsubscription: "Escort subscription",
        escortpayment: "Escort subscription",
        withdrawal: "Withdrawal",
        payout: "Payout",
        deposit: "Wallet deposit",
        refund: "Refund",
        phone_reveal: "Phone reveal",
        phonereveal: "Phone reveal",
        adjustment: "Wallet adjustment",
    };

    if (titles[type]) {
        return titles[type];
    }

    return transaction.type
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getTransactionReference(transaction: Transaction): string | null {
    return (
        transaction.mpesa_receipt ||
        transaction.receipt ||
        transaction.reference ||
        transaction.bill_ref ||
        null
    );
}

/*
|--------------------------------------------------------------------------
| Status badge
|--------------------------------------------------------------------------
*/

function TransactionStatusBadge({ status }: { status: string }) {
    const config = getTransactionStatus(status);

    return (
        <StatusBadge
            config={{
                label: config.label,
                icon: config.icon,
                className: config.className,
            }}
        />
    );
}

/*
|--------------------------------------------------------------------------
| Transaction icon
|--------------------------------------------------------------------------
*/

function TransactionIcon({ transaction }: { transaction: Transaction }) {
    const isIncoming = getTransactionDirection(transaction) === "in";

    return (
        <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                isIncoming
                    ? "bg-brand-green/10 text-brand-green"
                    : "bg-primary/10 text-primary"
            }`}
        >
            {isIncoming ? (
                <ArrowDownLeft className="size-5" />
            ) : (
                <ArrowUpRight className="size-5" />
            )}
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Transaction details
|--------------------------------------------------------------------------
*/

function TransactionDetails({ transaction }: { transaction: Transaction }) {
    const method = transaction.method || transaction.payment_method;
    const reference = getTransactionReference(transaction);

    return (
        <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-foreground">
                    {getTransactionDirection(transaction) === "in" ? "+" : "−"}
                    {formatTransactionAmount(transaction)}
                </span>

                {transaction.coins != null && transaction.coins > 0 && (
                    <span className="text-xs text-muted-foreground">
                        · {formatNumber(transaction.coins)} coins
                    </span>
                )}
            </div>

            {method && (
                <p className="text-xs text-muted-foreground">
                    {getMethodLabel(method)}
                    {transaction.phone && ` · ${transaction.phone}`}
                </p>
            )}

            {reference && (
                <p className="truncate text-xs text-muted-foreground">
                    Reference:{" "}
                    <span className="font-mono text-foreground">
                        {reference}
                    </span>
                </p>
            )}

            {transaction.failure_reason && (
                <p className="mt-1 max-w-sm text-xs text-destructive">
                    {transaction.failure_reason}
                </p>
            )}
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Mobile transaction card
|--------------------------------------------------------------------------
*/

function TransactionMobileCard({ transaction }: { transaction: Transaction }) {
    const reference = getTransactionReference(transaction);
    const method = transaction.method || transaction.payment_method;

    return (
        <article className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <TransactionIcon transaction={transaction} />

                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                            {getTransactionTitle(transaction)}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                            #{transaction.id} ·{" "}
                            {formatDate(transaction.created_at)}
                        </p>
                    </div>
                </div>

                <TransactionStatusBadge status={transaction.status} />
            </div>

            <div className="rounded-xl bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">
                    Transaction amount
                </p>

                <p className="mt-1 text-lg font-bold text-foreground">
                    {getTransactionDirection(transaction) === "in" ? "+" : "−"}
                    {formatTransactionAmount(transaction)}
                </p>

                {transaction.coins != null && transaction.coins > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                        {formatNumber(transaction.coins)} coins
                    </p>
                )}
            </div>

            <div className="flex flex-wrap justify-between gap-2 text-xs">
                {method && (
                    <span className="text-muted-foreground">
                        Payment:{" "}
                        <span className="font-medium text-foreground">
                            {getMethodLabel(method)}
                        </span>
                    </span>
                )}

                {transaction.phone && (
                    <span className="font-medium text-foreground">
                        {transaction.phone}
                    </span>
                )}
            </div>

            {reference && (
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs">
                    <span className="text-muted-foreground">Reference</span>

                    <span className="break-all font-mono font-medium text-foreground">
                        {reference}
                    </span>
                </div>
            )}

            {transaction.failure_reason && (
                <div className="rounded-lg bg-destructive/5 p-3 text-xs leading-relaxed text-destructive">
                    {transaction.failure_reason}
                </div>
            )}
        </article>
    );
}

/*
|--------------------------------------------------------------------------
| Columns
|--------------------------------------------------------------------------
*/

const transactionColumns: DataTableColumn<Transaction>[] = [
    {
        key: "transaction",
        header: "Transaction",
        cell: (transaction) => (
            <div className="flex min-w-0 items-center gap-3">
                <TransactionIcon transaction={transaction} />

                <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">
                        {getTransactionTitle(transaction)}
                    </p>

                    <p className="mt-1 whitespace-nowrap text-xs text-muted-foreground">
                        #{transaction.id} · {formatDate(transaction.created_at)}
                    </p>
                </div>
            </div>
        ),
    },
    {
        key: "details",
        header: "Details",
        cell: (transaction) => <TransactionDetails transaction={transaction} />,
    },
    {
        key: "status",
        header: "Status",
        cell: (transaction) => (
            <TransactionStatusBadge status={transaction.status} />
        ),
    },
];

/*
|--------------------------------------------------------------------------
| Transactions page
|--------------------------------------------------------------------------
*/

export default function Transactions() {
    const { transactions } = usePage<TransactionsPageProps>().props;

    const total = transactions?.total ?? 0;

    return (
        <>
            <Head title="Transaction History" />

            <div className="space-y-8 pb-8">
                <PageHeader
                    title="Transaction History"
                    description="View your purchases, subscriptions, withdrawals, and other wallet transactions."
                    backHref="/wallets"
                    backHrefTitle="Back to Wallet"
                />

                <SectionCard
                    icon={Wallet}
                    title="All Transactions"
                    description={`${formatNumber(total)} ${
                        total === 1 ? "transaction" : "transactions"
                    } recorded`}
                >
                    <DataTable
                        data={transactions}
                        columns={transactionColumns}
                        getRowKey={(transaction) => transaction.id}
                        renderMobileCard={(transaction) => (
                            <TransactionMobileCard transaction={transaction} />
                        )}
                        emptyState={{
                            icon: <Wallet />,
                            title: "No transactions found",
                            description:
                                "Your purchases, subscriptions, withdrawals, and other transactions will appear here.",
                        }}
                    />
                </SectionCard>
            </div>
        </>
    );
}

Transactions.layout = {
    breadcrumbs: [
        {
            title: "Wallet",
            href: "/wallets",
        },
        {
            title: "Transaction History",
        },
    ],
};
