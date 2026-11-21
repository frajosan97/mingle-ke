import { type CSSProperties, type PropsWithChildren, useState } from "react";

import { Link, router, usePage, type InertiaLinkProps } from "@inertiajs/react";

import {
    Search,
    LogOut,
    UserRound,
    BriefcaseBusiness,
    ShieldCheck,
    MessageCircle,
    Wallet,
    GripVertical,
    PanelLeftClose,
    PanelLeftOpen,
    type LucideIcon,
} from "lucide-react";

import { useCurrentUrl } from "@/hooks/use-current-url";
import { useSidebarCollapse } from "@/hooks/use-sidebar-collapse";
import { useSidebarDrag } from "@/hooks/use-sidebar-drag";

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

interface PageProps {
    [key: string]: unknown;

    auth: {
        user: AuthUser | null;
    };
}

interface NavigationItemProps {
    item: SidebarNavItem;
    isActive: boolean;
    collapsed?: boolean;
}

const SIDEBAR_CONFIG = {
    storageKey: "settings-sidebar-width",
    defaultWidth: 375,
    minWidth: 260,
    maxWidth: 550,
} as const;

const COLLAPSE_STORAGE_KEY = "settings-sidebar-collapsed";

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

function NavigationItem({
    item,
    isActive,
    collapsed = false,
}: NavigationItemProps) {
    const Icon = item.icon;
    const isLogout = item.id === "logout";

    const className = cn(
        "group flex w-full items-center rounded-xl py-3 text-left transition-colors duration-200",
        collapsed
            ? "justify-start gap-4 px-4 md:justify-center md:gap-0 md:px-2"
            : "gap-4 px-4",
        isActive ? "bg-accent" : "hover:bg-accent/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    );

    const content = (
        <>
            <Icon
                aria-hidden="true"
                className={cn(
                    "h-6 w-6 shrink-0 transition-colors duration-200",
                    isActive
                        ? "text-foreground"
                        : "text-muted-foreground group-hover:text-foreground",
                )}
                strokeWidth={1.5}
            />

            <div className={cn("min-w-0 flex-1", collapsed && "md:hidden")}>
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
        </>
    );

    if (isLogout) {
        return (
            <button
                type="button"
                onClick={() => router.post("/logout")}
                title={collapsed ? item.title : undefined}
                aria-label={item.title}
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
            title={collapsed ? item.title : undefined}
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
    } = usePage<PageProps>();

    const [search, setSearch] = useState("");

    const { isCollapsed, toggleCollapse } = useSidebarCollapse({
        storageKey: COLLAPSE_STORAGE_KEY,
    });

    const {
        width: sidebarWidth,
        isDragging,
        sidebarRef,
        resizeHandleProps,
    } = useSidebarDrag({
        enabled: !isCollapsed && showSetting,
        ...SIDEBAR_CONFIG,
    });

    const isOnSubPage = component !== "settings/index";

    const user = auth?.user;

    const displayName = user?.name || "Settings";
    const avatarUrl = user?.avatar_url;
    const initial = displayName.charAt(0).toUpperCase();

    const normalizedSearch = search.trim().toLowerCase();

    const filteredMenu = SIDEBAR_NAV_ITEMS.filter((item) => {
        if (!normalizedSearch) return true;

        return (
            item.title.toLowerCase().includes(normalizedSearch) ||
            item.description.toLowerCase().includes(normalizedSearch)
        );
    });

    const sidebarStyle = {
        "--sidebar-width": `${sidebarWidth}px`,
    } as CSSProperties;

    // Collapse state only affects the desktop layout.
    const desktopCollapsed = isCollapsed;

    return (
        <>
            {showSetting && (
                <aside
                    ref={sidebarRef}
                    aria-label="Settings navigation"
                    style={sidebarStyle}
                    className={cn(
                        "relative flex w-full shrink-0 flex-col border-r border-border bg-card",
                        "md:w-[var(--sidebar-width)]",
                        !isDragging &&
                            "transition-[width] duration-300 ease-in-out",
                        isDragging && "select-none",

                        // Desktop-only collapsed width.
                        desktopCollapsed && "md:!w-[76px]",

                        // Preserve mobile navigation.
                        isOnSubPage && "hidden md:flex",
                    )}
                >
                    {/* Sidebar Header */}
                    <header
                        className={cn(
                            "flex h-[60px] shrink-0 items-center justify-between border-b border-border/50 px-5",
                            desktopCollapsed && "md:justify-center md:px-2",
                        )}
                    >
                        {/* User name / Settings title */}
                        <h1
                            className={cn(
                                "truncate text-lg font-semibold text-foreground",
                                desktopCollapsed && "md:hidden",
                            )}
                        >
                            {displayName}
                        </h1>

                        {/* Desktop-only collapse button */}
                        <button
                            type="button"
                            onClick={toggleCollapse}
                            title={
                                isCollapsed
                                    ? "Expand sidebar"
                                    : "Collapse sidebar"
                            }
                            aria-label={
                                isCollapsed
                                    ? "Expand sidebar"
                                    : "Collapse sidebar"
                            }
                            aria-expanded={!isCollapsed}
                            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:flex"
                        >
                            {isCollapsed ? (
                                <PanelLeftOpen
                                    aria-hidden="true"
                                    className="h-5 w-5"
                                />
                            ) : (
                                <PanelLeftClose
                                    aria-hidden="true"
                                    className="h-5 w-5"
                                />
                            )}
                        </button>
                    </header>

                    {/* Sidebar Search */}
                    <div
                        className={cn(
                            "px-3 py-3",
                            desktopCollapsed && "md:hidden",
                        )}
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
                                className="w-full min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                            />
                        </label>
                    </div>

                    {/* Sidebar Content */}
                    <div
                        className={cn(
                            "min-h-0 flex-1 overflow-y-auto scrollbar-thin pb-4",
                            desktopCollapsed ? "px-3 md:px-2" : "px-3",
                        )}
                    >
                        {/* User Avatar */}
                        <div
                            className={cn(
                                "mx-auto mb-8 mt-4 flex w-32 items-center justify-center",
                                desktopCollapsed && "md:hidden",
                            )}
                        >
                            <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-primary shadow-xl ring-1 ring-border/50 transition-transform duration-300 hover:scale-105">
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
                            {filteredMenu.length > 0
                                ? filteredMenu.map((item) => (
                                      <NavigationItem
                                          key={item.id}
                                          item={item}
                                          isActive={
                                              item.id !== "logout" &&
                                              isCurrentOrParentUrl(item.href)
                                          }
                                          collapsed={desktopCollapsed}
                                      />
                                  ))
                                : !desktopCollapsed && (
                                      <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                                          No settings found for &ldquo;
                                          {search}&rdquo;
                                      </p>
                                  )}
                        </nav>
                    </div>

                    {/* Desktop-only Resize Handle */}
                    {!isCollapsed && (
                        <div
                            {...resizeHandleProps}
                            role="separator"
                            aria-label="Resize settings sidebar. Double-click to reset."
                            aria-orientation="vertical"
                            aria-valuemin={SIDEBAR_CONFIG.minWidth}
                            aria-valuemax={SIDEBAR_CONFIG.maxWidth}
                            aria-valuenow={sidebarWidth}
                            aria-valuetext={`${sidebarWidth} pixels`}
                            title="Drag to resize · Double-click to reset"
                            className={cn(
                                "group absolute -right-2 top-0 z-40 hidden h-full w-4 cursor-col-resize touch-none items-center justify-center outline-none md:flex",
                                "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
                                isDragging && "z-50",
                            )}
                        >
                            {/* Divider */}
                            <div
                                aria-hidden="true"
                                className={cn(
                                    "absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 rounded-full transition-colors",
                                    isDragging
                                        ? "bg-primary shadow-[0_0_14px_3px] shadow-primary/40"
                                        : "bg-transparent group-hover:bg-primary/60",
                                )}
                            />

                            {/* Grip */}
                            <div
                                aria-hidden="true"
                                className={cn(
                                    "relative flex h-12 w-5 items-center justify-center rounded-full border border-border/80 bg-background text-muted-foreground shadow-md transition-all",
                                    "scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100",
                                    isDragging &&
                                        "scale-110 border-primary bg-primary text-primary-foreground opacity-100 shadow-lg shadow-primary/30",
                                )}
                            >
                                <GripVertical className="h-3.5 w-3.5" />
                            </div>

                            {/* Width Indicator */}
                            <div
                                aria-hidden="true"
                                className={cn(
                                    "pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-8 rounded-md border border-border bg-popover px-2 py-1 text-[10px] font-semibold tabular-nums text-popover-foreground shadow-lg transition-opacity",
                                    isDragging ? "opacity-100" : "opacity-0",
                                )}
                            >
                                {sidebarWidth}px
                            </div>
                        </div>
                    )}
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
