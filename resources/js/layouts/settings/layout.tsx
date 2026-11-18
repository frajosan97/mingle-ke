import { Link, router, usePage } from "@inertiajs/react";
import { type PropsWithChildren, useEffect, useMemo, useState } from "react";
import {
    Search,
    User,
    Key,
    MessageSquare,
    LogOut,
    ShieldQuestion,
    ArrowLeft,
    Wallet2,
} from "lucide-react";

import { useCurrentUrl } from "@/hooks/use-current-url";
import { cn } from "@/lib/utils";
import { edit as editAppearance } from "@/routes/appearance";
import { edit as editProfile } from "@/routes/profile";
import { edit as editSecurity } from "@/routes/security";
import { index as indexWallet } from "@/routes/wallets";
import type { RouteDefinition } from "@/wayfinder";

type NavHref = RouteDefinition<"get"> | string;

interface SidebarNavItem {
    id: string;
    title: string;
    description: string;
    href: NavHref;
    icon: typeof User;
}

interface Props extends PropsWithChildren {
    showSetting?: boolean;
}

const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
    {
        id: "profile",
        title: "Profile",
        description: "Name, phone number, gender, profile photo, age, location",
        href: editProfile(),
        icon: User,
    },
    {
        id: "account",
        title: "Account",
        description: "Password, 2FA, passkeys, notifications",
        href: editSecurity(),
        icon: Key,
    },
    {
        id: "chats",
        title: "Chats",
        description: "Theme, chat history",
        href: editAppearance(),
        icon: MessageSquare,
    },
    {
        id: "wallet",
        title: "Wallet",
        description: "Coins, Balances, Points, Payouts, History",
        href: indexWallet(),
        icon: Wallet2,
    },
    {
        id: "help-and-feedback",
        title: "Help & Feedback",
        description: "Help center, contact support, privacy policy",
        href: "#",
        icon: ShieldQuestion,
    },
    {
        id: "logout",
        title: "Logout",
        description: "",
        href: "/logout",
        icon: LogOut,
    },
];

interface AuthUser {
    id: number;
    name: string;
    avatar_url?: string | null;
}

type MobileView = "menu" | "form";

export default function SettingsLayout({
    children,
    showSetting = true,
}: Props) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    const { props } = usePage<{
        auth: { user: AuthUser | null };
    }>();

    const { auth } = props;

    const [search, setSearch] = useState("");

    // Mobile view state
    const isOnSubPage = useMemo(
        () =>
            SIDEBAR_NAV_ITEMS.some(
                (item) =>
                    item.id !== "logout" &&
                    item.href !== "#" &&
                    isCurrentOrParentUrl(item.href),
            ),
        [isCurrentOrParentUrl],
    );

    const [mobileView, setMobileView] = useState<MobileView>(
        isOnSubPage ? "form" : "menu",
    );

    useEffect(() => {
        setMobileView(isOnSubPage ? "form" : "menu");
    }, [isOnSubPage]);

    // Filtered settings menu
    const filteredMenu = useMemo(() => {
        const q = search.trim().toLowerCase();

        if (!q) return SIDEBAR_NAV_ITEMS;

        return SIDEBAR_NAV_ITEMS.filter(
            (item) =>
                item.title.toLowerCase().includes(q) ||
                item.description.toLowerCase().includes(q),
        );
    }, [search]);

    const avatarUrl = auth?.user?.avatar_url ?? null;
    const initial = auth?.user?.name?.charAt(0).toUpperCase() || "U";
    const displayName = auth?.user?.name || "Settings";

    const handleLogout = () => {
        router.post("/logout");
    };

    return (
        <>
            {/* Sidebar */}
            {showSetting && (
                <aside
                    aria-label="Settings navigation"
                    className={cn(
                        "flex w-full flex-col border-r border-border bg-card md:w-[380px] lg:w-[420px]",
                        isOnSubPage && "hidden md:flex",
                    )}
                >
                    {/* Header */}
                    <header className="flex h-[60px] shrink-0 items-center border-b border-border/50 px-5">
                        <h1 className="text-lg font-semibold text-foreground">
                            {displayName}
                        </h1>
                    </header>

                    {/* Search */}
                    <div className="px-3 py-3">
                        <label
                            htmlFor="settings-search"
                            className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/60 px-3 py-2 transition-colors focus-within:border-brand-pink/40 focus-within:ring-2 focus-within:ring-brand-pink/20"
                        >
                            <Search
                                aria-hidden="true"
                                className="h-4 w-4 shrink-0 text-muted-foreground"
                            />

                            <input
                                id="settings-search"
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search settings..."
                                autoComplete="off"
                                spellCheck={false}
                                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                            />
                        </label>
                    </div>

                    {/* Sidebar Content */}
                    <div className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-4">
                        {/* Profile Avatar */}
                        <div className="group relative mx-auto mb-8 mt-4 flex w-32 cursor-pointer flex-col items-center justify-center">
                            <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-primary shadow-xl ring-1 ring-border/50 transition-transform hover:scale-105">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={displayName}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span
                                        aria-hidden="true"
                                        className="text-4xl font-bold text-white"
                                    >
                                        {initial}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav
                            className="flex flex-col gap-1.5"
                            aria-label="Settings"
                        >
                            {filteredMenu.length === 0 ? (
                                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                                    No settings found for &ldquo;{search}&rdquo;
                                </p>
                            ) : (
                                filteredMenu.map((item) => {
                                    const Icon = item.icon;

                                    const isLogout = item.id === "logout";

                                    const isActive =
                                        !isLogout &&
                                        item.href !== "#" &&
                                        isCurrentOrParentUrl(item.href);

                                    const itemClassName = cn(
                                        "group flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left transition-colors",
                                        isActive
                                            ? "bg-accent"
                                            : "hover:bg-accent/50",
                                    );

                                    const content = (
                                        <>
                                            <div
                                                className={cn(
                                                    "flex shrink-0 items-center justify-center p-1",
                                                    isActive
                                                        ? "text-foreground"
                                                        : "text-muted-foreground group-hover:text-foreground",
                                                )}
                                            >
                                                <Icon
                                                    aria-hidden="true"
                                                    className="h-6 w-6"
                                                    strokeWidth={1.5}
                                                />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p
                                                    className={cn(
                                                        "truncate text-[15px] font-semibold",
                                                        isActive
                                                            ? "text-foreground"
                                                            : "text-foreground/90 group-hover:text-foreground",
                                                    )}
                                                >
                                                    {item.title}
                                                </p>

                                                {item.description && (
                                                    <p className="truncate text-[13px] text-muted-foreground">
                                                        {item.description}
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    );

                                    // Logout must use POST, not GET.
                                    if (isLogout) {
                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={handleLogout}
                                                className={cn(
                                                    itemClassName,
                                                    "text-left",
                                                )}
                                            >
                                                {content}
                                            </button>
                                        );
                                    }

                                    return (
                                        <Link
                                            key={item.id}
                                            href={item.href}
                                            onClick={() =>
                                                setMobileView("form")
                                            }
                                            aria-current={
                                                isActive ? "page" : undefined
                                            }
                                            className={itemClassName}
                                        >
                                            {content}
                                        </Link>
                                    );
                                })
                            )}
                        </nav>
                    </div>
                </aside>
            )}

            {/* Main Content */}
            <main
                className={cn(
                    "relative min-w-0 flex-1 flex-col overflow-y-auto scrollbar-thin",
                    isOnSubPage
                        ? "flex"
                        : showSetting
                          ? "hidden md:flex"
                          : "flex",
                )}
            >
                {/* Background Effects */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 overflow-hidden"
                >
                    <div className="orb orb-pink absolute -left-24 top-1/4 h-80 w-80 opacity-10" />
                    <div className="orb orb-orange absolute -right-24 bottom-1/4 h-72 w-72 opacity-10" />
                </div>

                {/* Main Content Container */}
                <div className="relative z-10 flex min-h-full w-full flex-col p-4 sm:p-6 lg:p-8">
                    {/* back icon */}
                    {isOnSubPage && (
                        <div className="mb-4 flex items-center">
                            <Link
                                href={"/settings"}
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span>Back</span>
                            </Link>
                        </div>
                    )}

                    {/* Main Content */}
                    {children}
                </div>
            </main>
        </>
    );
}
