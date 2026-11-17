import { Head, usePage } from "@inertiajs/react";
import Header from "@/layouts/guest/guest-header";
import Hero from "@/components/partials/welcome/hero";
import Stats from "@/components/partials/welcome/stats";
import Features from "@/components/partials/welcome/features";
import Testimonials from "@/components/partials/welcome/testimonials";
import CTA from "@/components/partials/welcome/cta";
import Footer from "@/layouts/guest/guest-footer";
import type { StatItem } from "@/components/partials/welcome/data";
import type { Auth } from "@/types";
import EscortsListing from "@/components/partials/discover/escorts-listing";
import { Profile } from "@/components/partials/discover/profile-card";

interface WelcomeProps {
    auth: { user: Auth["user"] | null };
    premium: Profile[];
    regular: Profile[];
    stats: StatItem[];
    [key: string]: unknown;
}

export default function Welcome() {
    const { auth, premium, regular, stats } = usePage<WelcomeProps>().props;

    return (
        <>
            <Head title="MingleKE — Meet Someone Near You" />

            <Hero />

            {/* <Stats items={stats} />

                <EscortsListing
                    id="premium"
                    tier="premium"
                    title="Top verified escorts near you"
                    subtitle="Prioritized, verified, and ready to chat."
                    seeAllHref="/discover?tier=premium"
                    profiles={premium}
                />

                <Features />

                <EscortsListing
                    id="regular"
                    tier="regular"
                    title="More people nearby"
                    subtitle="New members joining every day."
                    seeAllHref="/discover?tier=regular"
                    profiles={regular}
                />

                <Testimonials />
                <CTA /> */}
        </>
    );
}
