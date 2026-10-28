import { Head, usePage } from "@inertiajs/react";
import Header from "@/components/welcome/header";
import Hero from "@/components/welcome/hero";
import Stats from "@/components/welcome/stats";
import Features from "@/components/welcome/features";
import Testimonials from "@/components/welcome/testimonials";
import CTA from "@/components/welcome/cta";
import Footer from "@/components/welcome/footer";
import EscortsListing from "@/components/discover/escorts-listing";
import type { Profile } from "@/components/discover/profile-card";
import type { StatItem } from "@/components/welcome/data";
import type { Auth } from "@/types";

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

            <div className="min-h-screen bg-background text-foreground">
                <Header user={auth.user} />
                <Hero />
                <Stats items={stats} />

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
                <CTA />
                <Footer />
            </div>
        </>
    );
}
