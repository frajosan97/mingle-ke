// resources/js/pages/welcome.tsx
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import { dashboard, login, register } from "@/routes";
import ProfileCard, { type Profile } from "@/components/discover/profile-card";

// ============================================================
// DATA
// ============================================================

const PREMIUM: Profile[] = [
    {
        id: 1,
        name: "Wanjiku",
        age: 24,
        distanceKm: 0.8,
        locationName: "Westlands",
        ratingAvg: 4.9,
        avatarUrl: "https://i.pravatar.cc/400?img=20",
        verified: true,
        isVip: true,
        isEscort: true,
        online: true,
        gender: "female",
        bio: null,
        services: [],
        available: true,
        availabilityStatus: "online",
        rate1Hour: null,
    },
    {
        id: 2,
        name: "Aisha",
        age: 26,
        distanceKm: 1.2,
        locationName: "Kilimani",
        ratingAvg: 5.0,
        avatarUrl: "https://i.pravatar.cc/400?img=45",
        verified: true,
        isVip: true,
        isEscort: true,
        online: true,
        gender: "female",
        bio: null,
        services: [],
        available: true,
        availabilityStatus: "online",
        rate1Hour: null,
    },
    {
        id: 5,
        name: "Cynthia",
        age: 27,
        distanceKm: 3.4,
        locationName: "Karen",
        ratingAvg: 4.8,
        avatarUrl: "https://i.pravatar.cc/400?img=44",
        verified: true,
        isVip: true,
        isEscort: true,
        online: false,
        gender: "female",
        bio: null,
        services: [],
        available: true,
        availabilityStatus: "online",
        rate1Hour: null,
    },
    {
        id: 9,
        name: "Zawadi",
        age: 25,
        distanceKm: 1.9,
        locationName: "Kileleshwa",
        ratingAvg: 4.9,
        avatarUrl: "https://i.pravatar.cc/400?img=49",
        verified: true,
        isVip: true,
        isEscort: true,
        online: true,
        gender: "female",
        bio: null,
        services: [],
        available: true,
        availabilityStatus: "online",
        rate1Hour: null,
    },
    {
        id: 11,
        name: "Faith",
        age: 22,
        distanceKm: 0.5,
        locationName: "Westlands",
        ratingAvg: 5.0,
        avatarUrl: "https://i.pravatar.cc/400?img=23",
        verified: true,
        isVip: true,
        isEscort: true,
        online: true,
        gender: "female",
        bio: null,
        services: [],
        available: true,
        availabilityStatus: "online",
        rate1Hour: null,
    },
    {
        id: 12,
        name: "Mercy",
        age: 29,
        distanceKm: 2.8,
        locationName: "Lavington",
        ratingAvg: 4.7,
        avatarUrl: "https://i.pravatar.cc/400?img=33",
        verified: true,
        isVip: true,
        isEscort: true,
        online: false,
        gender: "female",
        bio: null,
        services: [],
        available: true,
        availabilityStatus: "online",
        rate1Hour: null,
    },
];

const REGULAR: Profile[] = [
    {
        id: 3,
        name: "Brenda",
        age: 23,
        distanceKm: 2.1,
        locationName: "Parklands",
        ratingAvg: 4.7,
        avatarUrl: "https://i.pravatar.cc/400?img=47",
        verified: false,
        isVip: false,
        isEscort: true,
        online: true,
        gender: "female",
        bio: null,
        services: [],
        available: true,
        availabilityStatus: "online",
        rate1Hour: null,
    },
    {
        id: 4,
        name: "Njeri",
        age: 25,
        distanceKm: 2.6,
        locationName: "Lavington",
        ratingAvg: 4.8,
        avatarUrl: "https://i.pravatar.cc/400?img=32",
        verified: true,
        isVip: false,
        isEscort: true,
        online: false,
        gender: "female",
        bio: null,
        services: [],
        available: true,
        availabilityStatus: "online",
        rate1Hour: null,
    },
    {
        id: 7,
        name: "Sharon",
        age: 24,
        distanceKm: 5.2,
        locationName: "South B",
        ratingAvg: 4.6,
        avatarUrl: "https://i.pravatar.cc/400?img=31",
        verified: false,
        isVip: false,
        isEscort: true,
        online: true,
        gender: "female",
        bio: null,
        services: [],
        available: true,
        availabilityStatus: "online",
        rate1Hour: null,
    },
    {
        id: 10,
        name: "Diana",
        age: 28,
        distanceKm: 4.5,
        locationName: "Riverside",
        ratingAvg: 4.9,
        avatarUrl: "https://i.pravatar.cc/400?img=26",
        verified: true,
        isVip: false,
        isEscort: true,
        online: false,
        gender: "female",
        bio: null,
        services: [],
        available: true,
        availabilityStatus: "online",
        rate1Hour: null,
    },
    {
        id: 13,
        name: "Naomi",
        age: 21,
        distanceKm: 1.4,
        locationName: "Kilimani",
        ratingAvg: 4.9,
        avatarUrl: "https://i.pravatar.cc/400?img=5",
        verified: true,
        isVip: false,
        isEscort: true,
        online: true,
        gender: "female",
        bio: null,
        services: [],
        available: true,
        availabilityStatus: "online",
        rate1Hour: null,
    },
    {
        id: 14,
        name: "Purity",
        age: 26,
        distanceKm: 3.1,
        locationName: "Kileleshwa",
        ratingAvg: 4.8,
        avatarUrl: "https://i.pravatar.cc/400?img=9",
        verified: false,
        isVip: false,
        isEscort: true,
        online: false,
        gender: "female",
        bio: null,
        services: [],
        available: true,
        availabilityStatus: "online",
        rate1Hour: null,
    },
];

const HERO_CHAT = [
    { from: "them", text: "Hey! I saw you're 0.8 km away 👀", time: "09:41" },
    { from: "me", text: "Haha yes! Westlands too?", time: "09:42" },
    { from: "them", text: "Yep 😊 coffee sometime?", time: "09:42" },
    { from: "me", text: "How about Java tomorrow at 4?", time: "09:43" },
];

const TICKER = [
    "Real-time GPS",
    "Verified profiles",
    "Instant chat",
    "Discreet matches",
    "Premium priority",
    "24/7 support",
    "18+ only",
    "ID-verified members",
    "Zero tolerance for scams",
];

const STATS = [
    { value: "12K+", label: "Members" },
    { value: "4.9★", label: "Rating" },
    { value: "98%", label: "Verified" },
    { value: "24/7", label: "Support" },
];

const TESTIMONIALS = [
    {
        img: 32,
        name: "Wanjiku M.",
        city: "Nairobi",
        text: "I met my partner here 6 months ago. The location feature made it so easy to find someone in my area.",
    },
    {
        img: 12,
        name: "Brian O.",
        city: "Mombasa",
        text: "Premium is worth every shilling. The priority ranking means my profile actually gets seen.",
    },
    {
        img: 47,
        name: "Aisha K.",
        city: "Kisumu",
        text: "Finally an app built for Kenya. The match suggestions are incredibly accurate.",
    },
    {
        img: 5,
        name: "Mercy W.",
        city: "Nakuru",
        text: "Discreet, safe, and the chat feels natural. I never felt pressured.",
    },
    {
        img: 23,
        name: "Kevin M.",
        city: "Nairobi",
        text: "The verified badges give me confidence. No fake profiles, no wasted time.",
    },
    {
        img: 33,
        name: "Faith A.",
        city: "Eldoret",
        text: "Found my best friend here! The nearby filter is genius.",
    },
];

const FOOTER_LINKS = {
    discover: [
        { label: "Premium escorts", href: "/browse?tier=premium" },
        { label: "Regular escorts", href: "/browse?tier=regular" },
        { label: "Near me", href: "/browse?near=1" },
        { label: "New members", href: "/browse?sort=new" },
        { label: "Top rated", href: "/browse?sort=rating" },
    ],
    company: [
        { label: "About us", href: "/about" },
        { label: "How it works", href: "/how-it-works" },
        { label: "Careers", href: "/careers" },
        { label: "Blog", href: "/blog" },
        { label: "Contact", href: "/contact" },
    ],
    support: [
        { label: "Help center", href: "/help" },
        { label: "Safety tips", href: "/safety" },
        { label: "Report user", href: "/report" },
        { label: "FAQ", href: "/faq" },
        { label: "Community", href: "/community" },
    ],
    legal: [
        { label: "Terms of service", href: "/terms" },
        { label: "Privacy policy", href: "/privacy" },
        { label: "Cookie policy", href: "/cookies" },
        { label: "18+ notice", href: "/age-notice" },
        { label: "Refund policy", href: "/refunds" },
    ],
};

const SOCIALS = [
    {
        name: "Instagram",
        href: "https://instagram.com",
        icon: "M12 2c2.7 0 3 0 4.1.1 1 .1 1.6.2 2.1.4.6.2 1 .5 1.5 1s.8.9 1 1.5c.2.5.3 1.1.4 2.1.1 1.1.1 1.4.1 4.1s0 3-.1 4.1c-.1 1-.2 1.6-.4 2.1-.2.6-.5 1-1 1.5s-.9.8-1.5 1c-.5.2-1.1.3-2.1.4-1.1.1-1.4.1-4.1.1s-3 0-4.1-.1c-1-.1-1.6-.2-2.1-.4-.6-.2-1-.5-1.5-1s-.8-.9-1-1.5c-.2-.5-.3-1.1-.4-2.1C2 15 2 14.7 2 12s0-3 .1-4.1c.1-1 .2-1.6.4-2.1.2-.6.5-1 1-1.5s.9-.8 1.5-1c.5-.2 1.1-.3 2.1-.4C9 2 9.3 2 12 2z",
    },
    {
        name: "X",
        href: "https://x.com",
        icon: "M18.9 3H22l-7.3 8.3L23.4 21h-6.7l-5.3-6.8L5.3 21H2l7.8-8.9L1 3h6.9l4.8 6.2L18.9 3z",
    },
    {
        name: "TikTok",
        href: "https://tiktok.com",
        icon: "M19.6 6.7c-1.4-.9-2.4-2.4-2.6-4.1V2h-3.9v13.9c0 2.1-1.7 3.8-3.8 3.8s-3.8-1.7-3.8-3.8 1.7-3.8 3.8-3.8c.4 0 .8.1 1.1.2V8.3c-.4-.1-.7-.1-1.1-.1C6 8.2 3.2 11 3.2 14.4s2.8 6.2 6.2 6.2 6.2-2.8 6.2-6.2V8.9c1.5 1.1 3.3 1.7 5.2 1.7V6.7c-.4 0-.8 0-1.2-.1z",
    },
    {
        name: "Facebook",
        href: "https://facebook.com",
        icon: "M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0022 12z",
    },
];

// ============================================================
// ICONS
// ============================================================

function Star({ className = "h-4 w-4" }: { className?: string }) {
    return (
        <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.364 1.118l1.287 3.957c.299.921-.755 1.688-1.539 1.118l-3.367-2.446a1 1 0 00-1.176 0l-3.367 2.446c-.783.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.075 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.951-.69l1.286-3.958z" />
        </svg>
    );
}

function Stars({ n = 5 }: { n?: number }) {
    return (
        <div className="flex gap-1 text-brand-gold">
            {Array.from({ length: n }).map((_, i) => (
                <Star key={i} className="h-4 w-4" />
            ))}
        </div>
    );
}

function Tick({ small = false }: { small?: boolean }) {
    return (
        <span
            className={`${small ? "h-4 w-4" : "h-5 w-5"} inline-flex items-center justify-center rounded-full bg-brand-blue-1 ring-2 ring-background`}
        >
            <svg
                viewBox="0 0 20 20"
                fill="white"
                className={small ? "h-2 w-2" : "h-2.5 w-2.5"}
            >
                <path d="M16.7 5.3a1 1 0 00-1.4 0L8 12.6 4.7 9.3a1 1 0 10-1.4 1.4l4 4a1 1 0 001.4 0l8-8a1 1 0 000-1.4z" />
            </svg>
        </span>
    );
}

function Heart({ className = "h-full w-full" }: { className?: string }) {
    return (
        <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
            <path d="M10 18s-7-4.35-7-9a4 4 0 017-2.65A4 4 0 0117 9c0 4.65-7 9-7 9z" />
        </svg>
    );
}

// ============================================================
// FILTER BAR
// ============================================================

function FilterBar({ tier }: { tier: "premium" | "regular" }) {
    const [query, setQuery] = useState("");
    const [area, setArea] = useState("all");
    const [sort, setSort] = useState("near");

    const areas = [
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

    return (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-card/60 p-3 backdrop-blur sm:flex-row sm:items-center">
            <div className="relative flex-1">
                <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                >
                    <path
                        fillRule="evenodd"
                        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                        clipRule="evenodd"
                    />
                </svg>
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
                {areas.map((a) => (
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

            <button className="rounded-full bg-gradient-brand px-4 py-2 text-sm font-bold text-white shadow-lg shadow-brand-pink/30 transition hover:scale-105">
                Filter
            </button>
        </div>
    );
}

// ============================================================
// PAGE
// ============================================================

export default function Welcome() {
    const { auth } = usePage().props;
    const [scrolled, setScrolled] = useState(false);
    const carouselRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const scrollCarousel = (dir: "left" | "right") => {
        if (!carouselRef.current) return;
        const amount = carouselRef.current.clientWidth * 0.8;
        carouselRef.current.scrollBy({
            left: dir === "left" ? -amount : amount,
            behavior: "smooth",
        });
    };

    return (
        <>
            <Head title="MingleKE — Meet Someone Near You" />

            <div className="min-h-screen bg-background text-foreground">
                {/* ================================================================
                    NAV
                ================================================================ */}
                <header
                    className={`nav-base fixed inset-x-0 top-0 z-50 ${scrolled ? "nav-scrolled" : "px-4 pt-4 lg:px-0"}`}
                >
                    <nav
                        className={`mx-auto flex items-center justify-between ${scrolled ? "container-page" : "nav-floating"}`}
                    >
                        <Link href="/" className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand shadow-glow-pink">
                                <span className="h-5 w-5 text-white">
                                    <Heart />
                                </span>
                            </span>
                            <span className="text-base font-extrabold tracking-tight text-foreground">
                                Mingle
                                <span className="text-gradient-brand">KE</span>
                            </span>
                        </Link>

                        <div className="hidden items-center gap-2 md:flex">
                            {[
                                ["Premium", "#premium"],
                                ["Regular", "#regular"],
                                ["Stories", "#stories"],
                                ["Safety", "#safety"],
                            ].map(([label, href]) => (
                                <a
                                    key={label}
                                    href={href}
                                    className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
                                >
                                    {label}
                                </a>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            {auth.user ? (
                                <Link
                                    href={"/conversations"}
                                    className="group relative flex items-center gap-2 rounded-full bg-gradient-brand px-4 py-2 text-sm font-bold text-white shadow-lg shadow-brand-pink/30 transition hover:scale-105"
                                    title="Open chat"
                                >
                                    <svg
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        className="h-4 w-4 transition-transform group-hover:rotate-12"
                                    >
                                        <path d="M18 10c0 3.866-3.582 7-8 7a8.84 8.84 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" />
                                    </svg>
                                    <span>Chat</span>
                                    <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-green opacity-75" />
                                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-green" />
                                    </span>
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="hidden rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground sm:block"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href={register()}
                                        className="rounded-full bg-gradient-brand px-5 py-2 text-sm font-bold text-white shadow-lg shadow-brand-pink/30 transition hover:scale-105"
                                    >
                                        Join Free
                                    </Link>
                                </>
                            )}
                        </div>
                    </nav>
                </header>

                {/* ================================================================
                    HERO
                ================================================================ */}
                <section className="relative overflow-hidden pt-32 pb-16 lg:pt-40">
                    <div className="orb orb-pink -left-40 -top-20 h-[600px] w-[600px] opacity-40 dark:opacity-100" />
                    <div
                        className="orb orb-orange -right-40 top-0 h-[600px] w-[600px] opacity-40 dark:opacity-100"
                        style={{ animationDelay: "1.5s" }}
                    />
                    <div
                        className="orb orb-gold bottom-0 left-1/2 h-[500px] w-[500px] -translate-x-1/2 opacity-30 dark:opacity-100"
                        style={{ animationDelay: "3s" }}
                    />

                    <div
                        className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(black_1px,transparent_1px),linear-gradient(90deg,black_1px,transparent_1px)] dark:[background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)]"
                        style={{
                            backgroundSize: "56px 56px",
                            maskImage:
                                "radial-gradient(ellipse at center, black 30%, transparent 75%)",
                            WebkitMaskImage:
                                "radial-gradient(ellipse at center, black 30%, transparent 75%)",
                        }}
                    />

                    <div className="container-page relative">
                        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
                            <div>
                                <div className="inline-flex animate-float-slow items-center gap-2 rounded-full border border-border bg-card/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
                                    <span className="relative flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-green opacity-75" />
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-green" />
                                    </span>
                                    1,247 online now · Nairobi · Mombasa ·
                                    Kisumu
                                </div>

                                <h1 className="mt-6 text-5xl font-black leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                                    Meet someone
                                    <br />
                                    <span className="relative inline-block">
                                        <span className="text-gradient-brand-slide">
                                            worth your time
                                        </span>
                                        <svg
                                            className="absolute -bottom-2 left-0 h-3 w-full animate-pulse-slow text-brand-pink/40"
                                            viewBox="0 0 300 12"
                                            preserveAspectRatio="none"
                                        >
                                            <path
                                                d="M0 6 Q 75 12 150 6 T 300 6"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                fill="none"
                                            />
                                        </svg>
                                    </span>
                                </h1>

                                <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground lg:text-lg">
                                    Real people. Real distances. Verified
                                    profiles, instant chat, and genuine
                                    connections — built for Kenya.
                                </p>

                                <div className="mt-8 flex flex-wrap items-center gap-3">
                                    <Link
                                        href={register()}
                                        className="group relative overflow-hidden rounded-full bg-gradient-brand px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-brand-pink/30 transition hover:scale-[1.03]"
                                    >
                                        <span className="relative z-10 flex items-center gap-2">
                                            <span className="h-4 w-4">
                                                <Heart />
                                            </span>
                                            Start Free Today
                                        </span>
                                        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                                    </Link>
                                    <a
                                        href="#premium"
                                        className="rounded-full border border-border bg-card/60 px-7 py-3.5 text-sm font-bold text-foreground backdrop-blur transition hover:border-brand-pink/40 hover:bg-accent"
                                    >
                                        Browse Nearby
                                    </a>
                                </div>

                                <div className="mt-8 flex items-center gap-4">
                                    <div className="flex -space-x-2">
                                        {[1, 5, 12, 32, 44].map((img) => (
                                            <img
                                                key={img}
                                                src={`https://i.pravatar.cc/60?img=${img}`}
                                                alt=""
                                                className="h-10 w-10 rounded-full border-2 border-background object-cover"
                                            />
                                        ))}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1 text-sm font-bold text-foreground">
                                            12,000+ members
                                            <Stars n={1} />
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            joined this month
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Phone mockup — stays dark (it's a device) */}
                            <div className="relative mx-auto w-full max-w-[360px]">
                                <div className="absolute inset-0 -z-10 animate-pulse-slow bg-gradient-brand opacity-30 blur-3xl" />
                                <div className="relative animate-float-medium">
                                    <div className="relative rounded-[2.75rem] border-[10px] border-[#0a0508] bg-[#0a0508] p-2 shadow-2xl">
                                        <div className="absolute left-1/2 top-2 z-10 h-6 w-24 -translate-x-1/2 rounded-b-3xl bg-[#0a0508]" />
                                        <div className="overflow-hidden rounded-[2.2rem] bg-[#0e0a10] p-4 pt-10">
                                            <div className="mb-3 flex items-center gap-2.5 border-b border-white/5 pb-3">
                                                <div className="relative">
                                                    <img
                                                        src="https://i.pravatar.cc/80?img=20"
                                                        alt=""
                                                        className="h-10 w-10 rounded-full object-cover"
                                                    />
                                                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 animate-pulse rounded-full border-2 border-[#0e0a10] bg-brand-green" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                                                        Wanjiku <Tick small />
                                                    </div>
                                                    <div className="text-[11px] text-brand-green">
                                                        online · 0.8 km away
                                                    </div>
                                                </div>
                                                <svg
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                    className="h-4 w-4 text-white/40"
                                                >
                                                    <circle
                                                        cx="4"
                                                        cy="10"
                                                        r="1.5"
                                                    />
                                                    <circle
                                                        cx="10"
                                                        cy="10"
                                                        r="1.5"
                                                    />
                                                    <circle
                                                        cx="16"
                                                        cy="10"
                                                        r="1.5"
                                                    />
                                                </svg>
                                            </div>

                                            <div className="space-y-2">
                                                {HERO_CHAT.map((m, i) => (
                                                    <div
                                                        key={i}
                                                        className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}
                                                    >
                                                        <div
                                                            className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-snug ${m.from === "me" ? "rounded-tr-sm bg-gradient-brand text-white" : "rounded-tl-sm bg-white/10 text-white backdrop-blur"}`}
                                                        >
                                                            {m.text}
                                                            <div
                                                                className={`mt-1 flex items-center justify-end gap-0.5 text-[9px] ${m.from === "me" ? "text-white/70" : "text-white/40"}`}
                                                            >
                                                                {m.time}{" "}
                                                                {m.from ===
                                                                    "me" && (
                                                                    <span className="text-white">
                                                                        ✓✓
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-3 flex items-center gap-2">
                                                <div className="flex h-6 items-center gap-1 rounded-full bg-white/10 px-3 backdrop-blur">
                                                    {[0, 150, 300].map((d) => (
                                                        <span
                                                            key={d}
                                                            className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60"
                                                            style={{
                                                                animationDelay: `${d}ms`,
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-[10px] text-white/40">
                                                    typing…
                                                </span>
                                            </div>

                                            <div className="mt-3 flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 backdrop-blur">
                                                <span className="flex-1 text-xs text-white/40">
                                                    Message…
                                                </span>
                                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-brand">
                                                    <svg
                                                        viewBox="0 0 20 20"
                                                        fill="white"
                                                        className="h-3 w-3"
                                                    >
                                                        <path d="M2 10l16-7-7 16-2-7-7-2z" />
                                                    </svg>
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="absolute -left-24 top-16 flex animate-float-slow items-center gap-2.5 rounded-2xl border border-border bg-card/90 p-3 shadow-lg backdrop-blur-xl">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-pink/15 text-brand-pink">
                                            <span className="h-4 w-4">
                                                <Heart />
                                            </span>
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-foreground">
                                                New Match!
                                            </div>
                                            <div className="text-[11px] text-muted-foreground">
                                                Aisha liked you
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        className="absolute -right-20 bottom-20 flex animate-float-medium items-center gap-2.5 rounded-2xl border border-border bg-card/90 p-3 shadow-lg backdrop-blur-xl"
                                        style={{ animationDelay: "2s" }}
                                    >
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-blue-1/15 text-brand-blue-1">
                                            <svg
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                                className="h-4 w-4"
                                            >
                                                <path d="M10 2a7 7 0 00-7 7c0 5 7 9 7 9s7-4 7-9a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1110 6.5a2.5 2.5 0 010 5z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-foreground">
                                                3 nearby
                                            </div>
                                            <div className="text-[11px] text-muted-foreground">
                                                within 1km
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative mt-20 overflow-hidden border-y border-border bg-muted/30 py-3">
                        <div className="flex w-max animate-marquee gap-8 whitespace-nowrap">
                            {[...TICKER, ...TICKER].map((t, i) => (
                                <span
                                    key={i}
                                    className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
                                >
                                    <svg
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        className="h-3.5 w-3.5 text-brand-green"
                                    >
                                        <path d="M16.7 5.3a1 1 0 00-1.4 0L8 12.6 4.7 9.3a1 1 0 10-1.4 1.4l4 4a1 1 0 001.4 0l8-8a1 1 0 000-1.4z" />
                                    </svg>
                                    {t}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ================================================================
                    STATS
                ================================================================ */}
                <section className="container-page py-16">
                    <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
                        {STATS.map((s, i) => (
                            <div
                                key={s.label}
                                className="animate-float-slow text-center"
                                style={{ animationDelay: `${i * 0.4}s` }}
                            >
                                <div className="text-gradient-brand-animated text-4xl font-black sm:text-5xl">
                                    {s.value}
                                </div>
                                <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    {s.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ================================================================
                    PREMIUM
                ================================================================ */}
                <section id="premium" className="container-page py-16">
                    <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
                        <div>
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-gold to-brand-orange px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-lg shadow-brand-gold/30">
                                <Star className="h-3 w-3" />
                                Premium
                            </div>
                            <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                                Top verified escorts near you
                            </h2>
                            <p className="mt-2 max-w-md text-sm text-muted-foreground">
                                Prioritized, verified, and ready to chat.
                            </p>
                        </div>
                        <Link
                            href="/browse?tier=premium"
                            className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-4 py-2 text-sm font-semibold text-foreground/80 backdrop-blur hover:border-brand-pink hover:text-brand-pink"
                        >
                            See all
                            <svg
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="h-4 w-4 transition group-hover:translate-x-0.5"
                            >
                                <path d="M7 5l6 5-6 5V5z" />
                            </svg>
                        </Link>
                    </div>

                    <FilterBar tier="premium" />

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {PREMIUM.map((e) => (
                            <ProfileCard
                                key={e.id}
                                profile={e}
                                onClick={() => router.visit(`/escorts/${e.id}`)}
                            />
                        ))}
                    </div>
                </section>

                {/* ================================================================
                    FEATURES
                ================================================================ */}
                <section className="container-page py-16">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-brand-pink/10 via-transparent to-brand-orange/5 p-6 md:col-span-2">
                            <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 animate-pulse-slow rounded-full bg-brand-pink/20 blur-3xl" />
                            <div className="relative">
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-pink">
                                    <span className="h-2 w-2 animate-pulse rounded-full bg-brand-pink" />
                                    Real-time
                                </div>
                                <h3 className="mt-3 text-2xl font-black leading-tight text-foreground">
                                    Instant chat with anyone, anywhere
                                </h3>
                                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                                    WebSocket-powered. Zero delay. Read receipts
                                    included.
                                </p>
                                <div className="mt-5 flex gap-2">
                                    {[20, 45, 44, 49, 23].map((img) => (
                                        <img
                                            key={img}
                                            src={`https://i.pravatar.cc/60?img=${img}`}
                                            alt=""
                                            className="h-10 w-10 rounded-full border-2 border-background object-cover"
                                        />
                                    ))}
                                    <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-bold text-foreground">
                                        +9
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="relative overflow-hidden rounded-2xl border border-border bg-card/60 p-6 transition hover:bg-accent/40">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green/15 text-brand-green">
                                <Heart className="h-5 w-5" />
                            </div>
                            <h3 className="mt-3 text-lg font-bold text-foreground">
                                Real connections
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Genuine people. Verified profiles only.
                            </p>
                        </div>

                        <div className="relative overflow-hidden rounded-2xl border border-border bg-card/60 p-6 transition hover:bg-accent/40">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue-1/15 text-brand-blue-1">
                                <svg
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="h-5 w-5"
                                >
                                    <path d="M10 1.5l2.4 1.7 2.9-.2 1 2.8 2.5 1.5-1 2.8 1 2.8-2.5 1.5-1 2.8-2.9-.2L10 18.5l-2.4-1.7-2.9.2-1-2.8L1.2 12.7l1-2.8-1-2.8 2.5-1.5 1-2.8 2.9.2L10 1.5z" />
                                </svg>
                            </div>
                            <h3 className="mt-3 text-lg font-bold text-foreground">
                                ID-verified
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Every profile checked. 98% approval.
                            </p>
                        </div>

                        <div className="relative overflow-hidden rounded-2xl border border-border bg-card/60 p-6 md:col-span-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-foreground">
                                        Discreet by design
                                    </h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Private chats, anonymous browsing, and
                                        full control over your visibility.
                                    </p>
                                </div>
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-gold">
                                    <svg
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        className="h-6 w-6"
                                    >
                                        <path d="M10 1L3 4v6c0 4 3 8 7 9 4-1 7-5 7-9V4l-7-3z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ================================================================
                    REGULAR
                ================================================================ */}
                <section id="regular" className="container-page py-16">
                    <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
                        <div>
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-blue-1 to-brand-blue-2 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-lg shadow-brand-blue-1/30">
                                Regular
                            </div>
                            <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                                More people nearby
                            </h2>
                            <p className="mt-2 max-w-md text-sm text-muted-foreground">
                                New members joining every day.
                            </p>
                        </div>
                        <Link
                            href="/browse?tier=regular"
                            className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-4 py-2 text-sm font-semibold text-foreground/80 backdrop-blur hover:border-brand-blue-1 hover:text-brand-blue-1"
                        >
                            See all
                            <svg
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="h-4 w-4 transition group-hover:translate-x-0.5"
                            >
                                <path d="M7 5l6 5-6 5V5z" />
                            </svg>
                        </Link>
                    </div>

                    <FilterBar tier="regular" />

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {REGULAR.map((e) => (
                            <ProfileCard
                                key={e.id}
                                profile={e}
                                onClick={() => router.visit(`/escorts/${e.id}`)}
                            />
                        ))}
                    </div>
                </section>

                {/* ================================================================
                    TESTIMONIALS
                ================================================================ */}
                <section id="stories" className="container-page py-16">
                    <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
                        <div>
                            <span className="inline-block rounded-full bg-brand-pink/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-brand-pink">
                                Stories
                            </span>
                            <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                                Real people. Real matches.
                            </h2>
                            <p className="mt-2 max-w-md text-sm text-muted-foreground">
                                Thousands of Kenyans finding meaningful
                                connections every day.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => scrollCarousel("left")}
                                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/60 text-muted-foreground transition hover:border-brand-pink/40 hover:bg-accent hover:text-foreground"
                                aria-label="Previous testimonials"
                            >
                                <svg
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="h-5 w-5"
                                >
                                    <path d="M13 5l-6 5 6 5V5z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => scrollCarousel("right")}
                                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/60 text-muted-foreground transition hover:border-brand-pink/40 hover:bg-accent hover:text-foreground"
                                aria-label="Next testimonials"
                            >
                                <svg
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="h-5 w-5"
                                >
                                    <path d="M7 5l6 5-6 5V5z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div
                        ref={carouselRef}
                        className="carousel-snap scrollbar-hidden mask-fade-x flex gap-4 overflow-x-auto pb-4"
                    >
                        {TESTIMONIALS.map((t, i) => (
                            <div
                                key={i}
                                className="relative w-[320px] shrink-0 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card to-card/40 p-6 transition hover:border-brand-pink/30 hover:bg-accent/40 sm:w-[360px]"
                            >
                                <div className="absolute right-4 top-2 text-6xl font-serif leading-none text-brand-gold/20">
                                    &ldquo;
                                </div>
                                <Stars />
                                <p className="mt-4 text-sm leading-relaxed text-foreground/80">
                                    &ldquo;{t.text}&rdquo;
                                </p>
                                <div className="mt-5 flex items-center gap-3">
                                    <div className="relative">
                                        <img
                                            src={`https://i.pravatar.cc/60?img=${t.img}`}
                                            alt=""
                                            className="h-10 w-10 rounded-full object-cover"
                                        />
                                        <div className="absolute -bottom-0.5 -right-0.5">
                                            <Tick small />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-foreground">
                                            {t.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {t.city}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ================================================================
                    CTA
                ================================================================ */}
                <section id="safety" className="container-page py-16">
                    <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-brand-pink/10 via-brand-orange/5 to-brand-gold/5 p-8 sm:p-12">
                        <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 animate-pulse-slow rounded-full bg-brand-pink/30 blur-[100px]" />
                        <div
                            className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 animate-pulse-slow rounded-full bg-brand-orange/30 blur-[100px]"
                            style={{ animationDelay: "2s" }}
                        />

                        <div className="relative flex flex-col items-center gap-6 text-center">
                            <div>
                                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-gold">
                                    <svg
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        className="h-3.5 w-3.5"
                                    >
                                        <path d="M10 1L3 4v6c0 4 3 8 7 9 4-1 7-5 7-9V4l-7-3z" />
                                    </svg>
                                    Safety first
                                </div>
                                <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                                    Ready to meet someone tonight?
                                </h2>
                                <p className="mt-3 max-w-lg text-sm text-muted-foreground">
                                    18+ only · Private chats · 24/7 support ·
                                    Report abuse anytime
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-3">
                                <Link
                                    href={register()}
                                    className="rounded-full bg-gradient-brand px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-brand-pink/30 transition hover:scale-105"
                                >
                                    Create Free Account
                                </Link>
                                <a
                                    href="#premium"
                                    className="rounded-full border border-border bg-card/70 px-7 py-3.5 text-sm font-bold text-foreground backdrop-blur transition hover:bg-accent"
                                >
                                    Browse Profiles
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ================================================================
                    FOOTER
                ================================================================ */}
                <footer className="border-t border-border bg-muted/30 px-4 pt-14 pb-8 lg:px-8">
                    <div className="container-page">
                        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
                            <div className="lg:col-span-2">
                                <Link
                                    href="/"
                                    className="flex items-center gap-2.5"
                                >
                                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand">
                                        <span className="h-5 w-5 text-white">
                                            <Heart />
                                        </span>
                                    </span>
                                    <span className="text-base font-extrabold tracking-tight text-foreground">
                                        Mingle
                                        <span className="text-gradient-brand">
                                            KE
                                        </span>
                                    </span>
                                </Link>
                                <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
                                    Kenya's most trusted platform for real
                                    connections. Meet verified singles,
                                    companions, and new friends near you —
                                    safely and instantly.
                                </p>

                                <div className="mt-6 flex gap-2">
                                    {SOCIALS.map((s) => (
                                        <a
                                            key={s.name}
                                            href={s.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={s.name}
                                            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/60 text-muted-foreground transition hover:border-brand-pink hover:bg-brand-pink/10 hover:text-brand-pink"
                                        >
                                            <svg
                                                viewBox="0 0 24 24"
                                                fill="currentColor"
                                                className="h-4 w-4"
                                            >
                                                <path d={s.icon} />
                                            </svg>
                                        </a>
                                    ))}
                                </div>
                            </div>

                            {[
                                {
                                    title: "Discover",
                                    links: FOOTER_LINKS.discover,
                                },
                                {
                                    title: "Company",
                                    links: FOOTER_LINKS.company,
                                },
                                {
                                    title: "Support",
                                    links: FOOTER_LINKS.support,
                                },
                                { title: "Legal", links: FOOTER_LINKS.legal },
                            ].map((col) => (
                                <div key={col.title}>
                                    <h4 className="text-sm font-bold text-foreground">
                                        {col.title}
                                    </h4>
                                    <ul className="mt-4 space-y-2.5">
                                        {col.links.map((link) => (
                                            <li key={link.label}>
                                                <Link
                                                    href={link.href}
                                                    className="text-sm text-muted-foreground transition hover:text-brand-pink"
                                                >
                                                    {link.label}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
                            <div className="flex flex-wrap items-center gap-3">
                                <span>
                                    © {new Date().getFullYear()} MingleKE · Made
                                    in Kenya 🇰🇪
                                </span>
                                <span className="hidden h-3 w-px bg-border sm:block" />
                                <span className="flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-green" />
                                    All systems operational
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="rounded-full border border-border bg-card/60 px-2.5 py-0.5 font-semibold text-foreground/70">
                                    18+
                                </span>
                                <span>English (KE)</span>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
