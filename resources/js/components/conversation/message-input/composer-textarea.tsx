// resources/js/components/conversation/message-input/composer-textarea.tsx
import {
    useCallback,
    useEffect,
    type FormEvent,
    type KeyboardEvent,
    type RefObject,
} from "react";
import { Mic, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    onStartRecording: () => void;
    onEscape: () => void;
    hasContent: boolean;
    disabled?: boolean;
    inputRef: RefObject<HTMLTextAreaElement | null>;
}

export default function ComposerTextarea({
    value,
    onChange,
    onSubmit,
    onStartRecording,
    onEscape,
    hasContent,
    disabled,
    inputRef,
}: Props) {
    const resize = useCallback(() => {
        const el = inputRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
        el.style.overflowY = el.scrollHeight > 144 ? "auto" : "hidden";
    }, [inputRef]);

    useEffect(() => {
        resize();
    }, [value, resize]);

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Escape") {
            event.preventDefault();
            onEscape();
            return;
        }
        if (
            event.key === "Enter" &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing
        ) {
            event.preventDefault();
            onSubmit();
        }
    };

    const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <form
            onSubmit={handleFormSubmit}
            className="flex min-w-0 flex-1 items-end gap-1.5"
        >
            <div
                className={cn(
                    "flex min-h-[42px] min-w-0 flex-1 items-end rounded-[21px] border border-border/60 bg-card px-3 shadow-sm transition-all sm:px-4",
                    "focus-within:border-brand-pink/40 focus-within:ring-2 focus-within:ring-brand-pink/20",
                    disabled && "opacity-60",
                )}
            >
                <textarea
                    ref={inputRef}
                    rows={1}
                    value={value}
                    disabled={disabled}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message"
                    aria-label="Type a message"
                    className="block max-h-36 min-h-[42px] min-w-0 flex-1 resize-none overflow-y-hidden bg-transparent py-[11px] text-[15px] leading-5 text-foreground outline-none placeholder:text-muted-foreground focus:ring-0"
                />
            </div>

            {hasContent ? (
                <button
                    type="submit"
                    aria-label="Send message"
                    disabled={disabled}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-white shadow-glow-pink transition hover:shadow-glow-pink-strong hover-lift active:scale-95 disabled:opacity-50"
                >
                    <Send className="h-[19px] w-[19px]" />
                </button>
            ) : (
                <button
                    type="button"
                    onClick={onStartRecording}
                    aria-label="Record voice message"
                    disabled={disabled}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground active:scale-95 disabled:opacity-50"
                >
                    <Mic className="h-[25px] w-[25px]" />
                </button>
            )}
        </form>
    );
}
