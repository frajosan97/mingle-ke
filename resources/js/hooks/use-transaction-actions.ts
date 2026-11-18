import { router } from "@inertiajs/react";
import { useState } from "react";
import { toast } from "sonner";

import type { CoinTransaction } from "@/types/transactions";
import { formatCurrency, formatNumber } from "@/lib/wallet/formatters";

type BusyAction = "retry" | "cancel" | "refresh" | null;

export function useTransactionActions(transaction: CoinTransaction) {
    const [busy, setBusy] = useState<BusyAction>(null);
    const status = transaction.status.toLowerCase();

    const refresh = () => {
        if (busy) return;
        setBusy("refresh");

        router.reload({
            only: ["transactions", "summary"],
            preserveUrl: true,
            onFinish: () => setBusy(null),
        });
    };

    const retry = () => {
        if (busy) return;

        const confirmed = window.confirm(
            `Retry the purchase of ${formatNumber(transaction.coins)} coins for ${formatCurrency(transaction.amount_kes)}?`,
        );
        if (!confirmed) return;

        setBusy("retry");
        router.post(
            `/wallets/transactions/${transaction.id}/retry`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success("Retry request submitted."),
                onError: (errors) =>
                    toast.error(
                        Object.values(errors)[0] ??
                            "Unable to retry this transaction.",
                    ),
                onFinish: () => setBusy(null),
            },
        );
    };

    const cancel = () => {
        if (busy) return;

        const confirmed = window.confirm(
            "Are you sure you want to cancel this pending transaction? Only cancel if payment has not already been made.",
        );
        if (!confirmed) return;

        setBusy("cancel");
        router.post(
            `/wallets/transactions/${transaction.id}/cancel`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success("Cancellation request submitted."),
                onError: (errors) =>
                    toast.error(
                        Object.values(errors)[0] ??
                            "Unable to cancel this transaction.",
                    ),
                onFinish: () => setBusy(null),
            },
        );
    };

    return { busy, status, refresh, retry, cancel };
}
