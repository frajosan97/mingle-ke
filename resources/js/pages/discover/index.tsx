// resources/js/pages/discover/index.tsx
import { Head, Link, router } from "@inertiajs/react";
import type { Profile } from "@/components/discover/profile-card";
import EscortsListing from "@/components/discover/escorts-listing";
import { FilterBar, type DiscoverFilters } from "@/components/ui/filter-bar";

interface Paginated<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    } | null;
}

interface Props {
    profiles: Paginated<Profile>;
    filters: DiscoverFilters;
    error?: string;
}

export default function DiscoverIndex({ profiles, filters, error }: Props) {
    if (error) {
        return (
            <>
                <Head title="Discover" />
                <div className="flex h-full flex-col items-center justify-center gap-5 px-6 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-brand-soft">
                        <span className="text-4xl">🔍</span>
                    </div>
                    <p className="max-w-xs text-base text-muted-foreground">
                        {error}
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.get("/discover")}
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

    const isEmpty = profiles.data.length === 0;
    const meta = profiles.meta;

    return (
        <>
            <Head title="Discover · Find people nearby" />

            <div className="relative h-full bg-background">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="orb orb-pink absolute -left-20 top-1/4 h-72 w-72 opacity-10" />
                    <div className="orb orb-orange absolute -right-20 bottom-1/4 h-64 w-64 opacity-10" />
                </div>

                <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
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
                        {meta && meta.total > 0 && (
                            <p className="text-xs text-muted-foreground">
                                Showing{" "}
                                <span className="font-semibold text-foreground">
                                    {meta.from}–{meta.to}
                                </span>{" "}
                                of{" "}
                                <span className="font-semibold text-foreground">
                                    {meta.total}
                                </span>
                            </p>
                        )}
                    </header>

                    <FilterBar filters={filters} />

                    {isEmpty ? (
                        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-brand-soft">
                                <span className="text-3xl">🔍</span>
                            </div>
                            <p className="max-w-xs text-sm text-muted-foreground">
                                No profiles match your filters. Try widening
                                your distance or clearing a filter.
                            </p>
                            <button
                                type="button"
                                onClick={() => router.get("/discover")}
                                className="rounded-full bg-gradient-brand px-5 py-2 text-sm font-semibold text-white shadow-glow-pink transition hover:shadow-glow-pink-strong"
                            >
                                Clear all filters
                            </button>
                        </div>
                    ) : (
                        <>
                            <EscortsListing
                                variant="grid"
                                showFilters={false}
                                profiles={profiles.data}
                                columns="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5"
                                onProfileClick={(p) =>
                                    router.visit(`/escorts/${p.id}`)
                                }
                            />

                            {meta && meta.last_page > 1 && (
                                <nav className="mt-10 flex flex-wrap items-center justify-center gap-1">
                                    {profiles.links.map((link, i) => {
                                        if (!link.url) {
                                            return (
                                                <span
                                                    key={i}
                                                    className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground/50"
                                                    dangerouslySetInnerHTML={{
                                                        __html: link.label,
                                                    }}
                                                />
                                            );
                                        }
                                        return (
                                            <Link
                                                key={i}
                                                href={link.url}
                                                preserveScroll
                                                preserveState
                                                className={
                                                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition " +
                                                    (link.active
                                                        ? "border-brand-pink bg-gradient-brand-soft text-brand-pink"
                                                        : "border-border bg-card text-foreground hover:bg-accent")
                                                }
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                            />
                                        );
                                    })}
                                </nav>
                            )}
                        </>
                    )}

                    <div className="pb-6" />
                </div>
            </div>
        </>
    );
}
