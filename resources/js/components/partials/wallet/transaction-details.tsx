import type { CoinTransaction } from "@/types/transactions";
import { formatCurrency, formatNumber } from "@/lib/wallet/formatters";
import { getMethodLabel } from "@/lib/wallet/transaction-utils";

export default function TransactionDetails({
    transaction,
    compact = false,
}: {
    transaction: CoinTransaction;
    compact?: boolean;
}) {
    return (
        <div className="flex min-w-0 flex-col gap-1">
            <p className="font-semibold text-foreground">
                +{formatNumber(transaction.coins)} coins
            </p>
            <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                <span>{formatCurrency(transaction.amount_kes)}</span>
                <span>·</span>
                <span>{getMethodLabel(transaction.method)}</span>
            </div>
            {!compact && transaction.mpesa_receipt && (
                <p className="truncate text-xs text-muted-foreground">
                    Receipt:{" "}
                    <span className="font-mono text-foreground">
                        {transaction.mpesa_receipt}
                    </span>
                </p>
            )}
            {transaction.status.toLowerCase() === "failed" &&
                transaction.failure_reason && (
                    <p
                        className={`mt-1 text-xs text-destructive ${
                            compact
                                ? "rounded-lg bg-destructive/5 p-3 leading-relaxed"
                                : "max-w-sm"
                        }`}
                    >
                        {transaction.failure_reason}
                    </p>
                )}
        </div>
    );
}
