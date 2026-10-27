// resources/js/pages/settings/profile.tsx
import { Form, Head, usePage, Link } from "@inertiajs/react";
import { useState } from "react";
import Select from "react-select";
import ProfileController from "@/actions/App/Http/Controllers/Settings/ProfileController";
import DeleteUser from "@/components/delete-user";
import InputError from "@/components/input-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildSelectStyles } from "@/components/ui/select-styles";
import { edit } from "@/routes/profile";
import type { Auth } from "@/types";
import { send } from "@/routes/verification";
import {
    Calendar,
    ChevronRight,
    Crown,
    Gift,
    MapPin,
    MessageCircle,
    Phone,
    ShieldCheck,
    Sparkles,
    User as UserIcon,
} from "lucide-react";

type PageProps = { auth: Auth };
type GenderOption = { value: string; label: string };

const GENDERS: GenderOption[] = [
    { value: "female", label: "Female" },
    { value: "male", label: "Male" },
    { value: "other", label: "Other" },
];

const genderSelectStyles = buildSelectStyles<GenderOption, false>({
    menuIsPortal: false,
});

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

/* ─── Field wrapper ──────────────────────────────────────── */
function Field({
    label,
    htmlFor,
    icon: Icon,
    hint,
    error,
    children,
}: {
    label: string;
    htmlFor?: string;
    icon?: React.ComponentType<{ className?: string }>;
    hint?: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <Label
                htmlFor={htmlFor}
                className="flex items-center gap-1.5 text-sm font-medium text-foreground"
            >
                {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
                {label}
            </Label>
            {children}
            {hint && !error && (
                <p className="text-xs text-muted-foreground">{hint}</p>
            )}
            <InputError message={error} />
        </div>
    );
}

/* ─── Section wrapper ────────────────────────────────────── */
function Section({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-5">
            <header>
                <h3 className="text-base font-semibold text-foreground">
                    {title}
                </h3>
                {description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </header>
            {children}
        </section>
    );
}

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
    const user = auth.user as Auth["user"] & {
        phone?: string | null;
        age?: number | null;
        gender?: string | null;
        area?: string | null;
        bio?: string | null;
    };
    const [showBenefits, setShowBenefits] = useState(false);

    const currentGender = GENDERS.find((g) => g.value === user.gender) ?? null;

    return (
        <>
            <Head title="Profile settings" />

            <div className="space-y-10">
                {/* ── Header ─────────────────────────────── */}
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                        Profile details
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Manage your personal information. Your phone number and
                        location are private and only used to match you with
                        people nearby.
                    </p>
                </div>

                <Form
                    action={ProfileController.update()}
                    method="patch"
                    options={{ preserveScroll: true }}
                    className="space-y-8"
                >
                    {({ processing, errors }) => (
                        <>
                            {/* ── Account ─────────────────── */}
                            <Section
                                title="Account"
                                description="Your name and email appear on your public profile."
                            >
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <Field
                                        label="Your name"
                                        htmlFor="name"
                                        error={errors.name}
                                    >
                                        <Input
                                            id="name"
                                            name="name"
                                            defaultValue={user.name}
                                            required
                                            autoComplete="name"
                                            placeholder="Full name"
                                        />
                                    </Field>

                                    <Field
                                        label="Email address"
                                        htmlFor="email"
                                        error={errors.email}
                                    >
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            defaultValue={user.email}
                                            required
                                            autoComplete="username"
                                            placeholder="you@example.com"
                                        />
                                    </Field>
                                </div>

                                {mustVerifyEmail &&
                                    user.email_verified_at === null && (
                                        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                                            <p className="text-sm text-foreground">
                                                Your email address is
                                                unverified.{" "}
                                                <Link
                                                    href={send()}
                                                    as="button"
                                                    className="font-semibold text-brand-pink underline underline-offset-4 hover:opacity-80"
                                                >
                                                    Resend the verification
                                                    email
                                                </Link>
                                            </p>
                                            {status ===
                                                "verification-link-sent" && (
                                                <p className="mt-2 text-sm font-medium text-brand-green">
                                                    A new verification link has
                                                    been sent to your email.
                                                </p>
                                            )}
                                        </div>
                                    )}
                            </Section>

                            {/* ── Personal fields (no header) ─ */}
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <Field
                                    label="Phone number"
                                    htmlFor="phone"
                                    icon={Phone}
                                    error={errors.phone}
                                >
                                    <Input
                                        id="phone"
                                        type="tel"
                                        name="phone"
                                        defaultValue={user.phone ?? ""}
                                        autoComplete="tel"
                                        placeholder="+254 7XX XXX XXX"
                                    />
                                </Field>

                                <Field
                                    label="Age"
                                    htmlFor="age"
                                    icon={Calendar}
                                    error={errors.age}
                                >
                                    <Input
                                        id="age"
                                        type="number"
                                        name="age"
                                        min={18}
                                        max={99}
                                        defaultValue={user.age ?? ""}
                                        placeholder="18+"
                                    />
                                </Field>

                                <Field
                                    label="Gender"
                                    htmlFor="gender"
                                    icon={UserIcon}
                                    error={errors.gender}
                                >
                                    <Select<GenderOption, false>
                                        inputId="gender"
                                        name="gender"
                                        options={GENDERS}
                                        defaultValue={currentGender}
                                        placeholder="Prefer not to say"
                                        isClearable
                                        isSearchable={false}
                                        styles={genderSelectStyles}
                                        menuPosition="fixed"
                                        menuShouldScrollIntoView={false}
                                    />
                                </Field>

                                <Field
                                    label="Area"
                                    htmlFor="area"
                                    icon={MapPin}
                                    error={errors.area}
                                >
                                    <Input
                                        id="area"
                                        name="area"
                                        defaultValue={user.area ?? ""}
                                        placeholder="e.g. Westlands, Nairobi"
                                    />
                                </Field>
                            </div>

                            <Field
                                label="Bio"
                                htmlFor="bio"
                                hint="Max 500 characters. This appears on your profile."
                                error={errors.bio}
                            >
                                <textarea
                                    id="bio"
                                    name="bio"
                                    rows={4}
                                    maxLength={500}
                                    defaultValue={user.bio ?? ""}
                                    placeholder="A short intro about yourself — interests, vibe, what you're looking for…"
                                    className="flex w-full min-w-0 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </Field>

                            {/* ── Save (no border, no pt) ── */}
                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                    className="rounded-full bg-gradient-brand px-8 py-2 text-sm font-bold text-white shadow-glow-pink transition-all hover:scale-[1.02] hover:shadow-glow-pink-strong"
                                >
                                    Save changes
                                </Button>
                            </div>
                        </>
                    )}
                </Form>

                {/* ── Become an escort ────────────────────── */}
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

                                    <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
                                        <Link
                                            href="/escort/onboarding"
                                            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-white shadow-glow-pink transition-all hover:scale-[1.02] hover:shadow-glow-pink-strong"
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

                {/* ── Escort management ───────────────────── */}
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
