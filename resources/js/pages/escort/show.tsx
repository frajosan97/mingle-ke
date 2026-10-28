import { Head, Link, router, usePage } from "@inertiajs/react";
import { useMemo, useState, type ReactNode } from "react";
import { useLike } from "@/hooks/use-like";
import { useStartChat } from "@/hooks/use-start-chat";
import { useShare } from "@/hooks/use-share";

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

    const [activeTab, setActiveTab] = useState<"photos" | "reviews">("photos");
    const [lightbox, setLightbox] = useState<number | null>(null);
    const [sortBy, setSortBy] = useState<"latest" | "popular">("latest");

    // Custom Hooks
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
        <div className="min-h-screen bg-white">
            <Head title={`${profile.name} (@${handleOf(profile)}) | TikTok`} />

            <div className="mx-auto flex max-w-[1600px]">
                {/* ── Left Sidebar (Suggested Profiles) ───────────────── */}
                <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-r border-slate-100 px-4 py-6 xl:flex">
                    <Link
                        href="/"
                        className="mb-6 flex items-center gap-2 px-2 text-xl font-bold"
                    >
                        <span className="text-rose-500 text-2xl">🎵</span>{" "}
                        Escorts
                    </Link>

                    <div className="mb-4 flex items-center justify-between px-2">
                        <h3 className="text-sm font-semibold text-slate-500">
                            Suggested for you
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                        {suggestedProfiles.map((p) => (
                            <Link
                                key={p.id}
                                href={`/escorts/${p.id}`}
                                className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-slate-50 active:scale-[0.98]"
                            >
                                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200">
                                    {p.avatarUrl ? (
                                        <img
                                            src={p.avatarUrl}
                                            alt={p.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm font-bold text-slate-400">
                                            {p.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    {p.online && (
                                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-white bg-emerald-500" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-slate-900 flex items-center gap-1">
                                        {p.name}
                                        {p.verified && (
                                            <Icon
                                                name="check"
                                                className="h-3 w-3 text-sky-500"
                                            />
                                        )}
                                    </p>
                                    <p className="truncate text-xs text-slate-500">
                                        @{handleOf(p)}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </aside>

                {/* ── Main Content ────────────────────────────────────── */}
                <main className="flex-1 px-4 py-6 md:px-10 lg:px-16">
                    {/* ── Profile Header ──────────────────────────────── */}
                    <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:gap-10">
                        <div className="relative shrink-0">
                            <div className="h-32 w-32 overflow-hidden rounded-full border-2 border-slate-200 md:h-40 md:w-40">
                                {profile.avatarUrl ? (
                                    <img
                                        src={profile.avatarUrl}
                                        alt={profile.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-slate-50 text-5xl font-bold text-slate-300">
                                        {profile.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            <div className="flex flex-col items-center md:items-start">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                        {profile.name}
                                    </h1>
                                    {profile.verified && (
                                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 text-white">
                                            <Icon
                                                name="check"
                                                className="h-2.5 w-2.5"
                                            />
                                        </span>
                                    )}
                                </div>
                                <p className="mt-1 text-lg font-semibold text-slate-500">
                                    @{handleOf(profile)}
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 md:justify-start">
                                {isOwner ? (
                                    <>
                                        <Link
                                            href={`/escorts/${profile.id}/edit`}
                                            className="rounded-md bg-rose-500 px-8 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 active:scale-95"
                                        >
                                            Edit Profile
                                        </Link>
                                        <button
                                            onClick={handleShare}
                                            className="rounded-md bg-slate-100 px-6 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
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
                                                className="rounded-md bg-rose-500 px-8 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 active:scale-95"
                                            >
                                                Message
                                            </button>
                                        ) : (
                                            <button
                                                disabled
                                                className="rounded-md bg-slate-100 px-8 py-2 text-sm font-semibold text-slate-400"
                                            >
                                                Unavailable
                                            </button>
                                        )}

                                        {auth?.user && (
                                            <button
                                                onClick={like}
                                                disabled={
                                                    isCurrentlyLiked || isLiking
                                                }
                                                className={`flex items-center gap-2 rounded-md px-6 py-2 text-sm font-semibold transition active:scale-95 ${
                                                    isCurrentlyLiked
                                                        ? "bg-rose-50 text-rose-600"
                                                        : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                                                }`}
                                            >
                                                <Icon
                                                    name={
                                                        isCurrentlyLiked
                                                            ? "heart-filled"
                                                            : "heart"
                                                    }
                                                    className="h-4 w-4"
                                                />
                                                {isCurrentlyLiked
                                                    ? "Liked"
                                                    : "Like"}
                                            </button>
                                        )}

                                        <button
                                            onClick={handleShare}
                                            className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-900 transition hover:bg-slate-200"
                                            title={
                                                isCopied ? "Copied!" : "Share"
                                            }
                                        >
                                            <Icon
                                                name="share"
                                                className="h-4 w-4"
                                            />
                                        </button>
                                        <button className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-900 transition hover:bg-slate-200">
                                            <Icon
                                                name="more"
                                                className="h-4 w-4"
                                            />
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="mt-4 flex items-center justify-center gap-5 text-base md:justify-start">
                                <div className="flex items-center gap-1">
                                    <span className="font-bold text-slate-900">
                                        {esc?.ratingCount || 0}
                                    </span>
                                    <span className="text-slate-500">
                                        Reviews
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="font-bold text-slate-900">
                                        {esc?.ratingAvg
                                            ? esc.ratingAvg.toFixed(1)
                                            : "0.0"}
                                    </span>
                                    <span className="text-slate-500">
                                        Rating
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="font-bold text-slate-900">
                                        {esc?.profileViews.toLocaleString() ||
                                            0}
                                    </span>
                                    <span className="text-slate-500">
                                        Views
                                    </span>
                                </div>
                            </div>

                            {/* Bio */}
                            {profile.bio && (
                                <div className="mt-4 max-w-lg text-sm text-slate-900">
                                    {profile.bio.split("\n").map((line, i) => (
                                        <p key={i}>{line}</p>
                                    ))}
                                </div>
                            )}

                            {/* Tags/Badges */}
                            <div className="mt-2 flex flex-wrap justify-center gap-2 md:justify-start">
                                {profile.isVip && (
                                    <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                                        VIP
                                    </span>
                                )}
                                {esc?.isAvailable && (
                                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                                        Available
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Tabs ────────────────────────────────────────── */}
                    <div className="mt-8 border-b border-slate-200">
                        <div className="flex items-center justify-between">
                            <div className="flex gap-8">
                                <button
                                    onClick={() => setActiveTab("photos")}
                                    className={`flex items-center gap-2 pb-3 text-base font-semibold transition-colors ${
                                        activeTab === "photos"
                                            ? "border-b-2 border-slate-900 text-slate-900"
                                            : "text-slate-500 hover:text-slate-800"
                                    }`}
                                >
                                    <Icon name="grid" className="h-4 w-4" />
                                    Photos
                                </button>
                                <button
                                    onClick={() => setActiveTab("reviews")}
                                    className={`flex items-center gap-2 pb-3 text-base font-semibold transition-colors ${
                                        activeTab === "reviews"
                                            ? "border-b-2 border-slate-900 text-slate-900"
                                            : "text-slate-500 hover:text-slate-800"
                                    }`}
                                >
                                    <Icon name="heart" className="h-4 w-4" />
                                    Reviews
                                </button>
                            </div>

                            <div className="hidden pb-2 sm:block">
                                <div className="flex rounded-md border border-slate-200 text-xs font-medium">
                                    <button
                                        onClick={() => setSortBy("latest")}
                                        className={`px-3 py-1.5 rounded-l-md ${sortBy === "latest" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-50"}`}
                                    >
                                        Latest
                                    </button>
                                    <button
                                        onClick={() => setSortBy("popular")}
                                        className={`px-3 py-1.5 border-l border-slate-200 rounded-r-md ${sortBy === "popular" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-50"}`}
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
                                        className="group relative aspect-[9/16] overflow-hidden rounded-md bg-slate-100"
                                    >
                                        <img
                                            src={src}
                                            alt=""
                                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                        />

                                        {i === 0 && (
                                            <span className="absolute left-2 top-2 rounded bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                                                Pinned
                                            </span>
                                        )}
                                        <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white drop-shadow-md">
                                            <Icon
                                                name="play"
                                                className="h-3 w-3"
                                                fill="white"
                                            />
                                            <span className="text-xs font-semibold">
                                                {(
                                                    Math.floor(
                                                        Math.random() * 50000,
                                                    ) + 100
                                                ).toLocaleString()}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {activeTab === "reviews" && (
                            <div className="max-w-2xl mx-auto mt-6">
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
            <div className="text-center text-slate-500 py-10">
                No reviews yet.
            </div>
        );
    return (
        <ul className="space-y-4">
            {reviews.map((r) => (
                <li
                    key={r.id}
                    className="rounded-xl border border-slate-100 p-4 shadow-sm"
                >
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">
                            {r.reviewerName || "Anonymous"}
                        </span>
                        <div className="flex text-amber-500">
                            {[...Array(5)].map((_, i) => (
                                <Icon
                                    key={i}
                                    name="star-filled"
                                    className={`h-4 w-4 ${i < r.rating ? "text-amber-500" : "text-slate-200"}`}
                                />
                            ))}
                        </div>
                    </div>
                    {r.comment && (
                        <p className="mt-2 text-sm text-slate-700">
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
    onIndex,
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
                className="absolute right-6 top-6 text-white hover:text-slate-300"
            >
                <Icon name="x" className="h-8 w-8" />
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
/* Helpers & Icons                                                     */
/* ------------------------------------------------------------------ */

function handleOf(profile: Profile): string {
    return profile.name.toLowerCase().replace(/\s+/g, "");
}

function Icon({
    name,
    className = "h-4 w-4",
    fill = "none",
}: {
    name: string;
    className?: string;
    fill?: string;
}) {
    const paths: Record<string, ReactNode> = {
        share: (
            <>
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </>
        ),
        more: (
            <>
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
            </>
        ),
        grid: (
            <>
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
            </>
        ),
        heart: (
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        ),
        "heart-filled": (
            <path
                d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
                fill="currentColor"
            />
        ),
        check: <polyline points="20 6 9 17 4 12" />,
        play: <polygon points="5 3 19 12 5 21 5 3" fill={fill} stroke={fill} />,
        "star-filled": (
            <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill="currentColor"
            />
        ),
        x: (
            <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
            </>
        ),
    };

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={fill}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            {paths[name] || null}
        </svg>
    );
}
