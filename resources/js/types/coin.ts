
import type { CoinPackage } from "@/types/wallet";

export type { CoinPackage } from "@/types/wallet";

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
export const BASE_RATE = 1.0;
export const MINIMUM_COINS = 20;

export function bonusForCoins(coins: number): number {
    if (coins >= 1000) return 0.28;
    if (coins >= 600) return 0.20;
    if (coins >= 380) return 0.15;
    if (coins >= 280) return 0.12;
    if (coins >= 180) return 0.09;
    if (coins >= 110) return 0.10;
    return 0;
}

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
