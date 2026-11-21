
import type { LucideIcon } from "lucide-react";

/*
|--------------------------------------------------------------------------
| Base / Shared
|--------------------------------------------------------------------------
*/

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    avatar_url?: string | null;
    coins: number;
    tier: string;
    is_verified: boolean;
    invite_code?: string | null;
}

export interface SharedProps {
    auth: { user: AuthUser | null };
    flash?: {
        success?: string;
        error?: string;
    };
    checkout_request_id?: string | null;
    billRef?: string | null;
    paybill?: string | null;
    [key: string]: unknown;
}

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
| Coins / Packages
|--------------------------------------------------------------------------
*/

export interface CoinPackage {
    id: number;
    coins: number | "custom";
    price: number | null;
    bonus?: string;
    popular?: boolean;
}

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

export type CoinTxType =
    | "purchase"
    | "bonus"
    | "invite"
    | "spend"
    | "refund";

export type TransactionStatus =
    | "pending"
    | "processing"
    | "completed"
    | "failed"
    | "cancelled"
    | "unknown";

export type CoinTxStatus = Exclude<TransactionStatus, "unknown">;

export interface CoinTransaction {
    id: number;
    type: CoinTxType | string;
    status: TransactionStatus | string;
    coins: number;
    amount_kes: number;
    method: string | null;
    source?: string | null;
    mpesa_receipt: string | null;
    package_id: number | null;
    phone: string | null;
    created_at: string | null;
    failure_reason: string | null;
}

export type PaginatedTransactions = PaginatedData<CoinTransaction>;

export interface CoinHistorySummary {
    coins_balance: number;
    total_purchased: number;
    total_spent_kes: number;
}

export type TransactionsSummary = CoinHistorySummary;

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
| Subscriptions
|--------------------------------------------------------------------------
*/

export type PricingPlan = {
    id: number;
    key: string;
    label: string;
    days: number | null;
    unitPrice: number;
    totalPrice: number | null;
    currency: string;
    badge: string | null;
    discountPercent: number;
    savings: number | null;
    isCustom: boolean;
};

export type Subscription = {
    isActive: boolean;
    isExpired?: boolean;
    needsRenewal?: boolean;
    startedAt?: string | null;
    expiresAt?: string | null;
    plan?: string | null;
    autoRenew?: boolean;
};

export type SubscriptionToast = {
    type?: "success" | "error" | "warning" | "info";
    message?: string;
};

export type SubscriptionFlash = {
    toast?: SubscriptionToast;
};

export type SubscriptionPageProps = {
    plans: PricingPlan[];
    subscription: Subscription;
    phone: string;
    paybill: string | null;
};

export type CustomMode = "days" | "amount";

/*
|--------------------------------------------------------------------------
| Payment Methods
|--------------------------------------------------------------------------
*/

export type PaymentMethod = "stk" | "manual";

export interface ManualPaymentIntent {
    bill_ref: string;
    amount: number;
    currency: string;
    expires_at: string;
}

/*
|--------------------------------------------------------------------------
| UI Helper Types
|--------------------------------------------------------------------------
*/

export interface SummaryCardProps {
    title: string;
    value: string;
    description: string;
    icon: LucideIcon;
}
