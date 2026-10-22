// resources/js/components/landing/testimonials.tsx
import { motion } from "framer-motion";
import { useRef } from "react";
import { Check, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { fadeUp } from "./motion";
import { TESTIMONIALS } from "./data";

export default function Testimonials() {
    const carouselRef = useRef<HTMLDivElement>(null);

    const scrollCarousel = (dir: "left" | "right") => {
        if (!carouselRef.current) return;
        const amount = carouselRef.current.clientWidth * 0.8;
        carouselRef.current.scrollBy({
            left: dir === "left" ? -amount : amount,
            behavior: "smooth",
        });
    };

    return (
        <section id="stories" className="container-page py-16">
            <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-80px" }}
                className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end"
            >
                <div>
                    <span className="inline-block rounded-full bg-brand-pink/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-brand-pink">
                        Stories
                    </span>
                    <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                        Real people. Real matches.
                    </h2>
                    <p className="mt-2 max-w-md text-sm text-muted-foreground">
                        Thousands of Kenyans finding meaningful connections
                        every day.
                    </p>
                </div>
                <div className="flex gap-2">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => scrollCarousel("left")}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/60 text-muted-foreground transition hover:border-brand-pink/40 hover:bg-accent hover:text-foreground"
                        aria-label="Previous testimonials"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => scrollCarousel("right")}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/60 text-muted-foreground transition hover:border-brand-pink/40 hover:bg-accent hover:text-foreground"
                        aria-label="Next testimonials"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </motion.button>
                </div>
            </motion.div>

            <div
                ref={carouselRef}
                className="carousel-snap scrollbar-hidden mask-fade-x flex gap-4 overflow-x-auto pb-4"
            >
                {TESTIMONIALS.map((t, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-40px" }}
                        transition={{ delay: i * 0.06, duration: 0.4 }}
                        whileHover={{ y: -4 }}
                        className="relative w-[320px] shrink-0 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card to-card/40 p-6 transition hover:border-brand-pink/30 hover:bg-accent/40 sm:w-[360px]"
                    >
                        <div className="absolute right-4 top-2 text-6xl font-serif leading-none text-brand-gold/20">
                            &ldquo;
                        </div>

                        <div className="flex gap-1 text-brand-gold">
                            {Array.from({ length: 5 }).map((_, idx) => (
                                <Star
                                    key={idx}
                                    className="h-4 w-4 fill-brand-gold"
                                />
                            ))}
                        </div>

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
                                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-blue-1 ring-2 ring-background">
                                        <Check
                                            className="h-2 w-2 text-white"
                                            strokeWidth={4}
                                        />
                                    </span>
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
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
