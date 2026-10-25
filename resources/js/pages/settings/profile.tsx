// resources/js/pages/settings/profile.tsx
import { Form, Head, usePage, Link } from "@inertiajs/react";
import { useState } from "react";
import ProfileController from "@/actions/App/Http/Controllers/Settings/ProfileController";
import DeleteUser from "@/components/delete-user";
import InputError from "@/components/input-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { edit } from "@/routes/profile";
import type { Auth } from "@/types";
import { send } from "@/routes/verification";
import {
    Check,
    Phone,
    Calendar,
    User as UserIcon,
    MapPin,
    Sparkles,
    Crown,
    MessageCircle,
    Gift,
    ShieldCheck,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PageProps = {
    auth: Auth;
};

const GENDERS = [
    { value: "female", label: "Female" },
    { value: "male", label: "Male" },
    { value: "other", label: "Other" },
];

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
        description:
            "Chat with clients without spending coins — unlimited conversations.",
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

export default function Profile({
    mustVerifyEmail,
    status,
    isEscort = false,
}: {
    mustVerifyEmail: boolean;
    status?: string;
    isEscort?: boolean;
}) {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;
    const [showBenefits, setShowBenefits] = useState(false);

    return (
        <>
            <Head title="Profile settings" />

            <div className="space-y-10">
                {/* ── Header ──────────────────────────────────────── */}
                <div>
                    <h2 className="text-2xl font-bold text-foreground">
                        Profile Details
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Manage your personal information. Your phone number and
                        location are private and only used to match you with
                        people nearby.
                    </p>
                </div>

                <Form
                    {...ProfileController.update.form()}
                    options={{ preserveScroll: true }}
                    className="space-y-8"
                >
                    {({ processing, errors }) => (
                        <>
                            {/* ── Identity ────────────────────────── */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="name"
                                    className="text-sm font-semibold text-brand-pink"
                                >
                                    Your Name
                                </Label>
                                <div className="flex items-center gap-2 border-b-2 border-brand-pink pb-2">
                                    <Input
                                        id="name"
                                        className="w-full border-0 bg-transparent p-0 text-lg text-foreground shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                        defaultValue={user.name}
                                        name="name"
                                        required
                                        autoComplete="name"
                                        placeholder="Full name"
                                    />
                                    <Check className="h-5 w-5 text-brand-pink" />
                                </div>
                                <InputError
                                    className="mt-2"
                                    message={errors.name}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="email"
                                    className="text-sm font-semibold text-muted-foreground"
                                >
                                    Email Address
                                </Label>
                                <div className="border-b border-border pb-2 focus-within:border-brand-pink">
                                    <Input
                                        id="email"
                                        type="email"
                                        className="w-full border-0 bg-transparent p-0 text-lg text-foreground shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                        defaultValue={user.email}
                                        name="email"
                                        required
                                        autoComplete="username"
                                        placeholder="Email address"
                                    />
                                </div>
                                <InputError
                                    className="mt-2"
                                    message={errors.email}
                                />
                            </div>

                            {mustVerifyEmail &&
                                user.email_verified_at === null && (
                                    <div className="rounded-xl border border-warning/20 bg-warning/5 p-4">
                                        <p className="text-sm text-warning-foreground">
                                            Your email address is unverified.{" "}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="font-semibold underline underline-offset-4 hover:text-warning"
                                            >
                                                Click here to re-send the
                                                verification email.
                                            </Link>
                                        </p>
                                        {status ===
                                            "verification-link-sent" && (
                                            <div className="mt-2 text-sm font-medium text-brand-green">
                                                A new verification link has been
                                                sent to your email address.
                                            </div>
                                        )}
                                    </div>
                                )}

                            {/* ── Basic info (users table) ─────────── */}
                            <div className="border-t border-border pt-8">
                                <h3 className="mb-6 text-lg font-semibold text-foreground">
                                    Basic info
                                </h3>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    {/* Phone */}
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="phone"
                                            className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
                                        >
                                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                            Phone number
                                        </Label>
                                        <div className="border-b border-border pb-2 focus-within:border-brand-pink">
                                            <Input
                                                id="phone"
                                                type="tel"
                                                className="w-full border-0 bg-transparent p-0 text-base text-foreground shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                                defaultValue={
                                                    (user as any).phone ?? ""
                                                }
                                                name="phone"
                                                autoComplete="tel"
                                                placeholder="+254 7XX XXX XXX"
                                            />
                                        </div>
                                        <InputError
                                            className="mt-2"
                                            message={errors.phone}
                                        />
                                    </div>

                                    {/* Age */}
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="age"
                                            className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
                                        >
                                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                            Age
                                        </Label>
                                        <div className="border-b border-border pb-2 focus-within:border-brand-pink">
                                            <Input
                                                id="age"
                                                type="number"
                                                min={18}
                                                max={99}
                                                className="w-full border-0 bg-transparent p-0 text-base text-foreground shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                                defaultValue={
                                                    (user as any).age ?? ""
                                                }
                                                name="age"
                                                placeholder="18+"
                                            />
                                        </div>
                                        <InputError
                                            className="mt-2"
                                            message={errors.age}
                                        />
                                    </div>

                                    {/* Gender */}
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="gender"
                                            className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
                                        >
                                            <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                            Gender
                                        </Label>
                                        <div className="border-b border-border pb-2 focus-within:border-brand-pink">
                                            <select
                                                id="gender"
                                                name="gender"
                                                defaultValue={
                                                    (user as any).gender ?? ""
                                                }
                                                className="w-full border-0 bg-transparent p-0 text-base text-foreground shadow-none outline-none focus:ring-0"
                                            >
                                                <option value="">
                                                    Prefer not to say
                                                </option>
                                                {GENDERS.map((g) => (
                                                    <option
                                                        key={g.value}
                                                        value={g.value}
                                                    >
                                                        {g.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <InputError
                                            className="mt-2"
                                            message={errors.gender}
                                        />
                                    </div>

                                    {/* Area */}
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="area"
                                            className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
                                        >
                                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                            Area
                                        </Label>
                                        <div className="border-b border-border pb-2 focus-within:border-brand-pink">
                                            <Input
                                                id="area"
                                                className="w-full border-0 bg-transparent p-0 text-base text-foreground shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                                defaultValue={
                                                    (user as any).area ?? ""
                                                }
                                                name="area"
                                                placeholder="e.g. Westlands, Nairobi"
                                            />
                                        </div>
                                        <InputError
                                            className="mt-2"
                                            message={errors.area}
                                        />
                                    </div>
                                </div>

                                {/* Bio */}
                                <div className="mt-6 space-y-2">
                                    <Label
                                        htmlFor="bio"
                                        className="text-sm font-semibold text-foreground"
                                    >
                                        Bio
                                    </Label>
                                    <div className="border-b border-border pb-2 focus-within:border-brand-pink">
                                        <textarea
                                            id="bio"
                                            name="bio"
                                            rows={3}
                                            defaultValue={
                                                (user as any).bio ?? ""
                                            }
                                            placeholder="A short intro about yourself — interests, vibe, what you're looking for…"
                                            className="w-full resize-none border-0 bg-transparent p-0 text-base text-foreground shadow-none outline-none placeholder:text-muted-foreground/60 focus:ring-0"
                                        />
                                    </div>
                                    <InputError
                                        className="mt-2"
                                        message={errors.bio}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Max 500 characters. This appears on your
                                        profile.
                                    </p>
                                </div>
                            </div>

                            {/* ── Save ─────────────────────────────── */}
                            <div className="flex items-center gap-4 border-t border-border pt-6">
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                    className="rounded-full bg-gradient-brand px-8 py-2 text-sm font-bold text-white shadow-glow-pink transition-all hover:scale-[1.02] hover:shadow-glow-pink-strong"
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </>
                    )}
                </Form>

                {/* ── Become an Escort CTA ─────────────────────────── */}
                {!isEscort && (
                    <div className="border-t border-border pt-8">
                        <div className="overflow-hidden rounded-2xl border border-brand-pink/30 bg-gradient-to-br from-brand-pink/5 via-card to-brand-orange/5 p-6 sm:p-8">
                            <div className="flex items-start gap-4">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-brand text-white shadow-glow-pink">
                                    <Sparkles className="h-6 w-6" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-lg font-bold text-foreground sm:text-xl">
                                        Become an escort
                                    </h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        List your profile, get discovered by
                                        clients nearby, and unlock premium perks
                                        — free to start.
                                    </p>

                                    {/* Benefits list */}
                                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {ESCORT_BENEFITS.map((b) => {
                                            const Icon = b.icon;
                                            return (
                                                <div
                                                    key={b.title}
                                                    className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/60 p-3"
                                                >
                                                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-pink" />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-foreground">
                                                            {b.title}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {b.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* CTA */}
                                    <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
                                        <Link
                                            href="/escort/onboarding"
                                            className={cn(
                                                "inline-flex items-center justify-center gap-2 rounded-full bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-white shadow-glow-pink transition-all",
                                                "hover:scale-[1.02] hover:shadow-glow-pink-strong",
                                            )}
                                        >
                                            Get started
                                            <ChevronRight className="h-4 w-4" />
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowBenefits((v) => !v)
                                            }
                                            className="text-sm font-medium text-muted-foreground hover:text-foreground"
                                        >
                                            {showBenefits
                                                ? "Hide details"
                                                : "How it works"}
                                        </button>
                                    </div>

                                    {showBenefits && (
                                        <div className="mt-4 rounded-xl border border-border/60 bg-card/60 p-4 text-sm text-muted-foreground">
                                            <p className="font-semibold text-foreground">
                                                What happens next?
                                            </p>
                                            <ol className="mt-2 list-decimal space-y-1 pl-5">
                                                <li>
                                                    Fill in your escort profile
                                                    — appearance, rates,
                                                    services and gallery.
                                                </li>
                                                <li>
                                                    Submit for review. Most
                                                    profiles are approved within
                                                    24 hours.
                                                </li>
                                                <li>
                                                    Once approved, your profile
                                                    goes live on Discover and
                                                    you can start receiving
                                                    messages.
                                                </li>
                                            </ol>
                                            <p className="mt-3 text-xs">
                                                You can pause or delete your
                                                listing at any time.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Escort profile management (if already an escort) ── */}
                {isEscort && (
                    <div className="border-t border-border pt-8">
                        <div className="flex items-center justify-between gap-4 rounded-2xl border border-brand-green/30 bg-brand-green/5 p-4">
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-green/15 text-brand-green">
                                    <ShieldCheck className="h-5 w-5" />
                                </span>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">
                                        You're listed as an escort
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Manage your rates, gallery and
                                        availability.
                                    </p>
                                </div>
                            </div>
                            <Link
                                href="/escort/profile"
                                className="shrink-0 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent"
                            >
                                Manage
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Danger zone */}
            <div className="mt-8 border-t border-border pb-8 pt-8">
                <DeleteUser />
            </div>
        </>
    );
}

Profile.layout = {
    breadcrumbs: [{ title: "Profile settings", href: edit() }],
};
