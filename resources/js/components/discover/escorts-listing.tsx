// resources/js/components/discover/escorts-listing.tsx
import { Link, router } from "@inertiajs/react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useState } from "react";
import { ChevronRight, Search, Star } from "lucide-react";
import ProfileCard, { type Profile } from "@/components/discover/profile-card";

type Tier = "premium" | "regular";

type EscortsListingProps = {
    id: string;
    tier: Tier;
    title: string;
    subtitle: string;
    seeAllHref: string;
    profiles: Profile[];
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

const AREAS = [
    "all",
    "Westlands",
    "Kilimani",
    "Karen",
    "Parklands",
    "Lavington",
    "Riverside",
    "Kileleshwa",
    "South B",
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

function FilterBar({ tier }: { tier: Tier }) {
    const [query, setQuery] = useState("");
    const [area, setArea] = useState("all");
    const [sort, setSort] = useState("near");

    return (
        <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-card/60 p-3 backdrop-blur sm:flex-row sm:items-center"
        >
            <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={`Search ${tier} escorts by name…`}
                    className="w-full rounded-full border border-border bg-background py-2 pl-9 pr-4 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-brand-pink/50 focus:ring-2 focus:ring-brand-pink/20"
                />
            </div>

            <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="rounded-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-brand-pink/50"
            >
                {AREAS.map((a) => (
                    <option key={a} value={a}>
                        {a === "all" ? "All areas" : a}
                    </option>
                ))}
            </select>

            <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-brand-pink/50"
            >
                <option value="near">Near me</option>
                <option value="rating">Top rated</option>
                <option value="new">Newest</option>
            </select>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="rounded-full bg-gradient-brand px-4 py-2 text-sm font-bold text-white shadow-lg shadow-brand-pink/30"
            >
                Filter
            </motion.button>
        </motion.div>
    );
}

export default function EscortsListing({
    id,
    tier,
    title,
    subtitle,
    seeAllHref,
    profiles,
}: EscortsListingProps) {
    const styles = TIER_STYLES[tier];

    return (
        <section id={id} className="container-page py-16">
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
                    <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                        {title}
                    </h2>
                    <p className="mt-2 max-w-md text-sm text-muted-foreground">
                        {subtitle}
                    </p>
                </div>
                <motion.div
                    whileHover={{ x: 3 }}
                    transition={{ type: "spring", stiffness: 300 }}
                >
                    <Link
                        href={seeAllHref}
                        className={`group inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-4 py-2 text-sm font-semibold text-foreground/80 backdrop-blur ${styles.hoverBorder}`}
                    >
                        See all
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                </motion.div>
            </motion.div>

            <FilterBar tier={tier} />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-80px" }}
                className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
            >
                <AnimatePresence mode="popLayout">
                    {profiles.map((profile) => (
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
                                onClick={() =>
                                    router.visit(`/escorts/${profile.id}`)
                                }
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>
        </section>
    );
}
