// resources/js/types/coin.ts

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
    flash?: { success?: string; error?: string };
    checkout_request_id?: string | null;
    billRef?: string;
    paybill?: string;
    [key: string]: unknown;
}

export interface CoinPackage {
    id: number;
    coins: number | "custom";
    price: number | null;
    bonus?: string;
    popular?: boolean;
}

// Base rate: KES 1 = 1 coin.
export const COIN_PACKAGES: CoinPackage[] = [
    { id: 1, coins: 50, price: 50 },
    { id: 2, coins: 110, price: 100, bonus: "+10%" },
    { id: 3, coins: 180, price: 165, bonus: "+9%" },
    { id: 4, coins: 280, price: 250, bonus: "+12%", popular: true },
    { id: 5, coins: 380, price: 330, bonus: "+15%" },
    { id: 6, coins: 600, price: 500, bonus: "+20%" },
    { id: 7, coins: 1050, price: 820, bonus: "+28%" },
    { id: 8, coins: "custom", price: null },
];

export const FALLBACK_INVITE_CODE = "ZT6AZEKT";
export const BASE_RATE = 1.0; // KES per coin before bonus
export const MINIMUM_COINS = 20;

// Tiered bonus for custom amounts — mirrors the pre-set packages so
// custom buyers get the same rate as bundle buyers at the same volume.
export function bonusForCoins(coins: number): number {
    if (coins >= 1000) return 0.28;
    if (coins >= 600) return 0.20;
    if (coins >= 380) return 0.15;
    if (coins >= 280) return 0.12;
    if (coins >= 180) return 0.09;
    if (coins >= 110) return 0.10;
    if (coins >= 50) return 0.0;
    return 0.0;
}

// Effective price: user pays BASE_RATE per "paid coin" and gets the
// bonus coin on top. i.e. price = coins / (1 + bonus) * BASE_RATE.
// e.g. 100 coins at 10% bonus → pays 91 KES, gets 100 coins.
export function priceForCoins(coins: number): number {
    if (coins <= 0) return 0;
    const bonus = bonusForCoins(coins);
    const paidCoins = coins / (1 + bonus);
    return Math.ceil(paidCoins * BASE_RATE);
}

export function effectiveRate(coins: number): number {
    if (coins <= 0) return 0;
    return priceForCoins(coins) / coins;
}

export function bonusLabel(coins: number): string | null {
    const bonus = bonusForCoins(coins);
    if (bonus <= 0) return null;
    return `+${Math.round(bonus * 100)}%`;
}

export type CoinTxType =
    | "purchase"
    | "bonus"
    | "invite"
    | "spend"
    | "refund";

export type CoinTxStatus =
    | "pending"
    | "processing"
    | "completed"
    | "failed"
    | "cancelled";

export interface CoinTransaction {
    id: number;
    type: CoinTxType;
    status: CoinTxStatus;
    coins: number;
    amount_kes: number;
    method: string;
    mpesa_receipt: string | null;
    package_id: number | null;
    phone: string | null;
    created_at: string | null;
    failure_reason: string | null;
}

export interface CoinHistorySummary {
    coins_balance: number;
    total_purchased: number;
    total_spent_kes: number;
}

export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
}