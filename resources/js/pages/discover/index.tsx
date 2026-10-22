// resources/js/pages/discover/index.tsx
import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import { Sparkles, X, Heart, SlidersHorizontal, BadgeCheck } from "lucide-react";
import SwipeCard, { type Profile } from "@/components/discover/swipe-card";
import { cn } from "@/lib/utils";

interface Props {
    profiles: Profile[];
    filters: {
        radius: number;
        age_min: number | null;
        age_max: number | null;
        service: string | null;
        gender?: "male" | "female" | "other" | null;
        available_only?: boolean;
    };
    error?: string;
}

export default function DiscoverIndex({ profiles, filters, error }: Props) {
    const [index, setIndex] = useState(0);
    const [exiting, setExiting] = useState<"left" | "right" | null>(null);

    const current = profiles[index];

    const handleSwipe = (direction: "left" | "right") => {
        if (!current || exiting) return;
        setExiting(direction);

        if (direction === "right") {
            setTimeout(() => {
                router.post(`/discover/${current.id}/like`);
            }, 280);
        } else {
            setTimeout(() => {
                setIndex((i) => i + 1);
                setExiting(null);
            }, 280);
        }
    };

    // ── Empty / error states ─────────────────────────────────────
    if (error || !current) {
        return (
            <>
                <Head title="Discover" />
                <div className="flex h-full flex-col items-center justify-center gap-5 px-6 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-brand-soft">
                        <span className="text-4xl">🔍</span>
                    </div>
                    <p className="max-w-xs text-base text-muted-foreground">
                        {error ?? "No more profiles nearby."}
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() =>
                                router.get(
                                    "/discover",
                                    { ...filters },
                                    { preserveScroll: true },
                                )
                            }
                            className="rounded-full bg-gradient-brand px-5 py-2 text-sm font-semibold text-white shadow-glow-pink transition hover:shadow-glow-pink-strong hover-lift"
                        >
                            Refresh
                        </button>
                        <button
                            onClick={() => router.get("/settings/profile")}
                            className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-foreground transition hover:bg-accent"
                        >
                            Update location
                        </button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Discover" />

            {/* ── Filter bar ─────────────────────────────────────── */}
            <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border/60 bg-card/60 px-4 py-3 backdrop-blur-md">
                <span className="flex items-center gap-1.5 rounded-full bg-gradient-brand-soft px-3 py-1 text-xs font-semibold text-brand-pink">
                    <Sparkles className="h-3.5 w-3.5" />
                    Discover
                </span>

                <select
                    value={filters.radius}
                    onChange={(e) =>
                        router.get("/discover", {
                            ...filters,
                            radius: e.target.value,
                        })
                    }
                    className="rounded-lg border border-border/60 bg-card px-2.5 py-1.5 text-xs text-foreground transition focus:border-brand-pink/40 focus:outline-none focus:ring-2 focus:ring-brand-pink/20"
                >
                    <option value="10">Within 10 km</option>
                    <option value="25">Within 25 km</option>
                    <option value="50">Within 50 km</option>
                    <option value="100">Within 100 km</option>
                </select>

                <select
                    value={filters.gender ?? ""}
                    onChange={(e) =>
                        router.get("/discover", {
                            ...filters,
                            gender: e.target.value || null,
                        })
                    }
                    className="rounded-lg border border-border/60 bg-card px-2.5 py-1.5 text-xs text-foreground transition focus:border-brand-pink/40 focus:outline-none focus:ring-2 focus:ring-brand-pink/20"
                >
                    <option value="">Any gender</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                </select>

                <label className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-2.5 py-1.5 text-xs text-foreground transition hover:bg-accent">
                    <input
                        type="checkbox"
                        checked={filters.available_only ?? false}
                        onChange={(e) =>
                            router.get("/discover", {
                                ...filters,
                                available_only: e.target.checked ? 1 : 0,
                            })
                        }
                        className="accent-brand-pink"
                    />
                    Available now
                </label>
            </div>

            {/* ── Swipe deck + preview grid ──────────────────────── */}
            <div className="relative flex-1 overflow-y-auto bg-background">
                {/* Ambient brand glow */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="orb orb-pink absolute -left-20 top-1/4 h-72 w-72 opacity-10" />
                    <div className="orb orb-orange absolute -right-20 bottom-1/4 h-64 w-64 opacity-10" />
                </div>

                <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 lg:px-8">
                    {/* Top row: swipe deck (left) + info panel (right) */}
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:items-start">
                        {/* Swipe deck — sized to fit its own column, not the whole page */}
                        <div className="mx-auto w-full max-w-[380px]">
                            <div className="relative aspect-[3/4] w-full">
                                {profiles
                                    .slice(index, index + 3)
                                    .map((p, i) => (
                                        <SwipeCard
                                            key={p.id}
                                            profile={p}
                                            isTop={i === 0 && !exiting}
                                            onSwipe={handleSwipe}
                                        />
                                    ))}
                            </div>

                            {/* Action buttons — centered below deck */}
                            <div className="mt-4 flex items-center justify-center gap-4">
                                <button
                                    onClick={() => handleSwipe("left")}
                                    disabled={!!exiting}
                                    className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card text-destructive shadow-sm transition hover:bg-destructive/10 hover:shadow-md active:scale-95 disabled:opacity-50"
                                    aria-label="Skip"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                                <button
                                    onClick={() => handleSwipe("right")}
                                    disabled={!!exiting}
                                    className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-brand text-white shadow-glow-pink transition hover:shadow-glow-pink-strong hover-lift active:scale-95 disabled:opacity-50"
                                    aria-label="Start conversation"
                                >
                                    <Heart className="h-6 w-6 fill-white" />
                                </button>
                            </div>
                        </div>

                        {/* Info panel — profile details + filters summary on desktop */}
                        <div className="hidden rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-md lg:block">
                            <div className="mb-4 flex items-center gap-2">
                                <SlidersHorizontal className="h-4 w-4 text-brand-pink" />
                                <h3 className="text-sm font-semibold text-foreground">
                                    Discovery
                                </h3>
                            </div>

                            <div className="space-y-3">
                                <Row
                                    label="Currently viewing"
                                    value={`${current.name}${current.age !== null ? `, ${current.age}` : ""}`}
                                />
                                <Row
                                    label="Distance"
                                    value={`${current.distanceKm} km away`}
                                />
                                {current.isEscort && (
                                    <>
                                        <Row
                                            label="Availability"
                                            value={
                                                current.available
                                                    ? current.availabilityStatus
                                                    : "Offline"
                                            }
                                        />
                                        {current.ratingAvg > 0 && (
                                            <Row
                                                label="Rating"
                                                value={`${current.ratingAvg.toFixed(1)} / 5`}
                                            />
                                        )}
                                        {current.rate1Hour && (
                                            <Row
                                                label="Rate"
                                                value={`$${(current.rate1Hour / 100).toFixed(0)} / hr`}
                                            />
                                        )}
                                    </>
                                )}
                            </div>

                            <p className="mt-6 text-xs text-muted-foreground">
                                Swipe right to start a conversation. Swipe left
                                to skip. {profiles.length - index - 1} more
                                profiles remaining.
                            </p>
                        </div>
                    </div>

                    {/* Preview grid — remaining profiles as static cards */}
                    {profiles.length > index + 1 && (
                        <div>
                            <h3 className="mb-3 text-sm font-semibold text-foreground">
                                Up next
                            </h3>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                                {profiles
                                    .slice(index + 1, index + 13)
                                    .map((p) => (
                                        <PreviewCard key={p.id} profile={p} />
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

/* ─────────────────────────── Sub-components ─────────────────────────── */

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium capitalize text-foreground">
                {value}
            </span>
        </div>
    );
}

function PreviewCard({ profile }: { profile: Profile }) {
    return (
        <button
            type="button"
            className={cn(
                "group relative flex aspect-[3/4] w-full flex-col overflow-hidden rounded-xl border border-border/60 bg-card text-left shadow-sm transition hover:-translate-y-1 hover:shadow-glow-pink/20 hover-lift",
            )}
        >
            <div className="relative h-[70%] w-full bg-muted">
                {profile.avatarUrl ? (
                    <img
                        src={profile.avatarUrl}
                        alt={profile.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-brand-soft text-3xl font-light text-brand-pink/60">
                        {profile.name.charAt(0).toUpperCase()}
                    </div>
                )}
                {profile.online && (
                    <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-brand-green ring-2 ring-card" />
                )}
                {profile.verified && (
                    <span className="absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand-pink/15 backdrop-blur-sm">
                        <BadgeCheck className="h-3.5 w-3.5 text-brand-pink" />
                    </span>
                )}
            </div>
            <div className="flex flex-1 flex-col justify-center p-2">
                <p className="truncate text-xs font-semibold text-foreground">
                    {profile.name}
                    {profile.age !== null && `, ${profile.age}`}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                    {profile.distanceKm} km
                </p>
            </div>
        </button>
    );
}
