// resources/js/components/conversation/message-input/recording-bar.tsx
import { Send, X } from "lucide-react";

interface Props {
    seconds: number;
    onCancel: () => void;
    onStop: () => void;
}

export default function RecordingBar({ seconds, onCancel, onStop }: Props) {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    const label = `${minutes}:${remaining.toString().padStart(2, "0")}`;

    return (
        <div className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-full border border-brand-pink/30 bg-card px-3 shadow-sm sm:px-4">
            <button
                type="button"
                onClick={onCancel}
                aria-label="Cancel recording"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-destructive transition hover:bg-destructive/10"
            >
                <X className="h-5 w-5" />
            </button>
            <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive" />
                </span>
                <span className="truncate text-sm text-foreground">
                    Recording audio…
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {label}
                </span>
            </div>
            <button
                type="button"
                onClick={onStop}
                aria-label="Send voice message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-white shadow-glow-pink transition hover:shadow-glow-pink-strong"
            >
                <Send className="h-[18px] w-[18px]" />
            </button>
        </div>
    );
}
