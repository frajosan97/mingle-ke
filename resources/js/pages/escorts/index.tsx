// resources/js/pages/escorts/index.tsx
import { Head, Link, router } from "@inertiajs/react";
import { FilterBar, type DiscoverFilters } from "@/components/ui/filter-bar";
import { Profile } from "@/components/partials/escorts/profile-card";
import EscortsListing from "@/components/partials/escorts/escorts-listing";
import { EmptyState } from "@/components/ui/empty-state";
import { Search } from "lucide-react";

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

                <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 text-center">
                    <EmptyState
                        icon={<Search />}
                        description={error}
                        action={
                            <div className="flex flex-wrap justify-center gap-3">
                                <button
                                    onClick={() => router.get("/escorts")}
                                    className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-glow-pink transition hover:shadow-glow-pink-strong hover-lift"
                                >
                                    Refresh
                                </button>
                                <button
                                    onClick={() =>
                                        router.get("/settings/profile")
                                    }
                                    className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-foreground transition hover:bg-accent"
                                >
                                    Update location
                                </button>
                            </div>
                        }
                    />
                </div>
            </>
        );
    }

    const isEmpty = profiles.data.length === 0;
    const meta = profiles.meta;

    return (
        <>
            <Head title="Discover · Find people nearby" />

            <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
                <div className="mb-6">
                    <FilterBar filters={filters} />
                </div>

                {isEmpty ? (
                    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 text-center">
                        <EmptyState
                            icon={<Search />}
                            description="No profiles match your filters. Try widening your distance or clearing a filter."
                            action={
                                <div className="flex flex-wrap justify-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => router.get("/escorts")}
                                        className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-glow-pink transition hover:shadow-glow-pink-strong"
                                    >
                                        Clear all filters
                                    </button>
                                </div>
                            }
                        />
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
                            <nav className="mt-10 flex flex-wrap items-center justify-center gap-1.5">
                                {profiles.links.map((link, i) =>
                                    link.url ? (
                                        <Link
                                            key={i}
                                            href={link.url}
                                            preserveScroll
                                            preserveState
                                            className={
                                                "min-w-9 rounded-lg border px-3 py-1.5 text-center text-xs font-medium transition " +
                                                (link.active
                                                    ? "border-brand-pink bg-primary-soft text-brand-pink"
                                                    : "border-border bg-card text-foreground hover:bg-accent")
                                            }
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    ) : (
                                        <span
                                            key={i}
                                            className="min-w-9 rounded-lg border border-border bg-card px-3 py-1.5 text-center text-xs text-muted-foreground/50"
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    ),
                                )}
                            </nav>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
