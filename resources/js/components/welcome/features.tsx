// resources/js/components/welcome/features.tsx
import { motion } from "framer-motion";
import { MapPin, ShieldCheck, MessageCircle, Sparkles } from "lucide-react";
import { fadeUp, stagger } from "./motion";

const FEATURES = [
    {
        icon: MapPin,
        title: "Real-time GPS matching",
        description: "See who's actually nearby — not just who says they are.",
    },
    {
        icon: ShieldCheck,
        title: "Verified profiles",
        description: "Every premium profile is ID-verified for your safety.",
    },
    {
        icon: MessageCircle,
        title: "Instant discreet chat",
        description:
            "Message privately, no phone numbers exchanged until you're ready.",
    },
    {
        icon: Sparkles,
        title: "Premium priority",
        description: "Stand out with featured placement and higher visibility.",
    },
];

export default function Features() {
    return (
        <section className="container-page py-16">
            <motion.div
                variants={stagger}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-80px" }}
                className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
            >
                {FEATURES.map((f) => {
                    const Icon = f.icon;
                    return (
                        <motion.div
                            key={f.title}
                            variants={fadeUp}
                            className="rounded-2xl border border-border bg-card p-6"
                        >
                            <Icon className="h-6 w-6 text-brand-pink" />
                            <h3 className="mt-4 text-base font-bold text-foreground">
                                {f.title}
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {f.description}
                            </p>
                        </motion.div>
                    );
                })}
            </motion.div>
        </section>
    );
}
