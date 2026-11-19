
import { router } from "@inertiajs/react";
import { useState } from "react";
import { toast } from "sonner";

import type { CoinTransaction } from "@/types/wallet";

type BusyAction = "retry" | "cancel" | "refresh" | null;

export function useTransactionActions(transaction: CoinTransaction) {
    const [busy, setBusy] = useState<BusyAction>(null);

    const status = transaction.status.toLowerCase();

    const handleRequest = (
        action: Exclude<BusyAction, "refresh" | null>,
        url: string,
        successMessage: string,
        errorMessage: string,
    ) => {
        if (busy !== null) return;

        setBusy(action);

        router.post(
            url,
            {},
            {
                preserveScroll: true,

                onSuccess: () => {
                    toast.success(successMessage);
                },

                onError: (errors) => {
                    const firstError = Object.values(errors)[0];

                    toast.error(
                        typeof firstError === "string"
                            ? firstError
                            : errorMessage,
                    );
                },

                onFinish: () => {
                    setBusy(null);
                },
            },
        );
    };

    const refresh = () => {
        if (busy !== null) return;

        setBusy("refresh");

        router.reload({
            only: ["transactions", "summary"],
            preserveUrl: true,
            onFinish: () => setBusy(null),
        });
    };

    // Retry immediately. Confirmation is handled by the Dialog in the page.
    const retry = () => {
        handleRequest(
            "retry",
            `/wallets/transactions/${transaction.id}/retry`,
            "Retry request submitted.",
            "Unable to retry this transaction.",
        );
    };

    const cancel = () => {
        if (busy !== null) return;

        const confirmed = window.confirm(
            "Are you sure you want to cancel this pending transaction? Only cancel if payment has not already been made.",
        );

        if (!confirmed) return;

        handleRequest(
            "cancel",
            `/wallets/transactions/${transaction.id}/cancel`,
            "Cancellation request submitted.",
            "Unable to cancel this transaction.",
        );
    };

    return {
        busy,
        status,
        refresh,
        retry,
        cancel,
    };
}
