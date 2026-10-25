// resources/js/components/conversation/message-bubble/reply-quote.tsx
import { cn } from "@/lib/utils";

interface Props {
    author: string;
    preview: string;
    mine?: boolean;
}

export default function ReplyQuote({ author, preview, mine }: Props) {
    return (
        <div
            className={cn(
                "mb-1.5 rounded-r-md rounded-l-sm border-l-2 px-2 py-1 text-xs",
                mine
                    ? "border-white/60 bg-black/15"
                    : "border-brand-pink bg-brand-pink/10",
            )}
        >
            <p
                className={cn(
                    "font-semibold",
                    mine ? "text-white" : "text-brand-pink",
                )}
            >
                {author}
            </p>
            <p
                className={cn(
                    "line-clamp-2",
                    mine ? "text-white/80" : "text-muted-foreground",
                )}
            >
                {preview}
            </p>
        </div>
    );
}
