// resources/js/layouts/conversations-layout.tsx

import { type PropsWithChildren, useEffect, useMemo, useState } from "react";
import { usePage } from "@inertiajs/react";
import { PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import ConversationList from "@/components/conversation/conversation-list";

interface Props extends PropsWithChildren {
    showInbox?: boolean;
}

const CONVERSATION_URL_RE = /^\/conversations\/(\d+)/;
const SIDEBAR_STORAGE_KEY = "conversations-sidebar-collapsed";

export default function ConversationsLayout({
    children,
    showInbox = true,
}: Props) {
    const { url } = usePage();
    const [search, setSearch] = useState("");
    const [isCollapsed, setIsCollapsed] = useState(false);

    const { isConversationOpen, activeId } = useMemo(() => {
        const match = url.match(CONVERSATION_URL_RE);

        return {
            isConversationOpen: Boolean(match),
            activeId: match?.[1],
        };
    }, [url]);

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
            {/* Inbox Sidebar */}
            {showInbox && (
                <aside
                    aria-label="Conversations"
                    className={cn(
                        "flex w-full shrink-0 flex-col border-r border-border bg-card transition-[width] duration-300 ease-in-out",
                        isCollapsed ? "md:w-20" : "md:w-[380px] lg:w-[420px]",
                        isConversationOpen && "hidden md:flex",
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
                            Chats
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
                            htmlFor="conversation-search"
                            className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/60 px-3 py-2 transition-colors focus-within:border-brand-pink/40 focus-within:ring-2 focus-within:ring-brand-pink/20"
                        >
                            <Search
                                aria-hidden="true"
                                className="h-4 w-4 shrink-0 text-muted-foreground"
                            />

                            <input
                                id="conversation-search"
                                type="search"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search messages..."
                                autoComplete="off"
                                spellCheck={false}
                                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                            />
                        </label>
                    </div>

                    {/* Sidebar Content */}
                    <div className="flex-1 overflow-y-auto scrollbar-thin">
                        <ConversationList
                            activeId={activeId}
                            query={search}
                            isCollapsed={isCollapsed}
                        />
                    </div>
                </aside>
            )}

            {/* Main Content */}
            <main
                className={cn(
                    "relative min-w-0 flex-1 flex-col overflow-y-auto scrollbar-thin",
                    isConversationOpen
                        ? "flex"
                        : showInbox
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

                {/* Page Content */}
                <div className="relative z-10 flex h-full w-full flex-col">
                    {children}
                </div>
            </main>
        </>
    );
}
