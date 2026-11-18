import { Head, usePage } from "@inertiajs/react";
import { Coins, CreditCard, Wallet } from "lucide-react";
import { StatsCards } from "@/components/stats-cards";
import TransactionList from "@/components/partials/wallet/transaction-list";
import TransactionPagination from "@/components/partials/wallet/transaction-pagination";

import { formatCurrency, formatNumber } from "@/lib/wallet/formatters";

import type { SharedProps } from "@/types/coin";
import type { TransactionsPageData } from "@/types/transactions";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function Transactions() {
    const { transactions, summary } = usePage<
        SharedProps & TransactionsPageData
    >().props;

    const records = transactions?.data ?? [];
    const paginationLinks = transactions?.links ?? [];

    const totalTransactions = transactions?.total ?? 0;

    return (
        <>
            <Head title="Transaction History" />

            <div className="space-y-8 pb-8">
                <PageHeader
                    title="Transaction History"
                    description="Track your coin purchases and wallet activity."
                    backHref="/wallets"
                    backHrefTitle="Back to Wallet"
                />

                {/* Wallet overview */}
                <StatsCards
                    cols={3}
                    data={[
                        {
                            id: "balance",
                            label: "Current Coin Balance",
                            value: formatNumber(summary?.coins_balance ?? 0),
                            icon: Wallet,
                            hint: "Available coins",
                            accent: true,
                        },
                        {
                            id: "purchased",
                            label: "Total Coins Purchased",
                            value: formatNumber(summary?.total_purchased ?? 0),
                            icon: Coins,
                            hint: "Successfully purchased",
                            tone: "success",
                        },
                        {
                            id: "spent",
                            label: "Total Spent",
                            value: formatCurrency(
                                summary?.total_spent_kes ?? 0,
                            ),
                            icon: CreditCard,
                            hint: "Completed purchases",
                        },
                    ]}
                />

                {/* Transaction history */}
                <section className="overflow-hidden rounded-xl border border-border bg-card">
                    <div className="flex flex-col gap-1 border-b border-border px-5 py-5 sm:px-6">
                        <h3 className="font-semibold text-foreground">
                            All Transactions
                        </h3>

                        <p className="text-sm text-muted-foreground">
                            {formatNumber(totalTransactions)}{" "}
                            {totalTransactions === 1
                                ? "transaction"
                                : "transactions"}{" "}
                            recorded
                        </p>
                    </div>

                    {records.length > 0 ? (
                        <>
                            <TransactionList transactions={records} />

                            <TransactionPagination
                                links={paginationLinks}
                                from={transactions?.from ?? null}
                                to={transactions?.to ?? null}
                                total={totalTransactions}
                            />
                        </>
                    ) : (
                        <EmptyState
                            icon={Wallet}
                            title="No transactions found"
                            description="You have not made any transactions yet."
                        />
                    )}
                </section>
            </div>
        </>
    );
}

Transactions.layout = {
    breadcrumbs: [
        { title: "Wallet", href: "/wallets" },
        { title: "Transaction History" },
    ],
};
