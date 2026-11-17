// resources/js/layouts/settings/layout.tsx
import { Link, usePage } from "@inertiajs/react";
import { type PropsWithChildren, useEffect, useState } from "react";
import {
    Search,
    User,
    Key,
    MessageSquare,
    LogOut,
    ChevronLeft,
    ShieldQuestion,
} from "lucide-react";
import { useCurrentUrl } from "@/hooks/use-current-url";
import { cn } from "@/lib/utils";
import { edit as editAppearance } from "@/routes/appearance";
import { edit } from "@/routes/profile";
import { edit as editSecurity } from "@/routes/security";

const sidebarNavItems = [
    {
        id: "profile",
        title: "Profile",
        description: "Name, phone number, gender, profile photo, age, location",
        href: edit(),
        icon: User,
    },
    {
        id: "account",
        title: "Account",
        description: "Password, 2FA, passkesy, notifications",
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

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const { props, url } = usePage();
    const { auth } = props as {
        auth: { user: AuthUser | null };
    };

    const [search, setSearch] = useState("");

    // ── Mobile view state ────────────────────────────────────────
    const isOnSubPage = sidebarNavItems.some((item) =>
        isCurrentOrParentUrl(item.href),
    );
    const [mobileView, setMobileView] = useState<"menu" | "form">(
        isOnSubPage ? "form" : "menu",
    );

    useEffect(() => {
        setMobileView(isOnSubPage ? "form" : "menu");
    }, [url, isOnSubPage]);

    const filteredMenu = sidebarNavItems.filter(
        (item) =>
            item.title.toLowerCase().includes(search.toLowerCase()) ||
            item.description.toLowerCase().includes(search.toLowerCase()),
    );

    const avatarUrl = auth?.user?.avatar_url ?? null;
    const initial = auth?.user?.name?.charAt(0).toUpperCase() || "U";

    return (
        <div className="flex h-full w-full flex-col md:flex-row">
            {/* ── Left Side: Settings Navigation ────────────────────────── */}
            <aside
                className={cn(
                    "w-full shrink-0 flex-col border-r border-border bg-card/30 md:flex md:w-[380px] lg:w-[420px]",
                    mobileView === "menu" ? "flex" : "hidden",
                )}
            >
                {/* Fixed Header & Search */}
                <div className="shrink-0 p-5 pb-2">
                    <h1 className="mb-5 text-2xl font-bold tracking-tight text-foreground">
                        {auth?.user?.name || "Settings"}
                    </h1>

                    <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/60 px-3 py-2.5 transition-all focus-within:border-brand-pink/40 focus-within:ring-2 focus-within:ring-brand-pink/20">
                        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search settings..."
                            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                        />
                    </div>
                </div>

                {/* Scrollable Menu Area */}
                <div className="flex flex-1 flex-col overflow-y-auto scrollbar-thin px-3 pb-4">
                    <div className="group relative mx-auto mb-8 mt-4 flex w-32 cursor-pointer flex-col items-center justify-center">
                        <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-primary shadow-xl ring-1 ring-border/50 transition-transform hover:scale-105">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={auth?.user?.name ?? "Avatar"}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span className="text-4xl font-bold text-white">
                                    {initial}
                                </span>
                            )}
                        </div>
                    </div>

                    <nav
                        className="flex flex-col gap-1.5"
                        aria-label="Settings"
                    >
                        {filteredMenu.map((item) => {
                            const Icon = item.icon;
                            const isActive = isCurrentOrParentUrl(item.href);

                            return (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    onClick={() => setMobileView("form")}
                                    className={cn(
                                        "group flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left transition-all",
                                        isActive
                                            ? "bg-accent"
                                            : "hover:bg-accent/50",
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "flex shrink-0 items-center justify-center p-1",
                                            isActive
                                                ? "text-foreground"
                                                : "text-muted-foreground group-hover:text-foreground",
                                        )}
                                    >
                                        <Icon
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
                                        <p className="truncate text-[13px] text-muted-foreground">
                                            {item.description}
                                        </p>
                                    </div>
                                </Link>
                            );
                        })}

                        {filteredMenu.length === 0 && (
                            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                                No settings found for "{search}"
                            </p>
                        )}
                    </nav>
                </div>
            </aside>

            {/* ── Right Side: Settings Forms ────────────────────────────── */}
            <div
                className={cn(
                    "flex-1 overflow-y-auto scrollbar-thin bg-background md:block",
                    mobileView === "form" ? "block" : "hidden",
                )}
            >
                <div className="mx-auto w-full max-w-2xl p-6 md:p-10">
                    <button
                        type="button"
                        onClick={() => setMobileView("menu")}
                        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground md:hidden"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back to settings
                    </button>

                    {children}
                </div>
            </div>
        </div>
    );
}
