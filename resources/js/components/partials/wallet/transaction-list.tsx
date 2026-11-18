import type { CoinTransaction } from "@/types/transactions";
import TransactionTable from "./transaction-table";
import TransactionMobileCard from "./transaction-mobile-card";

export default function TransactionList({
    transactions,
}: {
    transactions: CoinTransaction[];
}) {
    return (
        <>
            <TransactionTable transactions={transactions} />
            <div className="divide-y divide-border md:hidden">
                {transactions.map((transaction) => (
                    <TransactionMobileCard
                        key={transaction.id}
                        transaction={transaction}
                    />
                ))}
            </div>
        </>
    );
}
