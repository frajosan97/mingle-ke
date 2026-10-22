// resources/js/pages/welcome.tsx
import { Head, usePage } from "@inertiajs/react";
import Header from "@/components/landing/header";
import Hero from "@/components/landing/hero";
import Stats from "@/components/landing/stats";
import Features from "@/components/landing/features";
import Testimonials from "@/components/landing/testimonials";
import CTA from "@/components/landing/cta";
import Footer from "@/components/landing/footer";
import EscortsListing from "@/components/discover/escorts-listing";
import { PREMIUM, REGULAR } from "@/components/landing/data";

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
