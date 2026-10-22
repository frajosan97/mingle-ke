// resources/js/layouts/conversation-empty.tsx
import { MessageCircle, Sparkles, Heart } from "lucide-react";

export default function ConversationEmpty() {
    return (
        <div className="relative flex h-full flex-col items-center justify-center gap-6 overflow-hidden px-6 text-center">
            {/* Ambient brand orbs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="orb orb-pink absolute -left-20 top-1/4 h-72 w-72 opacity-30" />
                <div className="orb orb-orange absolute -right-20 top-1/3 h-64 w-64 opacity-25" />
                <div className="orb orb-gold absolute bottom-10 left-1/3 h-56 w-56 opacity-20" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center gap-6">
                {/* Icon medallion with breathing glow */}
                <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-brand blur-2xl opacity-40 animate-breathe" />
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-brand shadow-glow-pink breathe">
                        <MessageCircle
                            className="h-12 w-12 text-white"
                            strokeWidth={1.75}
                        />
                    </div>
                    {/* Floating accents */}
                    <Sparkles className="absolute -right-3 -top-2 h-5 w-5 text-brand-gold animate-float-fast" />
                    <Heart className="absolute -bottom-1 -left-3 h-4 w-4 text-brand-pink animate-float-medium" />
                </div>

                {/* Headline with gradient shimmer */}
                <h2 className="text-3xl font-semibold tracking-tight">
                    <span className="text-gradient-brand-animated">
                        Mingleke
                    </span>
                    <span className="ml-2 text-foreground">Messages</span>
                </h2>

                {/* Subcopy */}
                <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                    Send and receive messages without keeping your phone online.
                    Select a conversation to start mingling.
                </p>

                {/* Subtle CTA hint */}
                <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-green opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-green" />
                    </span>
                    You're all caught up
                </div>
            </div>
        </div>
    );
}
