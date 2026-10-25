import { Link } from "@inertiajs/react";
import {
    ArrowLeft,
    Phone,
    Video,
    MoreVertical,
    BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    name: string;
    avatarUrl?: string | null;
    online?: boolean;
    typingUser?: string | null;
    verified?: boolean;
    lastSeen?: string | null;
}

function formatLastSeen(lastSeen?: string | null): string | null {
    if (!lastSeen) return null;

    const date = new Date(lastSeen);

    if (Number.isNaN(date.getTime())) {
        return lastSeen;
    }

    const diffMs = Math.max(0, Date.now() - date.getTime());
    const diffMin = Math.floor(diffMs / 60_000);

    if (diffMin < 1) return "last seen just now";
    if (diffMin < 60) return `last seen ${diffMin}m ago`;

    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `last seen ${diffHr}h ago`;

    const diffDay = Math.floor(diffHr / 24);
    if (diffDay === 1) return "last seen yesterday";
    if (diffDay < 7) return `last seen ${diffDay}d ago`;

    return `last seen ${date.toLocaleDateString()}`;
}

export default function ConversationHeader({
    name,
    avatarUrl,
    online = false,
    typingUser = null,
    verified = false,
    lastSeen = null,
}: Props) {
    const status = typingUser
        ? `${typingUser} is typing…`
        : online
          ? "online"
          : (formatLastSeen(lastSeen) ?? "offline");

    return (
        <header className="flex h-[60px] shrink-0 items-center justify-between px-4">
            <div className="flex min-w-0 items-center gap-3">
                <Link
                    href="/conversations"
                    className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
                    title="Back"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>

                <div className="relative shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-brand text-sm font-semibold text-white shadow-glow-pink/40">
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt={name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            name.charAt(0).toUpperCase()
                        )}
                    </div>

                    {online && !typingUser && (
                        <span
                            aria-label="Online"
                            title="Online"
                            className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-brand-green"
                        />
                    )}
                </div>

                <div className="min-w-0">
                    <h2 className="flex items-center gap-1 text-sm font-semibold text-foreground">
                        <span className="truncate">{name}</span>

                        {verified && (
                            <BadgeCheck
                                aria-label="Verified"
                                className="h-3.5 w-3.5 shrink-0 text-brand-pink"
                            />
                        )}
                    </h2>

                    <p
                        className={cn(
                            "truncate text-xs",
                            typingUser
                                ? "text-brand-pink"
                                : online
                                  ? "text-brand-green"
                                  : "text-muted-foreground",
                        )}
                    >
                        {status}
                    </p>
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-1 text-muted-foreground">
                {[
                    { title: "Video call", Icon: Video },
                    { title: "Voice call", Icon: Phone },
                    { title: "Menu", Icon: MoreVertical },
                ].map(({ title, Icon }) => (
                    <button
                        key={title}
                        type="button"
                        title={title}
                        aria-label={title}
                        className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-accent hover:text-foreground"
                    >
                        <Icon className="h-5 w-5" />
                    </button>
                ))}
            </div>
        </header>
    );
}
