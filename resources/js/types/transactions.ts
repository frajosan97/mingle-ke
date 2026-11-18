import type { LucideIcon } from "lucide-react";

export type TransactionStatus =
    | "pending"
    | "processing"
    | "completed"
    | "failed"
    | "cancelled"
    | "unknown";

export type CoinTransaction = {
    id: number;
    type: string | null;
    status: TransactionStatus | string;
    coins: number;
    amount_kes: number;
    method: string | null;
    source: string | null;
    mpesa_receipt: string | null;
    package_id: number | null;
    phone: string | null;
    created_at: string;
    failure_reason: string | null;
};

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type PaginatedTransactions = {
    data: CoinTransaction[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
};

export type TransactionsSummary = {
    coins_balance: number;
    total_purchased: number;
    total_spent_kes: number;
};

export type TransactionsPageData = {
    transactions: PaginatedTransactions;
    summary: TransactionsSummary;
};

export type SummaryCardProps = {
    title: string;
    value: string;
    description: string;
    icon: LucideIcon;
};
