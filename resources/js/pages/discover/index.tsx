import { Head, router } from "@inertiajs/react";
import { SlidersHorizontal } from "lucide-react";
import ProfileCard, { type Profile } from "@/components/discover/profile-card";

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
    if (error || profiles.length === 0) {
        return (
            <>
                <Head title="Discover" />
                <div className="flex h-full flex-col items-center justify-center gap-5 px-6 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-brand-soft">
                        <span className="text-4xl">🔍</span>
                    </div>
                    <p className="max-w-xs text-base text-muted-foreground">
                        {error ?? "No profiles found nearby."}
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
            <Head title="Discover · Find people nearby" />

            <div className="relative h-full bg-background">
                {/* Ambient brand glow */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="orb orb-pink absolute -left-20 top-1/4 h-72 w-72 opacity-10" />
                    <div className="orb orb-orange absolute -right-20 bottom-1/4 h-64 w-64 opacity-10" />
                </div>

                <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                    {/* ── Header ──────────────────────────────── */}
                    <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                Discover
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Browse profiles near you — filter by distance,
                                gender and availability to find your match.
                            </p>
                        </div>
                    </header>

                    {/* Filter bar */}
                    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-card/60 p-3 backdrop-blur-md">
                        <span className="flex items-center gap-1.5 rounded-full bg-gradient-brand-soft px-3 py-1.5 text-xs font-semibold text-brand-pink">
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            Filters
                        </span>

                        <select
                            value={filters.radius}
                            onChange={(e) =>
                                router.get("/discover", {
                                    ...filters,
                                    radius: e.target.value,
                                })
                            }
                            className="rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs text-foreground transition focus:border-brand-pink/40 focus:outline-none focus:ring-2 focus:ring-brand-pink/20"
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
                            className="rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs text-foreground transition focus:border-brand-pink/40 focus:outline-none focus:ring-2 focus:ring-brand-pink/20"
                        >
                            <option value="">Any gender</option>
                            <option value="female">Female</option>
                            <option value="male">Male</option>
                            <option value="other">Other</option>
                        </select>

                        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs text-foreground transition hover:bg-accent">
                            <input
                                type="checkbox"
                                checked={filters.available_only ?? false}
                                onChange={(e) =>
                                    router.get("/discover", {
                                        ...filters,
                                        available_only: e.target.checked
                                            ? 1
                                            : 0,
                                    })
                                }
                                className="accent-brand-pink"
                            />
                            Available now
                        </label>
                    </div>

                    {/* Grid Listing using reusable component */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {profiles.map((profile) => (
                            <ProfileCard key={profile.id} profile={profile} />
                        ))}
                    </div>

                    <div className="pb-6" />
                </div>
            </div>
        </>
    );
}
