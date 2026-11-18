import {
    CheckCircle2,
    Clock3,
    LoaderCircle,
    XCircle,
} from "lucide-react";
import type { CoinTransaction } from "@/types/transactions";

export const getTransactionStatus = (status: string) => {
    switch ((status || "unknown").toLowerCase()) {
        case "completed":
            return {
                label: "Completed",
                className:
                    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                icon: CheckCircle2,
            };
        case "failed":
            return {
                label: "Failed",
                className: "bg-destructive/10 text-destructive",
                icon: XCircle,
            };
        case "processing":
            return {
                label: "Processing",
                className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                icon: LoaderCircle,
            };
        case "pending":
            return {
                label: "Pending",
                className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                icon: Clock3,
            };
        case "cancelled":
            return {
                label: "Cancelled",
                className: "bg-muted text-muted-foreground",
                icon: XCircle,
            };
        case "unknown":
            return {
                label: "Verification required",
                className: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                icon: Clock3,
            };
        default:
            return {
                label: status || "Unknown",
                className: "bg-muted text-muted-foreground",
                icon: Clock3,
            };
    }
};

export const getTransactionTitle = (transaction: CoinTransaction) => {
    if (!transaction.type) return "Coin purchase";

    return transaction.type
        .replace(/[_-]/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export const getMethodLabel = (method: string | null) => {
    if (!method) return "—";
    return method.toUpperCase() === "MPESA" ? "M-PESA" : method.toUpperCase();
};

export const decodePaginationLabel = (label: string) =>
    label
        .replace(/&laquo;/g, "«")
        .replace(/&raquo;/g, "»")
        .replace(/&amp;/g, "&")
        .replace(/&#039;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/<[^>]*>/g, "")
        .trim();
