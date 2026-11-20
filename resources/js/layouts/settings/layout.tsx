import { InertiaLinkProps, Link, router, usePage } from "@inertiajs/react";
import { type PropsWithChildren, useEffect, useState } from "react";
import {
    Search,
    LogOut,
    UserRound,
    BriefcaseBusiness,
    ShieldCheck,
    MessageCircle,
    Wallet,
    PanelLeftClose,
    PanelLeftOpen,
    type LucideIcon,
} from "lucide-react";

import { useCurrentUrl } from "@/hooks/use-current-url";
import { cn } from "@/lib/utils";
import { edit as editAppearance } from "@/routes/appearance";
import { edit as editProfile } from "@/routes/profile";
import { edit as editSecurity } from "@/routes/security";
import { index as indexWallet } from "@/routes/wallets";
import { manage as manageEscort } from "@/routes/escorts";

interface SidebarNavItem {
    id: string;
    title: string;
    description: string;
    href: NonNullable<InertiaLinkProps["href"]>;
    icon: LucideIcon;
}

interface Props extends PropsWithChildren {
    showSetting?: boolean;
}

interface AuthUser {
    id: number;
    name: string;
    avatar_url?: string | null;
}

const SIDEBAR_STORAGE_KEY = "settings-sidebar-collapsed";

const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
    {
        id: "profile",
        title: "Personal Profile",
        description:
            "Manage your personal information, photo and contact details",
        href: editProfile(),
        icon: UserRound,
    },
    {
        id: "escort",
        title: "Escort Profile",
        description:
            "Manage your escort profile, photos, services and availability",
        href: manageEscort(),
        icon: BriefcaseBusiness,
    },
    {
        id: "account",
        title: "Security & Privacy",
        description: "Password, two-factor authentication and passkeys",
        href: editSecurity(),
        icon: ShieldCheck,
    },
    {
        id: "chats",
        title: "Chat Preferences",
        description: "Customize chat appearance and conversation preferences",
        href: editAppearance(),
        icon: MessageCircle,
    },
    {
        id: "wallet",
        title: "My Wallet",
        description: "Coins, balances, rewards, payouts and transactions",
        href: indexWallet(),
        icon: Wallet,
    },
    {
        id: "logout",
        title: "Sign Out",
        description: "Securely sign out of your account",
        href: "/logout",
        icon: LogOut,
    },
];

interface NavigationItemProps {
    item: SidebarNavItem;
    isActive: boolean;
    isCollapsed: boolean;
}

function NavigationItem({ item, isActive, isCollapsed }: NavigationItemProps) {
    const Icon = item.icon;
    const isLogout = item.id === "logout";

    const className = cn(
        "group flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left transition-colors",
        isCollapsed && "md:justify-center md:px-2",
        isActive ? "bg-accent" : "hover:bg-accent/50",
    );

    const content = (
        <>
            <Icon
                aria-hidden="true"
                className={cn(
                    "h-6 w-6 shrink-0",
                    isActive
                        ? "text-foreground"
                        : "text-muted-foreground group-hover:text-foreground",
                )}
                strokeWidth={1.5}
            />

            <div className={cn("min-w-0 flex-1", isCollapsed && "md:hidden")}>
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

                <p className="truncate text-[13px] text-muted-foreground">
                    {item.description}
                </p>
            </div>

            {isCollapsed && <span className="sr-only">{item.title}</span>}
        </>
    );

    if (isLogout) {
        return (
            <button
                type="button"
                onClick={() => router.post("/logout")}
                title={isCollapsed ? item.title : undefined}
                className={className}
            >
                {content}
            </button>
        );
    }

    return (
        <Link
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            title={isCollapsed ? item.title : undefined}
            className={className}
        >
            {content}
        </Link>
    );
}

export default function SettingsLayout({
    children,
    showSetting = true,
}: Props) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    const {
        props: { auth },
        component,
    } = usePage<{
        auth: { user: AuthUser | null };
    }>();

    const [search, setSearch] = useState("");
    const [isCollapsed, setIsCollapsed] = useState(false);

    const isOnSubPage = component !== "settings/index";

    const user = auth?.user;
    const displayName = user?.name || "Settings";
    const avatarUrl = user?.avatar_url;
    const initial = displayName.charAt(0).toUpperCase();

    const filteredMenu = SIDEBAR_NAV_ITEMS.filter((item) => {
        const query = search.trim().toLowerCase();

        return (
            !query ||
            item.title.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query)
        );
    });

    // Restore and persist sidebar preference.
    useEffect(() => {
        try {
            setIsCollapsed(
                localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true",
            );
        } catch {
            // Storage may be unavailable.
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isCollapsed));
        } catch {
            // Storage may be unavailable.
        }
    }, [isCollapsed]);

    return (
        <>
            {showSetting && (
                <aside
                    aria-label="Settings navigation"
                    className={cn(
                        "flex w-full shrink-0 flex-col border-r border-border bg-card transition-[width] duration-300 ease-in-out",
                        isCollapsed ? "md:w-20" : "md:w-[380px] lg:w-[420px]",
                        isOnSubPage && "hidden md:flex",
                    )}
                >
                    {/* Sidebar Header */}
                    <header
                        className={cn(
                            "flex h-[60px] shrink-0 items-center justify-between border-b border-border/50 px-5",
                            isCollapsed && "md:justify-center md:px-2",
                        )}
                    >
                        <h1
                            className={cn(
                                "truncate text-lg font-semibold text-foreground",
                                isCollapsed && "md:hidden",
                            )}
                        >
                            {displayName}
                        </h1>

                        <button
                            type="button"
                            onClick={() =>
                                setIsCollapsed((previous) => !previous)
                            }
                            aria-label={
                                isCollapsed
                                    ? "Expand sidebar"
                                    : "Collapse sidebar"
                            }
                            aria-expanded={!isCollapsed}
                            title={
                                isCollapsed
                                    ? "Expand sidebar"
                                    : "Collapse sidebar"
                            }
                            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:flex"
                        >
                            {isCollapsed ? (
                                <PanelLeftOpen className="h-5 w-5" />
                            ) : (
                                <PanelLeftClose className="h-5 w-5" />
                            )}
                        </button>
                    </header>

                    {/* Sidebar Search */}
                    <div
                        className={cn("px-3 py-3", isCollapsed && "md:hidden")}
                    >
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
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search settings..."
                                autoComplete="off"
                                spellCheck={false}
                                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                            />
                        </label>
                    </div>

                    {/* Sidebar Content */}
                    <div className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-4">
                        {/* User Avatar */}
                        <div
                            className={cn(
                                "mx-auto mb-8 mt-4 flex w-32 items-center justify-center",
                                isCollapsed && "md:hidden",
                            )}
                        >
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
                            aria-label="Settings"
                            className="flex flex-col gap-1.5"
                        >
                            {filteredMenu.length > 0 ? (
                                filteredMenu.map((item) => (
                                    <NavigationItem
                                        key={item.id}
                                        item={item}
                                        isCollapsed={isCollapsed}
                                        isActive={
                                            item.id !== "logout" &&
                                            isCurrentOrParentUrl(item.href)
                                        }
                                    />
                                ))
                            ) : (
                                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                                    No settings found for &ldquo;{search}&rdquo;
                                </p>
                            )}
                        </nav>
                    </div>
                </aside>
            )}

            {/* Main Content */}
            <main
                className={cn(
                    "relative min-w-0 flex-1 flex-col overflow-y-auto scrollbar-thin",
                    isOnSubPage || !showSetting ? "flex" : "hidden md:flex",
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

                {/* Page Content */}
                <div className="relative z-10 flex min-h-full w-full flex-col p-4 sm:p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </>
    );
}
