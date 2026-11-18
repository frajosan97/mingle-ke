import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import TransactionRow from "./transaction-row";
import type { CoinTransaction } from "@/types/transactions";

export default function TransactionTable({
    transactions,
}: {
    transactions: CoinTransaction[];
}) {
    return (
        <div className="hidden md:block">
            <Table>
                <TableHeader>
                    <TableRow className="border-b border-border hover:bg-transparent">
                        <TableHead className="h-11 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Transaction
                        </TableHead>

                        <TableHead className="h-11 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Details
                        </TableHead>

                        <TableHead className="h-11 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Status
                        </TableHead>

                        <TableHead className="h-11 px-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Action
                        </TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {transactions.length > 0 ? (
                        transactions.map((transaction) => (
                            <TransactionRow
                                key={transaction.id}
                                transaction={transaction}
                            />
                        ))
                    ) : (
                        <TableRow>
                            <td
                                colSpan={4}
                                className="h-32 text-center text-sm text-muted-foreground"
                            >
                                No transactions found.
                            </td>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
