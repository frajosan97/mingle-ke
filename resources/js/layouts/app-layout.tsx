// resources/js/layouts/app-layout.tsx
import { type PropsWithChildren, useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import {
    MessageCircle,
    Compass,
    Heart,
    Star,
    Search,
    BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ConversationList from "@/components/conversation/conversation-list";

interface Props extends PropsWithChildren {
    showInbox?: boolean;
}

export default function AppLayout({ children, showInbox = false }: Props) {
    const { props, url } = usePage();
    const { auth } = props as {
        auth: { user: { id: number; name: string } | null };
    };

    const [search, setSearch] = useState("");

    const isConversationOpen = /^\/conversations\/\d+/.test(url);
    const activeId = url.match(/^\/conversations\/(\d+)/)?.[1];

    const isInboxRoute = url === "/conversations" || url === "/";

    // Show inbox on:
    //  - /conversations (list view)
    //  - / (root)
    //  - Any /conversations/:id (so desktop users see sidebar while chatting)
    //  - Explicit showInbox prop from a page
    const shouldShowInbox = showInbox || isInboxRoute || isConversationOpen;

    const navItems = [
        {
            label: "Messages",
            href: "/conversations",
            icon: MessageCircle,
            active: url.startsWith("/conversations"),
        },
        {
            label: "Discover",
            href: "/discover",
            icon: Compass,
            active: url.startsWith("/discover"),
        },
        {
            label: "Matches",
            href: "/matches",
            icon: Heart,
            active: url.startsWith("/matches"),
        },
        {
            label: "Favorites",
            href: "/favorites",
            icon: Star,
            active: url.startsWith("/favorites"),
        },
    ];

    const isProfileActive =
        url.startsWith("/profile") || url.startsWith("/settings");

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            {/* ── Column 1: Left Nav Rail ─────────────────────────── */}
            <aside className="hidden w-[68px] flex-col items-center border-r border-border bg-muted/40 py-4 md:flex">
                <nav className="flex flex-1 flex-col items-center gap-3">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                title={item.label}
                                className={cn(
                                    "group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300",
                                    item.active
                                        ? "bg-gradient-brand text-white shadow-glow-pink"
                                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                {item.active && (
                                    <span className="absolute -left-[13px] h-6 w-1 rounded-r-full bg-gradient-brand" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto flex flex-col items-center pb-2">
                    <Link
                        href="/settings/profile"
                        title="My Profile & Settings"
                        className="relative mt-2"
                    >
                        <div
                            className={cn(
                                "flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-brand text-sm font-semibold text-white shadow-glow-pink ring-2 ring-transparent transition-all",
                                isProfileActive &&
                                    "shadow-glow-pink-strong ring-brand-pink",
                            )}
                        >
                            {auth.user?.name?.charAt(0).toUpperCase() ?? "?"}
                        </div>
                        <BadgeCheck className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-background text-brand-green" />
                    </Link>
                </div>
            </aside>

            {/* ── Column 2: Optional Inbox Sidebar ─────────────────── */}
            {shouldShowInbox && (
                <aside
                    className={cn(
                        "flex w-full flex-col border-r border-border bg-card md:w-[380px] lg:w-[420px]",
                        // On mobile, hide the inbox when a chat is open (chat takes full width).
                        // On desktop (md+), always keep the inbox visible.
                        isConversationOpen && "hidden md:flex",
                    )}
                >
                    <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-border px-4">
                        <h1 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                            Messages
                            <span className="rounded-full bg-gradient-brand-soft px-2 py-0.5 text-xs font-medium text-brand-pink">
                                Inbox
                            </span>
                        </h1>
                    </header>

                    <div className="px-3 py-3">
                        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/60 px-3 py-2 transition-colors focus-within:border-brand-pink/40 focus-within:ring-2 focus-within:ring-brand-pink/20">
                            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search messages"
                                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto scrollbar-thin">
                        <ConversationList activeId={activeId} query={search} />
                    </div>
                </aside>
            )}

            {/* ── Column 3: Main Content ───────────────────────────── */}
            <main
                className={cn(
                    "relative min-w-0 flex-1 flex-col overflow-y-auto scrollbar-thin",
                    // On mobile, only show main content if a chat is open OR
                    // we're not on a route that also renders an inbox.
                    isConversationOpen
                        ? "flex"
                        : shouldShowInbox
                          ? "hidden md:flex"
                          : "flex",
                )}
            >
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="orb orb-pink absolute -left-24 top-1/4 h-80 w-80 opacity-10" />
                    <div className="orb orb-orange absolute -right-24 bottom-1/4 h-72 w-72 opacity-10" />
                </div>

                <div className="relative z-10 flex h-full w-full flex-col">
                    {children}
                </div>
            </main>

            {/* ── Mobile Bottom Navigation ─────────────────────────── */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border bg-card/90 px-2 backdrop-blur-md md:hidden">
                {[
                    ...navItems,
                    {
                        label: "Profile",
                        href: "/settings/profile",
                        icon: BadgeCheck,
                        active: isProfileActive,
                    },
                ].map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 p-2 transition-colors",
                                item.active
                                    ? "text-brand-pink"
                                    : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            <Icon
                                className={cn(
                                    "h-5 w-5",
                                    item.active && "fill-brand-pink/20",
                                )}
                            />
                            <span className="text-[10px] font-medium">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
