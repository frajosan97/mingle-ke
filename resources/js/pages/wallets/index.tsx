import { Head, Link, usePage } from "@inertiajs/react";
import { ArrowRight, Coins, Gift, ReceiptText, Wallet } from "lucide-react";
import type { SharedProps } from "@/types/coin";
import { PageHeader } from "@/components/page-header";

export default function Wallets() {
    const { auth } = usePage<SharedProps>().props;
    const coins = auth.user?.coins ?? 0;

    const wallets = [
        {
            title: "Coins Wallet",
            description:
                "Use coins to send messages and enjoy chatting with other members.",
            balance: coins.toLocaleString(),
            unit: "Available coins",
            href: "/wallets/coins",
            action: "Manage coins",
            icon: Coins,
            iconStyle: "bg-amber-500/10 text-amber-500",
        },
        {
            title: "Points Wallet",
            description:
                "Earn points by referring friends and actively using the platform.",
            balance: "0",
            unit: "Available points",
            href: "/wallets/points",
            action: "View rewards",
            icon: Gift,
            iconStyle: "bg-violet-500/10 text-violet-500",
        },
        {
            title: "Withdrawals",
            description:
                "Redeem eligible points into cash and withdraw your available earnings.",
            balance: "KES 0.00",
            unit: "Available to withdraw",
            href: "/wallets/withdrawals",
            action: "Manage withdrawals",
            icon: Wallet,
            iconStyle: "bg-emerald-500/10 text-emerald-500",
        },
    ];

    return (
        <>
            <Head title="Wallets" />

            <div className="space-y-8 pb-8">
                <PageHeader
                    title="Wallets"
                    description="Manage your coins, points, and withdrawals."
                />
                
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {wallets.map((wallet) => {
                        const Icon = wallet.icon;

                        return (
                            <Link
                                key={wallet.title}
                                href={wallet.href}
                                className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-md"
                            >
                                <div className="flex items-center justify-between">
                                    <div
                                        className={`flex size-11 items-center justify-center rounded-xl ${wallet.iconStyle}`}
                                    >
                                        <Icon className="size-5" />
                                    </div>

                                    <span className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                                    </span>
                                </div>

                                <div className="mt-6 space-y-2">
                                    <h3 className="font-semibold text-foreground">
                                        {wallet.title}
                                    </h3>

                                    <p className="min-h-10 text-sm leading-relaxed text-muted-foreground">
                                        {wallet.description}
                                    </p>
                                </div>

                                <div className="mt-6 border-t border-border pt-4">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        {wallet.unit}
                                    </p>

                                    <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                                        {wallet.balance}
                                    </p>
                                </div>

                                <div className="mt-auto flex items-center gap-2 pt-6 text-sm font-semibold text-primary">
                                    {wallet.action}
                                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                                </div>
                            </Link>
                        );
                    })}
                </div>

                <Link
                    href="/wallets/transactions"
                    className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-sm"
                >
                    <div className="flex min-w-0 items-center gap-4">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <ReceiptText className="size-5" />
                        </div>

                        <div className="min-w-0">
                            <h3 className="font-semibold text-foreground">
                                Transaction History
                            </h3>

                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                View your coin purchases, points earned,
                                redemptions and withdrawals.
                            </p>
                        </div>
                    </div>

                    <ArrowRight className="size-5 shrink-0 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
            </div>
        </>
    );
}

Wallets.layout = {
    breadcrumbs: [{ title: "Wallet" }],
};
