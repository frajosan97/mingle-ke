// resources/js/components/conversation/bubble/bubble-menu.tsx
import { ChevronDown, Copy, Forward, Reply, Star, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    menuOpen: boolean;
    setMenuOpen: (value: boolean) => void;
    menuRef: React.RefObject<HTMLDivElement | null>;
    mine?: boolean;
    onlyMedia: boolean;
    onReply: () => void;
    onCopy?: () => void;
    onForward: () => void;
    onStar: () => void;
    onDelete: () => void;
}

export default function BubbleMenu({
    menuOpen,
    setMenuOpen,
    menuRef,
    mine,
    onlyMedia,
    onReply,
    onCopy,
    onForward,
    onStar,
    onDelete,
}: Props) {
    return (
        <div ref={menuRef} className="absolute right-1 top-1 z-20">
            <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full transition-opacity duration-200",
                    "opacity-0 group-hover/bubble:opacity-100 focus-visible:opacity-100",
                    mine
                        ? "text-white/80 hover:bg-black/20"
                        : "text-muted-foreground hover:bg-muted",
                    menuOpen && "opacity-100",
                    onlyMedia && "bg-black/40 text-white hover:bg-black/60",
                )}
                aria-label="Message options"
                aria-expanded={menuOpen}
            >
                <ChevronDown className="h-4 w-4" />
            </button>

            {menuOpen && (
                <div
                    className={cn(
                        "absolute top-7 z-50 w-48 overflow-hidden rounded-xl border border-border bg-popover py-1 shadow-lg",
                        mine ? "right-0" : "left-0",
                    )}
                    role="menu"
                >
                    <MenuItem
                        icon={<Reply className="h-4 w-4" />}
                        label="Reply"
                        onClick={onReply}
                    />

                    {onCopy && (
                        <MenuItem
                            icon={<Copy className="h-4 w-4" />}
                            label="Copy"
                            onClick={onCopy}
                        />
                    )}

                    <MenuItem
                        icon={<Forward className="h-4 w-4" />}
                        label="Forward"
                        onClick={onForward}
                    />

                    <MenuItem
                        icon={<Star className="h-4 w-4" />}
                        label="Star message"
                        onClick={onStar}
                    />

                    <MenuItem
                        icon={<Trash2 className="h-4 w-4" />}
                        label="Delete"
                        onClick={onDelete}
                        danger
                    />
                </div>
            )}
        </div>
    );
}

function MenuItem({
    icon,
    label,
    onClick,
    danger,
}: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    danger?: boolean;
}) {
    return (
        <button
            type="button"
            role="menuitem"
            onClick={onClick}
            className={cn(
                "flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-popover-foreground transition-colors hover:bg-accent",
                danger && "text-destructive hover:bg-destructive/10",
            )}
        >
            <span
                className={cn(
                    danger ? "text-destructive" : "text-muted-foreground",
                )}
            >
                {icon}
            </span>
            {label}
        </button>
    );
}
