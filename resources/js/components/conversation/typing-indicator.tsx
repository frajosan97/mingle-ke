// resources/js/components/conversation/typing-indicator.tsx
import { useEffect } from "react";
import BubbleShell from "@/components/conversation/bubble-shell";
import { useSound } from "@/hooks/use-sound";

interface Props {
    name: string;
}

export default function TypingIndicator({ name }: Props) {
    const playTypeSound = useSound("/sounds/typing-tap.mp3", { volume: 0.25 });

    useEffect(() => {
        playTypeSound();
    }, [playTypeSound]);

    return (
        <BubbleShell mine={false}>
            <span className="sr-only">{name} is typing</span>
            <div
                className="flex items-center gap-1 px-1 py-1.5"
                role="status"
                aria-label={`${name} is typing`}
            >
                <span
                    className="h-2 w-2 animate-bounce rounded-full bg-brand-pink/70"
                    style={{ animationDelay: "0ms" }}
                />
                <span
                    className="h-2 w-2 animate-bounce rounded-full bg-brand-orange/70"
                    style={{ animationDelay: "150ms" }}
                />
                <span
                    className="h-2 w-2 animate-bounce rounded-full bg-brand-gold/80"
                    style={{ animationDelay: "300ms" }}
                />
            </div>
        </BubbleShell>
    );
}
