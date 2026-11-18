import { ArrowDownLeft } from "lucide-react";

import { TableCell, TableRow } from "@/components/ui/table";

import TransactionActions from "./transaction-actions";
import TransactionDetails from "./transaction-details";
import TransactionStatus from "./transaction-status";

import { formatDate } from "@/lib/wallet/formatters";
import { getTransactionTitle } from "@/lib/wallet/transaction-utils";

import type { CoinTransaction } from "@/types/transactions";

export default function TransactionRow({
    transaction,
}: {
    transaction: CoinTransaction;
}) {
    return (
        <TableRow className="group transition-colors hover:bg-muted/40">
            <TableCell className="px-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <ArrowDownLeft className="size-4" />
                    </div>

                    <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">
                            {getTransactionTitle(transaction)}
                        </p>

                        <p className="mt-1 whitespace-nowrap text-xs text-muted-foreground">
                            #{transaction.id} ·{" "}
                            {formatDate(transaction.created_at)}
                        </p>
                    </div>
                </div>
            </TableCell>

            <TableCell className="px-3 py-3">
                <TransactionDetails transaction={transaction} />
            </TableCell>

            <TableCell className="px-3 py-3">
                <TransactionStatus status={transaction.status} />
            </TableCell>

            <TableCell className="px-3 py-3 text-right">
                <div className="flex justify-end">
                    <TransactionActions transaction={transaction} />
                </div>
            </TableCell>
        </TableRow>
    );
}
