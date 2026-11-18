import { getTransactionStatus } from "@/lib/wallet/transaction-utils";

export default function TransactionStatus({ status }: { status: string }) {
    const config = getTransactionStatus(status);
    const StatusIcon = config.icon;
    const isProcessing = status.toLowerCase() === "processing";

    return (
        <span
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${config.className}`}
        >
            <StatusIcon
                className={`size-3.5 ${isProcessing ? "animate-spin" : ""}`}
            />
            {config.label}
        </span>
    );
}
