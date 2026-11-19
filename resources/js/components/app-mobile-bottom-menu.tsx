// resources/js/components/mobile-bottom-nav.tsx
import { Link, usePage } from "@inertiajs/react";
import { cn } from "@/lib/utils";
import { buildMobileNavItems } from "@/lib/nav-items";

interface AuthUser {
    id: number;
    name: string;
    avatar_url?: string | null;
    coins?: number;
}

export default function AppMobileBottomMenu() {
    const { props, url } = usePage();
    const { auth } = props as {
        auth: { user: AuthUser | null };
    };

    const avatarUrl = auth.user?.avatar_url ?? null;
    const userCoins = auth.user?.coins ?? 0;
    const items = buildMobileNavItems(url);

    return (
        <nav
            className={cn(
                "fixed bottom-0 left-0 right-0 z-50 md:hidden",
                "flex h-[calc(4rem+env(safe-area-inset-bottom))] items-center justify-around border-t border-border bg-card/90 px-2 backdrop-blur-md",
                "pb-[env(safe-area-inset-bottom)]",
            )}
        >
            {items.map((item) => {
                const Icon = item.icon;
                const showAvatar = item.isProfile && avatarUrl;
                const showCoinBadge = item.title === "Coins" && userCoins > 0;

                return (
                    <Link
                        key={item.title}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 p-2 transition-colors",
                            item.isActive
                                ? "text-brand-pink"
                                : "text-muted-foreground hover:text-foreground",
                        )}
                    >
                        <span className="relative">
                            {showAvatar ? (
                                <span
                                    className={cn(
                                        "flex h-6 w-6 items-center justify-center overflow-hidden rounded-full ring-2 ring-transparent transition-all",
                                        item.isActive && "ring-brand-pink",
                                    )}
                                >
                                    <img
                                        src={avatarUrl!}
                                        alt={auth.user?.name ?? "Profile"}
                                        className="h-full w-full object-cover"
                                    />
                                </span>
                            ) : Icon ? (
                                <Icon
                                    className={cn(
                                        "h-5 w-5",
                                        item.isActive && "fill-brand-pink/20",
                                    )}
                                />
                            ) : null}
                            {showCoinBadge && (
                                <span className="absolute -right-2 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-brand-pink px-1 text-[8px] font-bold text-white">
                                    {userCoins > 99 ? "99+" : userCoins}
                                </span>
                            )}
                        </span>
                        <span className="text-[10px] font-medium">
                            {item.title}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
