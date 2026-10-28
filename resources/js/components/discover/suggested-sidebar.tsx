// resources/js/components/escorts/suggested-sidebar.tsx
import { Link } from "@inertiajs/react";
import { BadgeCheck, Compass, MapPin, Sparkles } from "lucide-react";

type SuggestedProfile = {
    id: number;
    name: string;
    avatarUrl: string | null;
    verified: boolean;
    online: boolean;
    isVip: boolean;
    locationName: string;
    area: string | null;
};

export default function SuggestedSidebar({
    profiles,
}: {
    profiles: SuggestedProfile[];
}) {
    return (
        <aside className="sticky top-0 hidden h-screen w-[280px] shrink-0 flex-col border-r border-border bg-card/50 px-4 py-6 backdrop-blur-sm xl:flex">
            {/* Brand header */}
            <Link
                href="/discover"
                className="group mb-6 flex items-center gap-2.5 px-2"
            >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand shadow-glow-pink">
                    <Sparkles className="h-4 w-4 text-white" />
                </span>
                <div className="flex flex-col">
                    <span className="text-base font-bold tracking-tight text-foreground">
                        Escorts
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                        Discover nearby
                    </span>
                </div>
            </Link>

            {/* Section header */}
            <div className="mb-3 flex items-center justify-between px-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Suggested for you
                </h3>
                {profiles.length > 0 && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {profiles.length}
                    </span>
                )}
            </div>

            {/* Profile list */}
            <div className="custom-scrollbar flex-1 space-y-1.5 overflow-y-auto pr-1">
                {profiles.length === 0 ? (
                    <div className="mt-10 flex flex-col items-center gap-3 px-4 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-brand-soft">
                            <Sparkles className="h-5 w-5 text-brand-pink" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            No suggestions yet — check back after browsing
                            Discover.
                        </p>
                    </div>
                ) : (
                    profiles.map((p) => (
                        <Link
                            key={p.id}
                            href={`/escorts/${p.id}`}
                            className="group flex items-center gap-3 rounded-xl border border-transparent p-2 transition hover-lift hover:border-border hover:bg-accent/60 active:scale-[0.98]"
                        >
                            {/* Avatar */}
                            <div className="relative h-11 w-11 shrink-0">
                                <div className="h-full w-full overflow-hidden rounded-full border border-border bg-muted">
                                    {p.avatarUrl ? (
                                        <img
                                            src={p.avatarUrl}
                                            alt={p.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-gradient-brand-soft text-sm font-bold text-brand-pink">
                                            {p.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                {p.online && (
                                    <span
                                        className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-emerald-500"
                                        aria-label="Online"
                                    />
                                )}
                            </div>

                            {/* Text */}
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1">
                                    <p className="truncate text-sm font-semibold text-foreground">
                                        {p.name}
                                    </p>
                                    {p.verified && (
                                        <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-sky-500" />
                                    )}
                                    {p.isVip && (
                                        <span className="shrink-0 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                                            VIP
                                        </span>
                                    )}
                                </div>
                                <p className="truncate text-xs text-muted-foreground">
                                    @{handleOf(p)}
                                </p>
                                {p.locationName && (
                                    <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground/80">
                                        <MapPin className="h-2.5 w-2.5 shrink-0" />
                                        {p.locationName}
                                        {p.area && ` · ${p.area}`}
                                    </p>
                                )}
                            </div>
                        </Link>
                    ))
                )}
            </div>

            {/* Footer CTA */}
            <div className="mt-4 border-t border-border pt-4">
                <Link
                    href="/discover"
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-accent hover-lift"
                >
                    <Compass className="h-3.5 w-3.5" />
                    Browse all profiles
                </Link>
            </div>
        </aside>
    );
}

function handleOf(p: { name: string }) {
    return p.name.toLowerCase().replace(/\s+/g, "");
}
