// resources/js/pages/settings/profile.tsx
import { Calendar, MapPin, Phone, User as UserIcon } from "lucide-react";
import { Form, Head, usePage, Link } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { edit, update } from "@/routes/profile";
import { send } from "@/routes/verification";
import { PageHeader } from "@/components/page-header";
import { Field } from "@/components/ui/fields";
import CustomReactSelect from "@/components/custom-react-select";
import type { Auth } from "@/types";
import DeleteUser from "@/components/delete-user";

type PageProps = { auth: Auth };

const GENDERS = [
    { value: "female", label: "Female" },
    { value: "male", label: "Male" },
    { value: "other", label: "Other" },
];

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

    return (
        <>
            <Head title="Profile settings" />

            <div className="space-y-10 pb-8">
                <PageHeader
                    title="Profile"
                    description="Manage your personal information, photo and contact details."
                    backHref="/settings"
                />

                <Form
                    action={update()}
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

                            {/* ── Personal fields ─────────── */}
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

                                {/* ── Gender ───────────────── */}
                                <Field
                                    label="Gender"
                                    htmlFor="gender"
                                    icon={UserIcon}
                                    error={errors.gender}
                                >
                                    <CustomReactSelect
                                        id="gender"
                                        value={user.gender ?? ""}
                                        onChange={(v) => {
                                            const input =
                                                document.getElementById(
                                                    "gender-input",
                                                ) as HTMLInputElement | null;

                                            if (input) {
                                                input.value = v;
                                            }
                                        }}
                                        options={GENDERS}
                                        placeholder="Prefer not to say"
                                        isClearable
                                    />

                                    <input
                                        id="gender-input"
                                        type="hidden"
                                        name="gender"
                                        defaultValue={user.gender ?? ""}
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

                            {/* ── Bio ─────────────────────── */}
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

                            {/* ── Save ────────────────────── */}
                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                    className="rounded-full bg-primary px-8 py-2 text-sm font-bold text-white shadow-glow-pink transition-all hover:scale-[1.02] hover:shadow-glow-pink-strong"
                                >
                                    Save changes
                                </Button>
                            </div>
                        </>
                    )}
                </Form>

                {/* ── Danger zone ─────────────────────── */}
                <div className="mt-8 border-t border-border pt-8">
                    <DeleteUser />
                </div>
            </div>
        </>
    );
}

Profile.layout = {
    breadcrumbs: [{ title: "Profile settings", href: edit() }],
};
