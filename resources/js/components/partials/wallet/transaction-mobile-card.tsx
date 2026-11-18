import { ArrowDownLeft } from "lucide-react";

import TransactionActions from "./transaction-actions";
import TransactionStatus from "./transaction-status";
import { formatDate } from "@/lib/wallet/formatters";
import {
    getMethodLabel,
    getTransactionTitle,
} from "@/lib/wallet/transaction-utils";
import { formatCurrency, formatNumber } from "@/lib/wallet/formatters";
import type { CoinTransaction } from "@/types/transactions";

export default function TransactionMobileCard({
    transaction,
}: {
    transaction: CoinTransaction;
}) {
    return (
        <article className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <ArrowDownLeft className="size-5" />
                    </div>
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
                <TransactionStatus status={transaction.status} />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/30 px-4 py-3">
                <div>
                    <p className="text-xs text-muted-foreground">
                        Coins received
                    </p>
                    <p className="mt-1 font-semibold text-foreground">
                        +{formatNumber(transaction.coins)}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-muted-foreground">Amount paid</p>
                    <p className="mt-1 font-semibold text-foreground">
                        {formatCurrency(transaction.amount_kes)}
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                    Payment:{" "}
                    <span className="font-medium text-foreground">
                        {getMethodLabel(transaction.method)}
                    </span>
                </span>
                {transaction.phone && (
                    <span className="font-medium text-foreground">
                        {transaction.phone}
                    </span>
                )}
            </div>

            {transaction.mpesa_receipt && (
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs">
                    <span className="text-muted-foreground">
                        M-PESA receipt
                    </span>
                    <span className="font-mono font-medium text-foreground">
                        {transaction.mpesa_receipt}
                    </span>
                </div>
            )}

            {transaction.status.toLowerCase() === "failed" &&
                transaction.failure_reason && (
                    <div className="rounded-lg bg-destructive/5 p-3 text-xs leading-relaxed text-destructive">
                        {transaction.failure_reason}
                    </div>
                )}

            {transaction.status.toLowerCase() === "processing" && (
                <p className="text-xs text-muted-foreground">
                    Your payment is being verified.
                </p>
            )}

            <div className="flex justify-end border-t border-border pt-3">
                <TransactionActions transaction={transaction} />
            </div>
        </article>
    );
}
