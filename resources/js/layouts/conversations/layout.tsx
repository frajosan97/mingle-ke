import { type CSSProperties, type PropsWithChildren, useState } from "react";

import { usePage } from "@inertiajs/react";

import {
    GripVertical,
    PanelLeftClose,
    PanelLeftOpen,
    Search,
} from "lucide-react";

import ConversationList from "@/components/conversation/conversation-list";

import { useSidebarCollapse } from "@/hooks/use-sidebar-collapse";
import { useSidebarDrag } from "@/hooks/use-sidebar-drag";

import { cn } from "@/lib/utils";

interface Props extends PropsWithChildren {
    showInbox?: boolean;
}

interface PageProps {
    [key: string]: unknown;
}

const CONVERSATION_URL_RE = /^\/conversations\/(\d+)/;

const SIDEBAR_CONFIG = {
    storageKey: "conversations-sidebar-width",
    defaultWidth: 375,
    minWidth: 280,
    maxWidth: 600,
} as const;

const COLLAPSE_STORAGE_KEY = "conversations-sidebar-collapsed";

export default function ConversationsLayout({
    children,
    showInbox = true,
}: Props) {
    const { url, component } = usePage<PageProps>();

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
        enabled: !isCollapsed && showInbox,
        ...SIDEBAR_CONFIG,
    });

    // Only conversations/index is not a subpage.
    const isSubPage = component !== "conversations/index";

    // Identify the currently selected conversation independently
    // of the layout state, so active highlighting always works.
    const activeId = url.match(CONVERSATION_URL_RE)?.[1];

    const sidebarStyle = {
        "--sidebar-width": `${sidebarWidth}px`,
    } as CSSProperties;

    // Collapse state only affects the desktop layout.
    const desktopCollapsed = isCollapsed;

    return (
        <>
            {showInbox && (
                <aside
                    ref={sidebarRef}
                    aria-label="Conversations navigation"
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
                        isSubPage && "hidden md:flex",
                    )}
                >
                    {/* Sidebar Header */}
                    <header
                        className={cn(
                            "flex h-[60px] shrink-0 items-center justify-between border-b border-border/50 px-5",
                            desktopCollapsed && "md:justify-center md:px-2",
                        )}
                    >
                        {/* Header title */}
                        <h1
                            className={cn(
                                "truncate text-lg font-semibold text-foreground",
                                desktopCollapsed && "md:hidden",
                            )}
                        >
                            Chats
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
                                className="w-full min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                            />
                        </label>
                    </div>

                    {/* Sidebar Content */}
                    <div
                        className={cn(
                            "min-h-0 flex-1 overflow-y-auto scrollbar-thin",
                            desktopCollapsed ? "px-3 md:px-2" : "px-3",
                        )}
                    >
                        <ConversationList
                            activeId={activeId}
                            query={search}
                            isCollapsed={desktopCollapsed}
                        />
                    </div>

                    {/* Desktop-only Resize Handle */}
                    {!isCollapsed && (
                        <div
                            {...resizeHandleProps}
                            role="separator"
                            aria-label="Resize conversations sidebar. Double-click to reset."
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
                    isSubPage || !showInbox ? "flex" : "hidden md:flex",
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
                <div className="relative z-10 flex h-full min-h-0 w-full flex-col">
                    {children}
                </div>
            </main>
        </>
    );
}
