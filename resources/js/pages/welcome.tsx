// resources/js/pages/welcome.tsx
import { Head, usePage } from "@inertiajs/react";
import Header from "@/components/welcome/header";
import Hero from "@/components/welcome/hero";
import Stats from "@/components/welcome/stats";
import Features from "@/components/welcome/features";
import Testimonials from "@/components/welcome/testimonials";
import CTA from "@/components/welcome/cta";
import Footer from "@/components/welcome/footer";
import EscortsListing from "@/components/discover/escorts-listing";
import { PREMIUM, REGULAR } from "@/components/welcome/data";

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="MingleKE — Meet Someone Near You" />

            <div className="min-h-screen bg-background text-foreground">
                <Header user={auth.user} />
                <Hero />
                <Stats />

                <EscortsListing
                    id="premium"
                    tier="premium"
                    title="Top verified escorts near you"
                    subtitle="Prioritized, verified, and ready to chat."
                    seeAllHref="/browse?tier=premium"
                    profiles={PREMIUM}
                />

                <Features />

                <EscortsListing
                    id="regular"
                    tier="regular"
                    title="More people nearby"
                    subtitle="New members joining every day."
                    seeAllHref="/browse?tier=regular"
                    profiles={REGULAR}
                />

                <Testimonials />
                <CTA />
                <Footer />
            </div>
        </>
    );
}
