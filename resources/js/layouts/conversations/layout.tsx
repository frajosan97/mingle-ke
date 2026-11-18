// resources/js/layouts/conversations-layout.tsx

import { type PropsWithChildren, useMemo, useState } from "react";
import { usePage } from "@inertiajs/react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import ConversationList from "@/components/conversation/conversation-list";

interface Props extends PropsWithChildren {
    showInbox?: boolean;
}

const CONVERSATION_URL_RE = /^\/conversations\/(\d+)/;

export default function ConversationsLayout({
    children,
    showInbox = true,
}: Props) {
    const { url } = usePage();
    const [search, setSearch] = useState("");

    const { isConversationOpen, activeId } = useMemo(() => {
        const match = url.match(CONVERSATION_URL_RE);

        return {
            isConversationOpen: Boolean(match),
            activeId: match?.[1],
        };
    }, [url]);

    return (
        <>
            {/* Inbox Sidebar */}
            {showInbox && (
                <aside
                    aria-label="Conversations"
                    className={cn(
                        "flex w-full flex-col border-r border-border bg-card md:w-[380px] lg:w-[420px]",
                        isConversationOpen && "hidden md:flex",
                    )}
                >
                    {/* Header */}
                    <header className="flex h-[60px] shrink-0 items-center border-b border-border/50 px-5">
                        <h1 className="text-lg font-semibold text-foreground">
                            Chats
                        </h1>
                    </header>

                    {/* Search */}
                    <div className="px-3 py-3">
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
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search messages..."
                                autoComplete="off"
                                spellCheck={false}
                                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                            />
                        </label>
                    </div>

                    {/* Conversation List */}
                    <div className="flex-1 overflow-y-auto scrollbar-thin">
                        <ConversationList activeId={activeId} query={search} />
                    </div>
                </aside>
            )}

            {/* Main Content - Unchanged */}
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
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 overflow-hidden"
                >
                    <div className="orb orb-pink absolute -left-24 top-1/4 h-80 w-80 opacity-10" />
                    <div className="orb orb-orange absolute -right-24 bottom-1/4 h-72 w-72 opacity-10" />
                </div>

                <div className="relative z-10 flex h-full w-full flex-col">
                    {children}
                </div>
            </main>
        </>
    );
}
