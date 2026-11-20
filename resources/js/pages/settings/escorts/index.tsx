import {
    CheckCircle2,
    ChevronRight,
    Clock,
    Gift,
    MessageCircle,
    ShieldCheck,
    Sparkles,
    XCircle,
} from "lucide-react";
import { Head, Link } from "@inertiajs/react";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { create } from "@/routes/escorts";
import EscortController from "@/actions/App/Http/Controllers/EscortController";

type Subscription = {
    isActive: boolean;
    isExpired: boolean;
    needsRenewal: boolean;
    startedAt?: string | null;
    expiresAt?: string | null;
    plan?: string | null;
    autoRenew?: boolean;
};

type Props = {
    isEscort?: boolean;
    isVerified?: boolean;
    canAppearInListings?: boolean;
    subscription?: Subscription;
};

const ESCORT_BENEFITS = [
    {
        icon: Sparkles,
        title: "Premium profile listing",
        description:
            "Get featured at the top of Escorts and stand out from the crowd.",
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
        description:
            "Become eligible for account verification after subscribing and completing the review process.",
    },
];

function formatDate(date?: string | null): string {
    if (!date) {
        return "Not available";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
        return "Not available";
    }

    return new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(parsed);
}

function SubscriptionStatus({
    subscription,
    canAppearInListings,
}: {
    subscription: Subscription;
    canAppearInListings: boolean;
}) {
    const isActive = subscription.isActive && !subscription.isExpired;

    return (
        <section
            className={`rounded-2xl border p-5 ${
                isActive
                    ? "border-brand-green/30 bg-brand-green/5"
                    : "border-amber-500/30 bg-amber-500/5"
            }`}
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                        isActive
                            ? "bg-brand-green/15 text-brand-green"
                            : "bg-amber-500/15 text-amber-600"
                    }`}
                >
                    {isActive ? (
                        <CheckCircle2 className="h-6 w-6" />
                    ) : (
                        <Clock className="h-6 w-6" />
                    )}
                </span>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-foreground">
                            Escort listing subscription
                        </h2>

                        {isActive && (
                            <span className="rounded-full bg-brand-green/15 px-2.5 py-1 text-xs font-semibold text-brand-green">
                                Active
                            </span>
                        )}
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                        {isActive
                            ? "Your listing subscription is active. Your account is eligible for verification."
                            : subscription.isExpired
                              ? "Your listing subscription has expired. Renew to become eligible for verification and appear on Escorts again."
                              : "You do not currently have an active listing subscription. Subscribe to become eligible for account verification and appear on Escorts."}
                    </p>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-border/60 bg-card/70 p-3">
                            <p className="text-xs text-muted-foreground">
                                Subscription plan
                            </p>

                            <p className="mt-1 text-sm font-semibold text-foreground">
                                {subscription.plan || "No active plan"}
                            </p>
                        </div>

                        <div className="rounded-xl border border-border/60 bg-card/70 p-3">
                            <p className="text-xs text-muted-foreground">
                                {isActive ? "Expires on" : "Last expiry date"}
                            </p>

                            <p className="mt-1 text-sm font-semibold text-foreground">
                                {formatDate(subscription.expiresAt)}
                            </p>
                        </div>
                    </div>

                    {subscription.autoRenew !== undefined && (
                        <p className="mt-3 text-xs text-muted-foreground">
                            Automatic renewal:{" "}
                            <span className="font-semibold text-foreground">
                                {subscription.autoRenew
                                    ? "Enabled"
                                    : "Disabled"}
                            </span>
                        </p>
                    )}

                    {!isActive && (
                        <div className="mt-5">
                            <Link
                                href={EscortController.subscription().url}
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                            >
                                {subscription.isExpired
                                    ? "Renew subscription"
                                    : "Choose a subscription"}
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        </div>
                    )}

                    {isActive && (
                        <p className="mt-4 flex items-center gap-2 text-xs font-medium text-brand-green">
                            <CheckCircle2 className="h-4 w-4" />
                            Your subscription is currently valid.
                        </p>
                    )}
                </div>
            </div>

            <div className="mt-5 border-t border-border/60 pt-4">
                <div className="flex items-center gap-2">
                    {canAppearInListings ? (
                        <CheckCircle2 className="h-4 w-4 text-brand-green" />
                    ) : (
                        <XCircle className="h-4 w-4 text-amber-600" />
                    )}

                    <p className="text-sm font-medium text-foreground">
                        {canAppearInListings
                            ? "Your profile can appear on Escorts."
                            : "Your profile is currently not eligible to appear on Escorts."}
                    </p>
                </div>
            </div>
        </section>
    );
}

export default function EscortsIndex({
    isEscort = false,
    isVerified = false,
    canAppearInListings = false,
    subscription,
}: Props) {
    const [showBenefits, setShowBenefits] = useState(false);

    // Verification is only possible with an active subscription.
    const hasActiveSubscription =
        subscription?.isActive === true && subscription?.isExpired !== true;

    const accountIsVerified = hasActiveSubscription && isVerified;

    const verificationStatus = !hasActiveSubscription
        ? "locked"
        : accountIsVerified
          ? "verified"
          : "pending";

    return (
        <>
            <Head title="Escort profile" />

            <div className="space-y-8 pb-8">
                <PageHeader
                    title="Escort profile"
                    description={
                        isEscort
                            ? "Manage your escort profile, subscription, photos, services and availability."
                            : "Become an escort, grow your visibility and connect with clients."
                    }
                    backHref="/settings"
                    backHrefTitle="Back to Settings"
                />

                {!isEscort ? (
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
                                                Choose and pay for a listing
                                                subscription.
                                            </li>
                                            <li>
                                                Your account becomes eligible
                                                for verification review.
                                            </li>
                                            <li>
                                                Once approved and subscribed,
                                                your profile can appear on
                                                Escorts.
                                            </li>
                                        </ol>

                                        <p className="mt-3 text-xs">
                                            You can manage your profile even if
                                            your subscription expires.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <ShieldCheck className="h-6 w-6" />
                            </span>

                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="font-semibold text-foreground">
                                        Your escort account
                                    </h2>

                                    {verificationStatus === "verified" && (
                                        <span className="rounded-full bg-brand-green/15 px-2.5 py-1 text-xs font-semibold text-brand-green">
                                            Verified
                                        </span>
                                    )}

                                    {verificationStatus === "pending" && (
                                        <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-600">
                                            Verification pending
                                        </span>
                                    )}

                                    {verificationStatus === "locked" && (
                                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                                            Verification locked
                                        </span>
                                    )}
                                </div>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    {verificationStatus === "verified"
                                        ? "Your subscription is active and your escort profile has been approved."
                                        : verificationStatus === "pending"
                                          ? "Your subscription is active. Your escort profile is awaiting verification and approval."
                                          : "Your account cannot be verified until you purchase an active escort listing subscription."}
                                </p>

                                {verificationStatus === "locked" && (
                                    <Link
                                        href={
                                            EscortController.subscription().url
                                        }
                                        className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                                    >
                                        View subscriptions
                                        <ChevronRight className="h-4 w-4" />
                                    </Link>
                                )}
                            </div>
                        </section>

                        {subscription && (
                            <SubscriptionStatus
                                subscription={subscription}
                                canAppearInListings={canAppearInListings}
                            />
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

EscortsIndex.layout = {
    breadcrumbs: [
        {
            title: "Escorts",
            href: "/escorts",
        },
    ],
};
