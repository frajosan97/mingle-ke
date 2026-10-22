// resources/js/components/landing/cta.tsx
import { Link } from "@inertiajs/react";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { register } from "@/routes";

export default function CTA() {
    return (
        <section id="safety" className="container-page py-16">
            <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-brand-pink/10 via-brand-orange/5 to-brand-gold/5 p-8 sm:p-12"
            >
                <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 animate-pulse-slow rounded-full bg-brand-pink/30 blur-[100px]" />
                <div
                    className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 animate-pulse-slow rounded-full bg-brand-orange/30 blur-[100px]"
                    style={{ animationDelay: "2s" }}
                />

                <div className="relative flex flex-col items-center gap-6 text-center">
                    <div>
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-gold">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Safety first
                        </div>
                        <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                            Ready to meet someone tonight?
                        </h2>
                        <p className="mt-3 max-w-lg text-sm text-muted-foreground">
                            18+ only · Private chats · 24/7 support · Report
                            abuse anytime
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            <Link
                                href={register()}
                                className="inline-block rounded-full bg-gradient-brand px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-brand-pink/30"
                            >
                                Create Free Account
                            </Link>
                        </motion.div>
                        <motion.a
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.97 }}
                            href="#premium"
                            className="inline-block rounded-full border border-border bg-card/70 px-7 py-3.5 text-sm font-bold text-foreground backdrop-blur transition hover:bg-accent"
                        >
                            Browse Profiles
                        </motion.a>
                    </div>
                </div>
            </motion.div>
        </section>
    );
}