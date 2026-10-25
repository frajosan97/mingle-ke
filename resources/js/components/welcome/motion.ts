// resources/js/components/landing/motion.ts
import type { Variants } from "framer-motion";

export const fadeUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
    },
};

export const stagger: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

export const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    show: {
        opacity: 1,
        scale: 1,
        transition: { type: "spring", stiffness: 200, damping: 22 },
    },
};