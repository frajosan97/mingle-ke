// resources/js/components/welcome/stats.tsx
import { motion } from "framer-motion";
import type { StatItem } from "./data";
import { fadeUp, stagger } from "./motion";

interface Props {
    items: StatItem[];
}

export default function Stats({ items }: Props) {
    return (
        <section className="container-page py-16">
            <motion.div
                variants={stagger}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-80px" }}
                className="grid grid-cols-2 gap-8 sm:grid-cols-4"
            >
                {items.map((s) => (
                    <motion.div
                        key={s.label}
                        variants={fadeUp}
                        className="text-center"
                    >
                        <div className="text-gradient-brand-animated text-4xl font-black sm:text-5xl">
                            {s.value}
                        </div>
                        <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {s.label}
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </section>
    );
}
