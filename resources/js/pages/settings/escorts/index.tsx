import {
    Calendar,
    ChevronRight,
    Crown,
    Gift,
    Image,
    MessageCircle,
    Settings,
    ShieldCheck,
    Sparkles,
    UserRound,
    Wallet,
} from "lucide-react";
import { Head, Link } from "@inertiajs/react";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { create } from "@/routes/escorts";

type Props = {
    isEscort?: boolean;
    isVerified?: boolean;
};

const ESCORT_BENEFITS = [
    {
        icon: Crown,
        title: "Premium profile listing",
        description:
            "Get featured at the top of Discover and stand out from the crowd.",
    },
    {
        icon: MessageCircle,
        title: "Free messaging",
        description: "Chat with clients without spending coins.",
    },
    {
        icon: Gift,
        title: "User rewards",
        description:
            "Earn coins from reviews, referrals and completing your profile.",
    },
    {
        icon: ShieldCheck,
        title: "Verified badge",
        description: "Get a verified checkmark after we confirm your identity.",
    },
];

const MANAGEMENT_ITEMS = [
    {
        icon: UserRound,
        title: "My profile",
        description: "Manage your public escort profile and personal details.",
        href: "/escorts/profile",
    },
    {
        icon: Image,
        title: "Gallery",
        description: "Manage your profile photos and media.",
        href: "/escorts/gallery",
    },
    {
        icon: Wallet,
        title: "Rates and services",
        description: "Manage your rates and the services you offer.",
        href: "/escorts/rates",
    },
    {
        icon: Calendar,
        title: "Availability",
        description: "Manage your availability and schedule.",
        href: "/escorts/availability",
    },
];

export default function EscortsIndex({
    isEscort = false,
    isVerified = false,
}: Props) {
    const [showBenefits, setShowBenefits] = useState(false);

    return (
        <>
            <Head title="Escort dashboard" />

            <div className="space-y-8 pb-8">
                <PageHeader
                    title="Escort dashboard"
                    description={
                        isEscort
                            ? "Manage your escort profile, services and availability."
                            : "Become an escort, grow your visibility and connect with clients."
                    }
                    backHref="/settings"
                />

                {!isEscort ? (
                    /* Become an escort */
                    <div className="overflow-hidden rounded-2xl border border-brand-pink/30 bg-gradient-to-br from-brand-pink/5 via-card to-brand-orange/5 p-6 sm:p-8">
                        <div className="flex items-start gap-4">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-glow-pink">
                                <Sparkles className="h-6 w-6" />
                            </span>

                            <div className="min-w-0 flex-1">
                                <h2 className="text-lg font-bold text-foreground sm:text-xl">
                                    Become an escort
                                </h2>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    List your profile, get discovered by clients
                                    nearby and unlock exclusive benefits.
                                </p>

                                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {ESCORT_BENEFITS.map((benefit) => {
                                        const Icon = benefit.icon;

                                        return (
                                            <div
                                                key={benefit.title}
                                                className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/60 p-3"
                                            >
                                                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-pink" />

                                                <div>
                                                    <p className="text-sm font-semibold text-foreground">
                                                        {benefit.title}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {benefit.description}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                                    <Link
                                        href={create()}
                                        className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-glow-pink transition-all hover:scale-[1.02] hover:shadow-glow-pink-strong"
                                    >
                                        Get started
                                        <ChevronRight className="h-4 w-4" />
                                    </Link>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowBenefits((value) => !value)
                                        }
                                        className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
                                    >
                                        {showBenefits
                                            ? "Hide details"
                                            : "How it works"}
                                    </button>
                                </div>

                                {showBenefits && (
                                    <div className="mt-5 rounded-xl border border-border/60 bg-card/60 p-4 text-sm text-muted-foreground">
                                        <p className="font-semibold text-foreground">
                                            What happens next?
                                        </p>

                                        <ol className="mt-3 list-decimal space-y-2 pl-5">
                                            <li>
                                                Complete your escort profile,
                                                including appearance, rates,
                                                services and gallery.
                                            </li>
                                            <li>
                                                Submit your profile for review.
                                            </li>
                                            <li>
                                                Once approved, your profile
                                                becomes visible on Discover.
                                            </li>
                                        </ol>

                                        <p className="mt-3 text-xs">
                                            You can pause or delete your listing
                                            at any time, subject to platform
                                            rules.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Escort management */
                    <div className="space-y-8">
                        <div className="flex flex-col gap-4 rounded-2xl border border-brand-green/30 bg-brand-green/5 p-5 sm:flex-row sm:items-center">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-green/15 text-brand-green">
                                <ShieldCheck className="h-6 w-6" />
                            </span>

                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="font-semibold text-foreground">
                                        Your escort account
                                    </h2>

                                    {isVerified ? (
                                        <span className="rounded-full bg-brand-green/15 px-2.5 py-1 text-xs font-semibold text-brand-green">
                                            Verified
                                        </span>
                                    ) : (
                                        <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-600">
                                            Verification pending
                                        </span>
                                    )}
                                </div>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Your escort account is active. Manage your
                                    listing and keep your profile updated.
                                </p>
                            </div>
                        </div>

                        <section className="space-y-4">
                            <div>
                                <h2 className="text-base font-semibold text-foreground">
                                    Manage your listing
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Everything you need to manage your escort
                                    profile.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {MANAGEMENT_ITEMS.map((item) => {
                                    const Icon = item.icon;

                                    return (
                                        <Link
                                            key={item.title}
                                            href={item.href}
                                            className="group flex items-start gap-4 rounded-xl border border-border bg-card p-4 transition hover:border-brand-pink/40 hover:bg-accent/40"
                                        >
                                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-brand-pink">
                                                <Icon className="h-5 w-5" />
                                            </span>

                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-sm font-semibold text-foreground">
                                                    {item.title}
                                                </h3>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {item.description}
                                                </p>
                                            </div>

                                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-brand-pink" />
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>

                        <section className="rounded-2xl border border-border bg-card p-5">
                            <div className="flex items-center gap-3">
                                <Settings className="h-5 w-5 text-muted-foreground" />
                                <h2 className="font-semibold text-foreground">
                                    Account management
                                </h2>
                            </div>

                            <p className="mt-2 text-sm text-muted-foreground">
                                More account controls, listing preferences and
                                management tools will be available here.
                            </p>
                        </section>
                    </div>
                )}
            </div>
        </>
    );
}

EscortsIndex.layout = {
    breadcrumbs: [{ title: "Escorts", href: "/escorts" }],
};
