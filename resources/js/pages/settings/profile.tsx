import {
    Calendar,
    MapPin,
    Phone,
    User as UserIcon,
    Camera,
} from "lucide-react";
import { Head, usePage, Link, useForm } from "@inertiajs/react";
import { useEffect, useState, type ChangeEvent } from "react";
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

type ProfileUser = Auth["user"] & {
    phone?: string | null;
    age?: number | null;
    gender?: string | null;
    area?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
};

type ProfileFormData = {
    _method: "patch";
    name: string;
    email: string;
    phone: string;
    age: string;
    gender: string;
    area: string;
    bio: string;
    avatar: File | null;
};

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

    const user = auth.user as ProfileUser;

    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const form = useForm<ProfileFormData>({
        _method: "patch",
        name: user.name ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
        age: user.age != null ? String(user.age) : "",
        gender: user.gender ?? "",
        area: user.area ?? "",
        bio: user.bio ?? "",
        avatar: null,
    });

    const displayedAvatar = avatarPreview ?? user.avatar_url ?? null;

    // Clean up temporary preview URLs.
    useEffect(() => {
        return () => {
            if (avatarPreview) {
                URL.revokeObjectURL(avatarPreview);
            }
        };
    }, [avatarPreview]);

    const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        // Validate image type.
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

        if (!allowedTypes.includes(file.type)) {
            form.setError("avatar", "Please select a JPG, PNG or WebP image.");

            event.target.value = "";
            return;
        }

        // Validate image size (2MB).
        if (file.size > 2 * 1024 * 1024) {
            form.setError("avatar", "The image must not exceed 2MB.");

            event.target.value = "";
            return;
        }

        form.clearErrors("avatar");

        form.setData("avatar", file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.post(update().url, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setAvatarPreview(null);
                form.setData("avatar", null);
            },
        });
    };

    return (
        <>
            <Head title="Profile settings" />

            <div className="space-y-10 pb-8">
                <PageHeader
                    title="Profile"
                    description="Manage your personal information, photo and contact details."
                    backHref="/settings"
                    backHrefTitle="Back to Settings"
                />

                <div className="overflow-hidden rounded-xl border border-border bg-card/40 p-5">
                    <form
                        onSubmit={handleSubmit}
                        encType="multipart/form-data"
                        className="space-y-8"
                    >
                        {/* ── Account ─────────────────── */}
                        <Section
                            title="Account"
                            description="Your name and email appear on your public profile."
                        >
                            {/* ── Avatar upload ─────────── */}
                            <Field
                                label="Profile photo"
                                htmlFor="avatar"
                                error={form.errors.avatar}
                                hint="JPG, PNG or WebP. Maximum size: 2MB."
                            >
                                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                                    <div className="relative size-24 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                                        {displayedAvatar ? (
                                            <img
                                                src={displayedAvatar}
                                                alt="Profile avatar"
                                                className="size-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex size-full items-center justify-center">
                                                <UserIcon className="size-10 text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label
                                            htmlFor="avatar"
                                            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
                                        >
                                            <Camera className="size-4" />
                                            Change photo
                                        </label>

                                        <input
                                            id="avatar"
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            className="sr-only"
                                            onChange={handleAvatarChange}
                                        />

                                        <p className="text-xs text-muted-foreground">
                                            Choose a photo that represents you.
                                        </p>
                                    </div>
                                </div>
                            </Field>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <Field
                                    label="Your name"
                                    htmlFor="name"
                                    error={form.errors.name}
                                >
                                    <Input
                                        id="name"
                                        name="name"
                                        value={form.data.name}
                                        onChange={(event) =>
                                            form.setData(
                                                "name",
                                                event.target.value,
                                            )
                                        }
                                        required
                                        autoComplete="name"
                                        placeholder="Full name"
                                    />
                                </Field>

                                <Field
                                    label="Email address"
                                    htmlFor="email"
                                    error={form.errors.email}
                                >
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={form.data.email}
                                        onChange={(event) =>
                                            form.setData(
                                                "email",
                                                event.target.value,
                                            )
                                        }
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
                                            Your email address is unverified.{" "}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="font-semibold text-brand-pink underline underline-offset-4 hover:opacity-80"
                                            >
                                                Resend the verification email
                                            </Link>
                                        </p>

                                        {status ===
                                            "verification-link-sent" && (
                                            <p className="mt-2 text-sm font-medium text-brand-green">
                                                A new verification link has been
                                                sent to your email.
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
                                error={form.errors.phone}
                            >
                                <Input
                                    id="phone"
                                    type="tel"
                                    name="phone"
                                    value={form.data.phone}
                                    onChange={(event) =>
                                        form.setData(
                                            "phone",
                                            event.target.value,
                                        )
                                    }
                                    autoComplete="tel"
                                    placeholder="+254 7XX XXX XXX"
                                />
                            </Field>

                            <Field
                                label="Age"
                                htmlFor="age"
                                icon={Calendar}
                                error={form.errors.age}
                            >
                                <Input
                                    id="age"
                                    type="number"
                                    name="age"
                                    min={18}
                                    max={99}
                                    value={form.data.age}
                                    onChange={(event) =>
                                        form.setData("age", event.target.value)
                                    }
                                    placeholder="18+"
                                />
                            </Field>

                            {/* ── Gender ───────────────── */}
                            <Field
                                label="Gender"
                                htmlFor="gender"
                                icon={UserIcon}
                                error={form.errors.gender}
                            >
                                <CustomReactSelect
                                    id="gender"
                                    value={form.data.gender}
                                    onChange={(value) =>
                                        form.setData("gender", value)
                                    }
                                    options={GENDERS}
                                    placeholder="Prefer not to say"
                                    isClearable
                                />
                            </Field>

                            <Field
                                label="Area"
                                htmlFor="area"
                                icon={MapPin}
                                error={form.errors.area}
                            >
                                <Input
                                    id="area"
                                    name="area"
                                    value={form.data.area}
                                    onChange={(event) =>
                                        form.setData("area", event.target.value)
                                    }
                                    placeholder="e.g. Westlands, Nairobi"
                                />
                            </Field>
                        </div>

                        {/* ── Bio ─────────────────────── */}
                        <Field
                            label="Bio"
                            htmlFor="bio"
                            hint="Max 500 characters. This appears on your profile."
                            error={form.errors.bio}
                        >
                            <textarea
                                id="bio"
                                name="bio"
                                rows={4}
                                maxLength={500}
                                value={form.data.bio}
                                onChange={(event) =>
                                    form.setData("bio", event.target.value)
                                }
                                placeholder="A short intro about yourself — interests, vibe, what you're looking for…"
                                className="flex w-full min-w-0 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </Field>

                        {/* ── Save ────────────────────── */}
                        <div className="flex items-center gap-4">
                            <Button
                                type="submit"
                                disabled={form.processing}
                                data-test="update-profile-button"
                                className="rounded-full bg-primary px-8 py-2 text-sm font-bold text-white shadow-glow-pink transition-all hover:scale-[1.02] hover:shadow-glow-pink-strong"
                            >
                                {form.processing ? "Saving..." : "Save changes"}
                            </Button>
                        </div>
                    </form>
                </div>

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
