import { LoaderCircle, RefreshCw, XCircle } from "lucide-react";

import { useTransactionActions } from "@/hooks/use-transaction-actions";
import type { CoinTransaction } from "@/types/transactions";

export default function TransactionActions({
    transaction,
}: {
    transaction: CoinTransaction;
}) {
    const { busy, status, refresh, retry, cancel } =
        useTransactionActions(transaction);

    const buttonClass =
        "inline-flex size-9 items-center justify-center rounded-lg border border-border transition-colors disabled:pointer-events-none disabled:opacity-50";

    if (status === "pending") {
        return (
            <button
                type="button"
                onClick={cancel}
                disabled={busy !== null}
                aria-label="Cancel transaction"
                title="Cancel transaction"
                className={`${buttonClass} border-destructive/20 text-destructive hover:bg-destructive/10`}
            >
                {busy === "cancel" ? (
                    <LoaderCircle className="size-4 animate-spin" />
                ) : (
                    <XCircle className="size-4" />
                )}
            </button>
        );
    }

    if (status === "failed") {
        return (
            <button
                type="button"
                onClick={retry}
                disabled={busy !== null}
                aria-label="Retry transaction"
                title="Retry transaction"
                className={`${buttonClass} text-primary hover:bg-primary/10`}
            >
                {busy === "retry" ? (
                    <LoaderCircle className="size-4 animate-spin" />
                ) : (
                    <RefreshCw className="size-4" />
                )}
            </button>
        );
    }

    if (status === "processing") {
        return (
            <button
                type="button"
                onClick={refresh}
                disabled={busy !== null}
                aria-label="Check transaction status"
                title="Check transaction status"
                className={`${buttonClass} text-muted-foreground hover:bg-accent hover:text-foreground`}
            >
                <RefreshCw
                    className={`size-4 ${busy === "refresh" ? "animate-spin" : ""}`}
                />
            </button>
        );
    }

    return <span className="text-muted-foreground">—</span>;
}
