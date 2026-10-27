// resources/js/components/discover/escorts-listing.tsx
import { Link, router } from "@inertiajs/react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useMemo, useState } from "react";
import { ChevronRight, Search, Star } from "lucide-react";
import ProfileCard, { type Profile } from "@/components/discover/profile-card";
import { FilterSelect } from "@/components/ui/filter-bar";

type Tier = "premium" | "regular";
type Variant = "section" | "embedded" | "grid";

type EscortsListingProps = {
    id?: string;
    tier?: Tier;
    title?: string;
    subtitle?: string;
    seeAllHref?: string;
    profiles: Profile[];
    variant?: Variant;
    showFilters?: boolean;
    className?: string;
    columns?: string;
    onProfileClick?: (profile: Profile) => void;
    emptyTitle?: string;
    emptyDescription?: string;
};

const TIER_STYLES: Record<Tier, { badge: string; hoverBorder: string }> = {
    premium: {
        badge: "bg-gradient-to-r from-brand-gold to-brand-orange shadow-lg shadow-brand-gold/30",
        hoverBorder: "hover:border-brand-pink hover:text-brand-pink",
    },
    regular: {
        badge: "bg-gradient-to-r from-brand-blue-1 to-brand-blue-2 shadow-lg shadow-brand-blue-1/30",
        hoverBorder: "hover:border-brand-blue-1 hover:text-brand-blue-1",
    },
};

type SortKey = "near" | "rating" | "new";

const SORT_OPTIONS = [
    { value: "near" as const, label: "Near me" },
    { value: "rating" as const, label: "Top rated" },
    { value: "new" as const, label: "Newest" },
];

const containerVariants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 24, scale: 0.96 },
    show: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring", stiffness: 260, damping: 24 },
    },
    exit: { opacity: 0, y: -12, scale: 0.96, transition: { duration: 0.15 } },
};

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
    },
};

export default function EscortsListing({
    id,
    tier = "regular",
    title,
    subtitle,
    seeAllHref,
    profiles,
    variant = "section",
    showFilters,
    className,
    columns = "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
    onProfileClick,
    emptyTitle,
    emptyDescription,
}: EscortsListingProps) {
    const styles = TIER_STYLES[tier];

    const filtersVisible =
        showFilters !== undefined ? showFilters : variant !== "grid";
    const showHeader = variant === "section";
    const wrapperClass =
        variant === "section"
            ? "container-page py-16"
            : variant === "embedded"
              ? "space-y-4"
              : "";

    const [query, setQuery] = useState("");
    const [sort, setSort] = useState<SortKey>("near");

    const filtered = useMemo(() => {
        let list = Array.isArray(profiles) ? profiles : [];

        if (query.trim()) {
            const q = query.trim().toLowerCase();
            list = list.filter((p) => p.name.toLowerCase().includes(q));
        }

        switch (sort) {
            case "rating":
                list = [...list].sort(
                    (a, b) => (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0),
                );
                break;
            case "near":
                list = [...list].sort(
                    (a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0),
                );
                break;
            case "new":
                list = [...list].sort((a, b) => b.id - a.id);
                break;
        }

        return list;
    }, [profiles, query, sort]);

    const handleClick =
        onProfileClick ?? ((p: Profile) => router.visit(`/escorts/${p.id}`));

    return (
        <section
            id={id}
            className={`${wrapperClass} ${className ?? ""}`.trim()}
        >
            {showHeader && (title || subtitle || seeAllHref) && (
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-60px" }}
                    className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end"
                >
                    <div>
                        <div
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white ${styles.badge}`}
                        >
                            {tier === "premium" && (
                                <Star className="h-3 w-3 fill-white" />
                            )}
                            {tier === "premium" ? "Premium" : "Regular"}
                        </div>
                        {title && (
                            <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                                {title}
                            </h2>
                        )}
                        {subtitle && (
                            <p className="mt-2 max-w-md text-sm text-muted-foreground">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {seeAllHref && (
                        <motion.div
                            whileHover={{ x: 3 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <Link
                                href={seeAllHref}
                                className={`group inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-4 py-2 text-sm font-semibold text-foreground/80 ${styles.hoverBorder}`}
                            >
                                See all
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        </motion.div>
                    )}
                </motion.div>
            )}

            {filtersVisible && (
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-40px" }}
                    className="relative z-30 mb-6 grid grid-cols-1 gap-2 rounded-2xl border border-border bg-card/80 p-3 sm:grid-cols-[1fr_180px]"
                >
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={`Search ${tier} escorts by name…`}
                            className="h-[38px] w-full rounded-full border border-border bg-background py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-brand-pink/50 focus:ring-2 focus:ring-brand-pink/20"
                        />
                    </div>
                    <FilterSelect<SortKey>
                        options={SORT_OPTIONS}
                        value={sort}
                        onChange={(v) => {
                            if (v) setSort(v);
                        }}
                        isSearchable={false}
                        isClearable={false}
                        placeholder="Sort"
                    />
                </motion.div>
            )}

            {filtered.length === 0 ? (
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-12 text-center"
                >
                    <p className="text-sm font-medium text-foreground">
                        {emptyTitle ?? `No ${tier} escorts match those filters`}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {emptyDescription ??
                            "Try a different name or sort order."}
                    </p>
                    {filtersVisible && (
                        <button
                            type="button"
                            onClick={() => {
                                setQuery("");
                                setSort("near");
                            }}
                            className="mt-4 rounded-full bg-gradient-brand px-4 py-2 text-xs font-semibold text-white shadow-glow-pink transition hover:shadow-glow-pink-strong"
                        >
                            Reset filters
                        </button>
                    )}
                </motion.div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-80px" }}
                    className={columns}
                >
                    <AnimatePresence mode="popLayout">
                        {filtered.map((profile) => (
                            <motion.div
                                key={profile.id}
                                variants={itemVariants}
                                exit="exit"
                                layout
                                whileHover={{ y: -4 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <ProfileCard
                                    profile={profile}
                                    onClick={() => handleClick(profile)}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}
        </section>
    );
}
