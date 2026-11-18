// resources/js/layouts/app-layout.tsx
import { type PropsWithChildren } from "react";
import { Link, usePage } from "@inertiajs/react";
import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAutoLocation } from "@/hooks/use-auto-location";
import { OnlineStatusProvider } from "@/hooks/use-app-online-status";
import { CoinsProvider } from "@/contexts/coins-context";
import { buildNavItems, isProfileActive } from "@/lib/nav-items";
import TopUpModal from "@/components/modals/top-up-dialog";
import AppMobileBottomMenu from "@/components/app-mobile-bottom-menu";

interface AuthUser {
    id: number;
    name: string;
    avatar_url?: string | null;
    coins?: number;
}

export default function AppLayout({ children }: PropsWithChildren) {
    useAutoLocation();

    const { props, url } = usePage();
    const { auth } = props as {
        auth: { user: AuthUser | null };
    };

    const navItems = buildNavItems(url);
    const profileActive = isProfileActive(url);

    const avatarUrl = auth.user?.avatar_url ?? null;
    const initial = auth.user?.name?.charAt(0).toUpperCase() ?? "?";
    const userCoins = auth.user?.coins ?? 0;

    return (
        <CoinsProvider>
            <OnlineStatusProvider>
                <div
                    className={cn(
                        "flex h-screen w-full overflow-hidden bg-background",
                        "pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0",
                    )}
                >
                    {/* ── Column 1: Left Nav Rail ─────────────────── */}
                    <aside className="hidden w-[68px] flex-col items-center border-r border-border bg-muted/40 py-4 md:flex">
                        <nav className="flex flex-1 flex-col items-center gap-3">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const showCoinBadge =
                                    item.title === "Coins" && userCoins > 0;

                                return (
                                    <Link
                                        key={item.title}
                                        href={item.href}
                                        title={item.title}
                                        className={cn(
                                            "group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300",
                                            item.isActive
                                                ? "bg-primary text-white shadow-glow-pink"
                                                : "text-muted-foreground hover:bg-accent hover:text-foreground",
                                        )}
                                    >
                                        {Icon && <Icon className="h-5 w-5" />}
                                        {showCoinBadge && (
                                            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-pink px-1 text-[9px] font-bold text-white shadow-glow-pink">
                                                {userCoins > 99
                                                    ? "99+"
                                                    : userCoins}
                                            </span>
                                        )}
                                        {item.isActive && (
                                            <span className="absolute -left-[13px] h-6 w-1 rounded-r-full bg-primary" />
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="mt-auto flex flex-col items-center pb-2">
                            <Link
                                href="/settings"
                                title="My Profile & Settings"
                                className="relative mt-2"
                            >
                                <div
                                    className={cn(
                                        "flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-semibold text-white shadow-glow-pink ring-2 ring-transparent transition-all",
                                        profileActive &&
                                            "shadow-glow-pink-strong ring-brand-pink",
                                    )}
                                >
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt={auth.user?.name ?? "Profile"}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        initial
                                    )}
                                </div>
                                <BadgeCheck className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-background text-brand-green" />
                            </Link>
                        </div>
                    </aside>

                    {/* ── Page content ────────────────────────────── */}
                    {children}

                    {/* ── Mobile Bottom Navigation ────────────────── */}
                    <AppMobileBottomMenu />

                    <TopUpModal />
                </div>
            </OnlineStatusProvider>
        </CoinsProvider>
    );
}
