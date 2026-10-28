// resources/js/pages/escorts/show.tsx
import { Head, Link, usePage } from "@inertiajs/react";
import { useMemo, useState } from "react";
import {
    BadgeCheck,
    Check,
    Compass,
    Grid3x3,
    Heart,
    MapPin,
    MoreHorizontal,
    Play,
    Share2,
    Sparkles,
    Star,
    X,
} from "lucide-react";
import { useLike } from "@/hooks/use-like";
import { useStartChat } from "@/hooks/use-start-chat";
import { useShare } from "@/hooks/use-share";
import SuggestedSidebar from "@/components/discover/suggested-sidebar";
import { Stat } from "@/components/ui/stat";
import { TabButton } from "@/components/ui/tab-button";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type Review = {
    id: number;
    rating: number;
    comment: string | null;
    reviewerName: string | null;
    createdAt: string | null;
};

type EscortProfile = {
    orientation: string | null;
    heightCm: number | null;
    weightKg: number | null;
    bodyType: string | null;
    hairColor: string | null;
    eyeColor: string | null;
    ethnicity: string | null;
    smoking: boolean;
    drinking: boolean;
    services: string[];
    incall: boolean;
    outcall: boolean;
    currency: string;
    rates: {
        "15min": number | null;
        "30min": number | null;
        "1hour": number | null;
        night: number | null;
    };
    isAvailable: boolean;
    availabilityStatus: string;
    coverImageUrl: string | null;
    gallery: string[];
    isApproved: boolean;
    isFeatured: boolean;
    profileViews: number;
    ratingCount: number;
    ratingAvg: number;
};

type Profile = {
    id: number;
    name: string;
    age: number | null;
    gender: string | null;
    bio: string | null;
    avatarUrl: string | null;
    locationName: string;
    area: string | null;
    isEscort: boolean;
    isVip: boolean;
    verified: boolean;
    online: boolean;
    memberSince: string | null;
    profile: EscortProfile | null;
    reviews: Review[];
};

type Props = {
    profile: Profile;
    isOwner: boolean;
    canMessage: boolean;
    isLiked: boolean;
    suggestedProfiles?: Profile[];
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function EscortShow({
    profile,
    isOwner,
    canMessage,
    isLiked,
    suggestedProfiles = [],
}: Props) {
    const { auth } = usePage().props as { auth?: { user?: { id: number } } };
    const esc = profile.profile;

    const images = useMemo(
        () =>
            (esc
                ? [esc.coverImageUrl, ...esc.gallery].filter(Boolean)
                : []) as string[],
        [esc],
    );

    // Stable pseudo-random view counts (derived, not re-rolled each render)
    const viewCounts = useMemo(
        () =>
            images.map(
                (_, i) => 100 + ((profile.id * 7919 + i * 104729) % 49900),
            ),
        [images, profile.id],
    );

    const [activeTab, setActiveTab] = useState<"photos" | "reviews">("photos");
    const [lightbox, setLightbox] = useState<number | null>(null);
    const [sortBy, setSortBy] = useState<"latest" | "popular">("latest");

    const {
        isLiked: isCurrentlyLiked,
        isLiking,
        like,
    } = useLike(profile.id, isLiked);
    const { startChat } = useStartChat();
    const { share, isCopied } = useShare();

    const handleShare = () => {
        const url = window.location.href;
        share(profile.name, `Check out ${profile.name} on our platform!`, url);
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Head
                title={`${profile.name} (@${handleOf(profile)}) · Discover`}
            />

            <div className="mx-auto flex max-w-[1600px]">
                {/* ── Left Sidebar (Suggested Profiles) ───────────────── */}
                <SuggestedSidebar profiles={suggestedProfiles} />

                {/* ── Main Content ────────────────────────────────────── */}
                <main className="min-w-0 flex-1 px-4 py-6 md:px-10 lg:px-16">
                    {/* ── Profile Header ──────────────────────────────── */}
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-border bg-card sm:h-28 sm:w-28">
                                {profile.avatarUrl ? (
                                    <img
                                        src={profile.avatarUrl}
                                        alt={profile.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-gradient-brand-soft text-3xl font-bold text-brand-pink">
                                        {profile.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            {profile.online && (
                                <span
                                    className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-background bg-emerald-500"
                                    aria-label="Online"
                                />
                            )}
                        </div>

                        <div className="min-w-0 flex-1 text-center sm:text-left">
                            {/* Name + handle + location (single tight block) */}
                            <div className="flex flex-col items-center sm:items-start">
                                <div className="flex items-center gap-1.5">
                                    <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                                        {profile.name}
                                    </h1>
                                    {profile.verified && (
                                        <BadgeCheck
                                            className="h-4 w-4 text-sky-500"
                                            aria-label="Verified"
                                        />
                                    )}
                                </div>
                                <p className="mt-0.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground sm:justify-start">
                                    <span>@{handleOf(profile)}</span>
                                    {profile.locationName && (
                                        <>
                                            <span
                                                aria-hidden="true"
                                                className="text-muted-foreground/40"
                                            >
                                                ·
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                {profile.locationName}
                                                {profile.area &&
                                                    ` · ${profile.area}`}
                                            </span>
                                        </>
                                    )}
                                </p>
                            </div>

                            {/* Tags — pulled up next to name (was at the bottom) */}
                            {(profile.isVip ||
                                esc?.isAvailable ||
                                esc?.isFeatured) && (
                                <div className="mt-2 flex flex-wrap justify-center gap-1.5 sm:justify-start">
                                    {profile.isVip && (
                                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                            VIP
                                        </span>
                                    )}
                                    {esc?.isAvailable && (
                                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                            Available now
                                        </span>
                                    )}
                                    {esc?.isFeatured && (
                                        <span className="rounded-full border border-brand-pink/30 bg-gradient-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand-pink">
                                            Featured
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Bio — clamped to 2 lines */}
                            {profile.bio && (
                                <p className="mt-2 line-clamp-2 max-w-lg text-sm text-foreground/80">
                                    {profile.bio}
                                </p>
                            )}

                            {/* Actions + stats inline on desktop */}
                            <div className="mt-3 flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between">
                                {/* Action Buttons */}
                                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                                    {isOwner ? (
                                        <>
                                            <Link
                                                href={`/escorts/${profile.id}/edit`}
                                                className="rounded-full bg-gradient-brand px-5 py-1.5 text-sm font-semibold text-white shadow-glow-pink transition hover:shadow-glow-pink-strong hover-lift active:scale-95"
                                            >
                                                Edit Profile
                                            </Link>
                                            <button
                                                onClick={handleShare}
                                                className="rounded-full border border-border bg-card px-5 py-1.5 text-sm font-semibold text-foreground transition hover:bg-accent active:scale-95"
                                            >
                                                {isCopied ? "Copied!" : "Share"}
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            {canMessage ? (
                                                <button
                                                    onClick={() =>
                                                        startChat(profile.id)
                                                    }
                                                    className="rounded-full bg-gradient-brand px-6 py-1.5 text-sm font-semibold text-white shadow-glow-pink transition hover:shadow-glow-pink-strong hover-lift active:scale-95"
                                                >
                                                    Message
                                                </button>
                                            ) : (
                                                <button
                                                    disabled
                                                    className="cursor-not-allowed rounded-full border border-border bg-muted px-6 py-1.5 text-sm font-semibold text-muted-foreground/60"
                                                >
                                                    Unavailable
                                                </button>
                                            )}

                                            {auth?.user && (
                                                <button
                                                    onClick={like}
                                                    disabled={
                                                        isCurrentlyLiked ||
                                                        isLiking
                                                    }
                                                    className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition active:scale-95 ${
                                                        isCurrentlyLiked
                                                            ? "border border-brand-pink/40 bg-gradient-brand-soft text-brand-pink"
                                                            : "border border-border bg-card text-foreground hover:bg-accent"
                                                    }`}
                                                >
                                                    <Heart
                                                        className="h-4 w-4"
                                                        fill={
                                                            isCurrentlyLiked
                                                                ? "currentColor"
                                                                : "none"
                                                        }
                                                    />
                                                    {isCurrentlyLiked
                                                        ? "Liked"
                                                        : "Like"}
                                                </button>
                                            )}

                                            <button
                                                onClick={handleShare}
                                                className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:bg-accent"
                                                title={
                                                    isCopied
                                                        ? "Copied!"
                                                        : "Share"
                                                }
                                            >
                                                <Share2 className="h-4 w-4" />
                                            </button>
                                            <button className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:bg-accent">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </button>
                                        </>
                                    )}
                                </div>

                                {/* Stats — inline right of buttons on desktop */}
                                <div className="flex items-center gap-4 text-sm sm:gap-5">
                                    <Stat
                                        value={esc?.ratingCount ?? 0}
                                        label="Reviews"
                                    />
                                    <Stat
                                        value={
                                            esc?.ratingAvg
                                                ? esc.ratingAvg.toFixed(1)
                                                : "0.0"
                                        }
                                        label="Rating"
                                    />
                                    <Stat
                                        value={(
                                            esc?.profileViews ?? 0
                                        ).toLocaleString()}
                                        label="Views"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Tabs ────────────────────────────────────────── */}
                    <div className="mt-8 border-b border-border">
                        <div className="flex items-center justify-between">
                            <div className="flex gap-8">
                                <TabButton
                                    active={activeTab === "photos"}
                                    onClick={() => setActiveTab("photos")}
                                    icon={<Grid3x3 className="h-4 w-4" />}
                                    label="Photos"
                                    count={images.length}
                                />
                                <TabButton
                                    active={activeTab === "reviews"}
                                    onClick={() => setActiveTab("reviews")}
                                    icon={<Heart className="h-4 w-4" />}
                                    label="Reviews"
                                    count={profile.reviews.length}
                                />
                            </div>

                            <div className="hidden pb-2 sm:block">
                                <div className="flex rounded-full border border-border bg-card p-0.5 text-xs font-medium">
                                    <button
                                        onClick={() => setSortBy("latest")}
                                        className={`rounded-full px-3 py-1.5 transition ${
                                            sortBy === "latest"
                                                ? "bg-gradient-brand-soft text-brand-pink"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        Latest
                                    </button>
                                    <button
                                        onClick={() => setSortBy("popular")}
                                        className={`rounded-full px-3 py-1.5 transition ${
                                            sortBy === "popular"
                                                ? "bg-gradient-brand-soft text-brand-pink"
                                                : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        Popular
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Grid Content ────────────────────────────────── */}
                    <div className="mt-4 pb-20">
                        {activeTab === "photos" && (
                            <div className="grid grid-cols-3 gap-1 sm:gap-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                                {images.map((src, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setLightbox(i)}
                                        className="group relative aspect-[9/16] overflow-hidden rounded-lg bg-muted"
                                    >
                                        <img
                                            src={src}
                                            alt=""
                                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                        />

                                        {i === 0 && (
                                            <span className="absolute left-2 top-2 rounded-full bg-gradient-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-glow-pink">
                                                Pinned
                                            </span>
                                        )}
                                        <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/50 px-1.5 py-0.5 text-white backdrop-blur-sm">
                                            <Play className="h-3 w-3 fill-white" />
                                            <span className="text-xs font-semibold">
                                                {viewCounts[i].toLocaleString()}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {activeTab === "reviews" && (
                            <div className="mx-auto mt-6 max-w-2xl">
                                <ReviewsTab reviews={profile.reviews} />
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* ── Lightbox ────────────────────────────────────────── */}
            {lightbox !== null && images[lightbox] && (
                <Lightbox
                    images={images}
                    index={lightbox}
                    onClose={() => setLightbox(null)}
                    onIndex={(i) => setLightbox(i)}
                />
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function ReviewsTab({ reviews }: { reviews: Review[] }) {
    if (reviews.length === 0)
        return (
            <div className="py-10 text-center text-sm text-muted-foreground">
                No reviews yet.
            </div>
        );

    return (
        <ul className="space-y-3">
            {reviews.map((r) => (
                <li
                    key={r.id}
                    className="rounded-xl border border-border bg-card p-4 shadow-sm"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">
                            {r.reviewerName || "Anonymous"}
                        </span>
                        <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                        i < r.rating
                                            ? "fill-amber-500 text-amber-500"
                                            : "fill-none text-muted-foreground/30"
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                    {r.comment && (
                        <p className="mt-2 text-sm text-foreground/80">
                            {r.comment}
                        </p>
                    )}
                </li>
            ))}
        </ul>
    );
}

function Lightbox({
    images,
    index,
    onClose,
}: {
    images: string[];
    index: number;
    onClose: () => void;
    onIndex: (i: number) => void;
}) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
            onClick={onClose}
        >
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
                className="absolute right-6 top-6 rounded-full p-2 text-white transition hover:bg-white/10"
                aria-label="Close"
            >
                <X className="h-7 w-7" />
            </button>
            <img
                src={images[index]}
                alt=""
                className="max-h-[90vh] max-w-[90vw] object-contain"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function handleOf(profile: { name: string }): string {
    return profile.name.toLowerCase().replace(/\s+/g, "");
}
