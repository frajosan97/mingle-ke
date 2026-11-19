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

export type SubscriptionPageProps = {
    plans: PricingPlan[];
    subscription: Subscription;
    phone: string;
};

export type SubscriptionFlash = {
    toast?: SubscriptionToast;
};

export type CustomMode = "days" | "amount";