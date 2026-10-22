// resources/js/components/landing/hero.tsx
import { Link } from "@inertiajs/react";
import { motion } from "framer-motion";
import {
    BadgeCheck,
    Check,
    Heart,
    MapPin,
    MoreVertical,
    Send,
    Star,
} from "lucide-react";
import { register } from "@/routes";
import { fadeUp, scaleIn, stagger } from "./motion";
import { HERO_CHAT, TICKER } from "./data";

export default function Hero() {
    return (
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

            <motion.div
                variants={stagger}
                initial="hidden"
                animate="show"
                className="container-page relative"
            >
                <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
                    <div>
                        <motion.div
                            variants={fadeUp}
                            className="inline-flex animate-float-slow items-center gap-2 rounded-full border border-border bg-card/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-green opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-green" />
                            </span>
                            1,247 online now · Nairobi · Mombasa · Kisumu
                        </motion.div>

                        <motion.h1
                            variants={fadeUp}
                            className="mt-6 text-5xl font-black leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl"
                        >
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
                        </motion.h1>

                        <motion.p
                            variants={fadeUp}
                            className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground lg:text-lg"
                        >
                            Real people. Real distances. Verified profiles,
                            instant chat, and genuine connections — built for
                            Kenya.
                        </motion.p>

                        <motion.div
                            variants={fadeUp}
                            className="mt-8 flex flex-wrap items-center gap-3"
                        >
                            <motion.div
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Link
                                    href={register()}
                                    className="group relative inline-block overflow-hidden rounded-full bg-gradient-brand px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-brand-pink/30"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        <Heart className="h-4 w-4 fill-white" />
                                        Start Free Today
                                    </span>
                                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                                </Link>
                            </motion.div>
                            <motion.a
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.98 }}
                                href="#premium"
                                className="rounded-full border border-border bg-card/60 px-7 py-3.5 text-sm font-bold text-foreground backdrop-blur transition hover:border-brand-pink/40 hover:bg-accent"
                            >
                                Browse Nearby
                            </motion.a>
                        </motion.div>

                        <motion.div
                            variants={fadeUp}
                            className="mt-8 flex items-center gap-4"
                        >
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
                                    <Star className="h-4 w-4 fill-brand-gold text-brand-gold" />
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    joined this month
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    <motion.div
                        variants={scaleIn}
                        initial="hidden"
                        animate="show"
                        className="relative mx-auto w-full max-w-[360px]"
                    >
                        <div className="absolute inset-0 -z-10 animate-pulse-slow bg-gradient-brand opacity-30 blur-3xl" />
                        <div className="relative animate-float-medium">
                            <PhoneMockup />
                            <MatchBadge />
                            <NearbyBadge />
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            <TickerBar />
        </section>
    );
}

// ---- Sub-components ----

function VerifiedTick({ small = false }: { small?: boolean }) {
    return (
        <span
            className={`${
                small ? "h-4 w-4" : "h-5 w-5"
            } inline-flex items-center justify-center rounded-full bg-brand-blue-1 ring-2 ring-[#0e0a10]`}
        >
            <Check
                className={`${small ? "h-2 w-2" : "h-2.5 w-2.5"} text-white`}
                strokeWidth={4}
            />
        </span>
    );
}

function PhoneMockup() {
    return (
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
                            Wanjiku <VerifiedTick small />
                        </div>
                        <div className="text-[11px] text-brand-green">
                            online · 0.8 km away
                        </div>
                    </div>
                    <MoreVertical className="h-4 w-4 text-white/40" />
                </div>

                <div className="space-y-2">
                    {HERO_CHAT.map((m, i) => (
                        <div
                            key={i}
                            className={`flex ${
                                m.from === "me"
                                    ? "justify-end"
                                    : "justify-start"
                            }`}
                        >
                            <div
                                className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-snug ${
                                    m.from === "me"
                                        ? "rounded-tr-sm bg-gradient-brand text-white"
                                        : "rounded-tl-sm bg-white/10 text-white backdrop-blur"
                                }`}
                            >
                                {m.text}
                                <div
                                    className={`mt-1 flex items-center justify-end gap-0.5 text-[9px] ${
                                        m.from === "me"
                                            ? "text-white/70"
                                            : "text-white/40"
                                    }`}
                                >
                                    {m.time}{" "}
                                    {m.from === "me" && (
                                        <span className="text-white">✓✓</span>
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
                                style={{ animationDelay: `${d}ms` }}
                            />
                        ))}
                    </div>
                    <span className="text-[10px] text-white/40">typing…</span>
                </div>

                <div className="mt-3 flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 backdrop-blur">
                    <span className="flex-1 text-xs text-white/40">
                        Message…
                    </span>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-brand">
                        <Send className="h-3 w-3 fill-white text-white" />
                    </span>
                </div>
            </div>
        </div>
    );
}

function MatchBadge() {
    return (
        <div className="absolute -left-24 top-16 flex animate-float-slow items-center gap-2.5 rounded-2xl border border-border bg-card/90 p-3 shadow-lg backdrop-blur-xl">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-pink/15 text-brand-pink">
                <Heart className="h-4 w-4 fill-brand-pink" />
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
    );
}

function NearbyBadge() {
    return (
        <div
            className="absolute -right-20 bottom-20 flex animate-float-medium items-center gap-2.5 rounded-2xl border border-border bg-card/90 p-3 shadow-lg backdrop-blur-xl"
            style={{ animationDelay: "2s" }}
        >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-blue-1/15 text-brand-blue-1">
                <MapPin className="h-4 w-4" />
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
    );
}

function TickerBar() {
    return (
        <div className="relative mt-20 overflow-hidden border-y border-border bg-muted/30 py-3">
            <div className="flex w-max animate-marquee gap-8 whitespace-nowrap">
                {[...TICKER, ...TICKER].map((t, i) => (
                    <span
                        key={i}
                        className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
                    >
                        <BadgeCheck className="h-3.5 w-3.5 text-brand-green" />
                        {t}
                    </span>
                ))}
            </div>
        </div>
    );
}
