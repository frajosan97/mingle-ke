
import type { LucideIcon } from "lucide-react";
import type { SharedProps } from "@/types/coin";

/*
|--------------------------------------------------------------------------
| Base / Shared
|--------------------------------------------------------------------------
*/

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
}

/*
|--------------------------------------------------------------------------
| Coins / Purchases (wallet)
|--------------------------------------------------------------------------
*/

export type PurchaseStatus = "idle" | "pending" | "done" | "failed";

export interface CoinsWalletPageProps {
    phoneConfigured: boolean;
    mpesaAvailable: boolean;
    phoneSetupUrl: string;
    billRef?: string | null;
    paybill?: string | null;
    checkout_request_id?: string | null;
}

export type CoinsWalletProps = SharedProps & CoinsWalletPageProps;

/*
|--------------------------------------------------------------------------
| Coin Transactions
|--------------------------------------------------------------------------
*/

export type TransactionStatus =
    | "pending"
    | "processing"
    | "completed"
    | "failed"
    | "cancelled"
    | "unknown";

export interface CoinTransaction {
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
}

export type PaginatedTransactions = PaginatedData<CoinTransaction>;

export interface TransactionsSummary {
    coins_balance: number;
    total_purchased: number;
    total_spent_kes: number;
}

export interface TransactionsPageData {
    transactions: PaginatedTransactions;
    summary: TransactionsSummary;
}

export type TransactionsProps = SharedProps & TransactionsPageData;

/*
|--------------------------------------------------------------------------
| Withdrawals
|--------------------------------------------------------------------------
*/

export type WithdrawalStatus =
    | "pending"
    | "processing"
    | "completed"
    | "failed"
    | "rejected";

export interface Withdrawal {
    id: number;
    points: number;
    amount_kes: number;
    phone: string | null;
    status: WithdrawalStatus;
    reference: string;
    failure_reason: string | null;
    created_at: string;
}

export type WithdrawalPaginator = PaginatedData<Withdrawal>;

export interface WithdrawalsWalletPageProps {
    pointsBalance: number;
    conversionRate: number;
    minimumPoints: number;
    phone: string | null;
    phoneConfigured?: boolean;
    mpesaAvailable?: boolean;
    paybill?: string | null;
    phoneSetupUrl?: string;
    withdrawals: WithdrawalPaginator;
}

export type WithdrawalsWalletProps = SharedProps &
    WithdrawalsWalletPageProps;

/*
|--------------------------------------------------------------------------
| Points / Point Transactions
|--------------------------------------------------------------------------
*/

export type PointDirection = "credit" | "debit";

export interface PointTransaction {
    id: number;
    type: string;
    direction: PointDirection;
    points: number;
    reference: string | null;
    description: string | null;
    meta?: Record<string, unknown> | null;
    created_at: string;
}

export type PointTransactionPaginator = PaginatedData<PointTransaction>;

export interface PointsSummary {
    points_balance: number;
    total_earned: number;
    total_spent: number;
}

export interface PointsWalletPageProps {
    transactions: PointTransactionPaginator;
    summary: PointsSummary;
}

export type PointsWalletProps = SharedProps & PointsWalletPageProps;

/*
|--------------------------------------------------------------------------
| UI helper types
|--------------------------------------------------------------------------
*/

export interface SummaryCardProps {
    title: string;
    value: string;
    description: string;
    icon: LucideIcon;
}
