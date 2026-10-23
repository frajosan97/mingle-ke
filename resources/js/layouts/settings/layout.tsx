// resources/js/layouts/settings/layout.tsx
import { Link, usePage } from "@inertiajs/react";
import { type PropsWithChildren, useState } from "react";
import { Search, User, Key, MessageSquare, LogOut } from "lucide-react";
import { useCurrentUrl } from "@/hooks/use-current-url";
import { cn } from "@/lib/utils";
import { edit as editAppearance } from "@/routes/appearance";
import { edit } from "@/routes/profile";
import { edit as editSecurity } from "@/routes/security";

const sidebarNavItems = [
    {
        id: "profile",
        title: "Profile",
        description: "Name, profile picture, username",
        href: edit(),
        icon: User,
    },
    {
        id: "account",
        title: "Account",
        description: "Security notifications, account info",
        href: editSecurity(),
        icon: Key,
    },
    {
        id: "chats",
        title: "Chats",
        description: "Theme, wallpapers, chat history",
        href: editAppearance(),
        icon: MessageSquare,
    },
];

interface AuthUser {
    id: number;
    name: string;
    avatar_url?: string | null;
}

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const { props } = usePage();
    const { auth } = props as {
        auth: { user: AuthUser | null };
    };

    const [search, setSearch] = useState("");

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
            <aside className="flex w-full shrink-0 flex-col border-r border-border bg-card/30 md:w-[380px] lg:w-[420px]">
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
                    {/* Profile Avatar */}
                    <div className="group relative mx-auto mb-8 mt-4 flex w-32 cursor-pointer flex-col items-center justify-center">
                        <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-gradient-brand shadow-xl ring-1 ring-border/50 transition-transform hover:scale-105">
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

                    {/* Navigation Items */}
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

                {/* Fixed Bottom: Logout */}
                <div className="shrink-0 border-t border-border/50 p-3">
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
                    >
                        <LogOut className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                        Log out
                    </Link>
                </div>
            </aside>

            {/* ── Right Side: Settings Forms ────────────────────────────── */}
            <div className="flex flex-1 overflow-y-auto scrollbar-thin bg-background">
                <div className="mx-auto w-full max-w-2xl p-6 md:p-10">
                    {children}
                </div>
            </div>
        </div>
    );
}
