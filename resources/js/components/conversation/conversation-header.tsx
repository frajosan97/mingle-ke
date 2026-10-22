// resources/js/components/conversation/conversation-header.tsx
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
}

export default function ConversationHeader({
    name,
    avatarUrl,
    online = false,
    typingUser = null,
    verified = false,
}: Props) {
    const status = typingUser
        ? `${typingUser} is typing…`
        : online
          ? "online"
          : "last seen recently";

    return (
        <header className="flex h-[60px] shrink-0 items-center justify-between px-4">
            <div className="flex items-center gap-3">
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
                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-brand-green" />
                    )}
                </div>

                <div className="min-w-0">
                    <h2 className="flex items-center gap-1 text-sm font-semibold text-foreground">
                        <span className="truncate">{name}</span>
                        {verified && (
                            <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-brand-pink" />
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

            <div className="flex items-center gap-1 text-muted-foreground">
                {[
                    { title: "Video call", Icon: Video },
                    { title: "Voice call", Icon: Phone },
                    { title: "Menu", Icon: MoreVertical },
                ].map(({ title, Icon }) => (
                    <button
                        key={title}
                        type="button"
                        title={title}
                        className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-accent hover:text-foreground"
                    >
                        <Icon className="h-5 w-5" />
                    </button>
                ))}
            </div>
        </header>
    );
}
