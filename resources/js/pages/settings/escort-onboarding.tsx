// resources/js/pages/settings/escort-onboarding.tsx
import { Form, Head, Link } from "@inertiajs/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import InputError from "@/components/input-error";
import { cn } from "@/lib/utils";
import {
    ArrowLeft,
    Camera,
    Check,
    ChevronRight,
    Image as ImageIcon,
    MapPin,
    ShieldCheck,
    Sparkles,
    X,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────
interface EscortProfile {
    orientation: string | null;
    height_cm: number | null;
    weight_kg: number | null;
    body_type: string | null;
    hair_color: string | null;
    eye_color: string | null;
    ethnicity: string | null;
    services: string[];
    smoking: boolean;
    drinking: boolean;
    rate_15min: number | null;
    rate_30min: number | null;
    rate_1hour: number | null;
    rate_night: number | null;
    currency: string;
    is_available: boolean;
    availability_status: "online" | "incall" | "outcall" | "offline";
    incall: boolean;
    outcall: boolean;
    cover_image_url: string | null;
    gallery_urls: string[];
    is_approved: boolean;
    is_featured: boolean;
}

interface Props {
    profile: EscortProfile | null;
}

// ── Static option sets ───────────────────────────────────────────
const BODY_TYPES = [
    "Slim",
    "Athletic",
    "Average",
    "Curvy",
    "Muscular",
    "Plus-size",
];
const HAIR_COLORS = ["Black", "Brown", "Blonde", "Red", "Other"];
const EYE_COLORS = ["Brown", "Black", "Blue", "Green", "Hazel", "Other"];
const ETHNICITIES = [
    "African",
    "Asian",
    "Caucasian",
    "Hispanic",
    "Middle Eastern",
    "Mixed",
    "Other",
];
const ORIENTATIONS = [
    "Straight",
    "Bisexual",
    "Lesbian",
    "Gay",
    "Pansexual",
    "Other",
];
const SERVICE_OPTIONS = [
    "Girlfriend Experience (GFE)",
    "Boyfriend Experience (BFE)",
    "Dinner dates",
    "Overnight",
    "Massage",
    "Role play",
    "Couples",
    "Travel companion",
    "Photo / video shoots",
    "Companionship only",
];
const CURRENCIES = ["KES", "USD", "EUR", "GBP", "UGX", "TZS"];

// ── Component ────────────────────────────────────────────────────
export default function EscortOnboarding({ profile }: Props) {
    const isEditing = profile !== null;

    // Form state mirrors the payload exactly.
    const [services, setServices] = useState<string[]>(profile?.services ?? []);
    const [galleryPreview, setGalleryPreview] = useState<string[]>(
        profile?.gallery_urls ?? [],
    );
    const [coverPreview, setCoverPreview] = useState<string | null>(
        profile?.cover_image_url ?? null,
    );
    const [removedGallery, setRemovedGallery] = useState<string[]>([]);

    function toggleService(svc: string) {
        setServices((prev) =>
            prev.includes(svc) ? prev.filter((s) => s !== svc) : [...prev, svc],
        );
    }

    function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setCoverPreview(URL.createObjectURL(file));
    }

    function handleGalleryChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files ?? []);
        const urls = files.map((f) => URL.createObjectURL(f));
        setGalleryPreview((prev) => [...prev, ...urls].slice(0, 8));
    }

    function removeGalleryImage(index: number) {
        setGalleryPreview((prev) => {
            const url = prev[index];
            if (url && !url.startsWith("blob:")) {
                setRemovedGallery((r) => [...r, url]);
            }
            return prev.filter((_, i) => i !== index);
        });
    }

    return (
        <>
            <Head
                title={isEditing ? "Manage escort profile" : "Become an escort"}
            />

            <div className="space-y-8">
                {/* ── Back + Header ────────────────────────────── */}
                <div>
                    <Link
                        href="/settings/profile"
                        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to settings
                    </Link>

                    <div className="flex items-start gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-brand text-white shadow-glow-pink">
                            <Sparkles className="h-6 w-6" />
                        </span>
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">
                                {isEditing
                                    ? "Manage your escort profile"
                                    : "Become an escort"}
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {isEditing
                                    ? "Keep your rates, services and availability up to date. Changes go live immediately."
                                    : "Fill in your details below. Your profile will be reviewed and usually approved within 24 hours."}
                            </p>
                        </div>
                    </div>

                    {isEditing && (
                        <div
                            className={cn(
                                "mt-4 flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm",
                                profile.is_approved
                                    ? "border-brand-green/30 bg-brand-green/5 text-brand-green"
                                    : "border-warning/30 bg-warning/5 text-warning-foreground",
                            )}
                        >
                            <ShieldCheck className="h-4 w-4" />
                            {profile.is_approved
                                ? "Your profile is live on Discover."
                                : "Your profile is pending review — it will appear on Discover once approved."}
                        </div>
                    )}
                </div>

                {/* ── Form ─────────────────────────────────────── */}
                <Form
                    action="/escort/onboarding"
                    method="post"
                    options={{ preserveScroll: true }}
                    encType="multipart/form-data"
                    className="space-y-10"
                >
                    {({ processing, errors, progress }) => (
                        <>
                            {/* Hidden removed gallery paths */}
                            {removedGallery.map((url, i) => (
                                <input
                                    key={i}
                                    type="hidden"
                                    name={`removed_gallery[${i}]`}
                                    value={url}
                                />
                            ))}

                            {/* ── Appearance ──────────────────── */}
                            <Section title="Appearance" icon={Sparkles}>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <SelectField
                                        label="Orientation"
                                        name="orientation"
                                        defaultValue={
                                            profile?.orientation ?? ""
                                        }
                                        options={ORIENTATIONS}
                                        errors={errors.orientation}
                                    />
                                    <SelectField
                                        label="Body type"
                                        name="body_type"
                                        defaultValue={profile?.body_type ?? ""}
                                        options={BODY_TYPES}
                                        errors={errors.body_type}
                                    />
                                    <TextField
                                        label="Height (cm)"
                                        name="height_cm"
                                        type="number"
                                        min={100}
                                        max={250}
                                        defaultValue={profile?.height_cm ?? ""}
                                        errors={errors.height_cm}
                                    />
                                    <TextField
                                        label="Weight (kg)"
                                        name="weight_kg"
                                        type="number"
                                        min={30}
                                        max={200}
                                        defaultValue={profile?.weight_kg ?? ""}
                                        errors={errors.weight_kg}
                                    />
                                    <SelectField
                                        label="Hair color"
                                        name="hair_color"
                                        defaultValue={profile?.hair_color ?? ""}
                                        options={HAIR_COLORS}
                                        errors={errors.hair_color}
                                    />
                                    <SelectField
                                        label="Eye color"
                                        name="eye_color"
                                        defaultValue={profile?.eye_color ?? ""}
                                        options={EYE_COLORS}
                                        errors={errors.eye_color}
                                    />
                                    <SelectField
                                        label="Ethnicity"
                                        name="ethnicity"
                                        defaultValue={profile?.ethnicity ?? ""}
                                        options={ETHNICITIES}
                                        errors={errors.ethnicity}
                                    />
                                </div>

                                <div className="mt-6 flex flex-wrap gap-6">
                                    <CheckboxField
                                        label="Smoking"
                                        name="smoking"
                                        defaultChecked={
                                            profile?.smoking ?? false
                                        }
                                    />
                                    <CheckboxField
                                        label="Drinking"
                                        name="drinking"
                                        defaultChecked={
                                            profile?.drinking ?? false
                                        }
                                    />
                                </div>
                            </Section>

                            {/* ── Services ────────────────────── */}
                            <Section title="Services offered" icon={Check}>
                                <p className="mb-3 text-sm text-muted-foreground">
                                    Select everything you offer. This is what
                                    clients filter by.
                                </p>

                                {/* hidden inputs so selected services post */}
                                {services.map((s) => (
                                    <input
                                        key={s}
                                        type="hidden"
                                        name="services[]"
                                        value={s}
                                    />
                                ))}

                                <div className="flex flex-wrap gap-2">
                                    {SERVICE_OPTIONS.map((svc) => {
                                        const active = services.includes(svc);
                                        return (
                                            <button
                                                key={svc}
                                                type="button"
                                                onClick={() =>
                                                    toggleService(svc)
                                                }
                                                className={cn(
                                                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                                                    active
                                                        ? "border-brand-pink bg-gradient-brand-soft text-brand-pink"
                                                        : "border-border bg-card text-muted-foreground hover:border-brand-pink/40 hover:text-foreground",
                                                )}
                                            >
                                                {active && (
                                                    <Check className="mr-1 inline h-3 w-3" />
                                                )}
                                                {svc}
                                            </button>
                                        );
                                    })}
                                </div>
                                <InputError
                                    className="mt-2"
                                    message={errors.services}
                                />
                            </Section>

                            {/* ── Rates ───────────────────────── */}
                            <Section title="Rates" icon={MapPin}>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <Label
                                            htmlFor="currency"
                                            className="text-sm font-semibold text-foreground"
                                        >
                                            Currency
                                        </Label>
                                        <div className="mt-2 border-b border-border pb-2 focus-within:border-brand-pink">
                                            <select
                                                id="currency"
                                                name="currency"
                                                defaultValue={
                                                    profile?.currency ?? "KES"
                                                }
                                                className="w-full border-0 bg-transparent p-0 text-base text-foreground outline-none focus:ring-0"
                                            >
                                                {CURRENCIES.map((c) => (
                                                    <option key={c} value={c}>
                                                        {c}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <InputError
                                            className="mt-2"
                                            message={errors.currency}
                                        />
                                    </div>

                                    <TextField
                                        label="15 minutes"
                                        name="rate_15min"
                                        type="number"
                                        min={0}
                                        defaultValue={profile?.rate_15min ?? ""}
                                        errors={errors.rate_15min}
                                    />
                                    <TextField
                                        label="30 minutes"
                                        name="rate_30min"
                                        type="number"
                                        min={0}
                                        defaultValue={profile?.rate_30min ?? ""}
                                        errors={errors.rate_30min}
                                    />
                                    <TextField
                                        label="1 hour"
                                        name="rate_1hour"
                                        type="number"
                                        min={0}
                                        defaultValue={profile?.rate_1hour ?? ""}
                                        errors={errors.rate_1hour}
                                    />
                                    <TextField
                                        label="Overnight"
                                        name="rate_night"
                                        type="number"
                                        min={0}
                                        defaultValue={profile?.rate_night ?? ""}
                                        errors={errors.rate_night}
                                    />
                                </div>
                            </Section>

                            {/* ── Availability ────────────────── */}
                            <Section title="Availability" icon={ShieldCheck}>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <SelectField
                                        label="Status"
                                        name="availability_status"
                                        defaultValue={
                                            profile?.availability_status ??
                                            "offline"
                                        }
                                        options={[
                                            {
                                                value: "online",
                                                label: "Online now",
                                            },
                                            {
                                                value: "incall",
                                                label: "Incall only",
                                            },
                                            {
                                                value: "outcall",
                                                label: "Outcall only",
                                            },
                                            {
                                                value: "offline",
                                                label: "Offline",
                                            },
                                        ]}
                                        errors={errors.availability_status}
                                    />
                                </div>

                                <div className="mt-6 flex flex-wrap gap-6">
                                    <CheckboxField
                                        label="Available now"
                                        name="is_available"
                                        defaultChecked={
                                            profile?.is_available ?? false
                                        }
                                    />
                                    <CheckboxField
                                        label="Incall"
                                        name="incall"
                                        defaultChecked={
                                            profile?.incall ?? false
                                        }
                                    />
                                    <CheckboxField
                                        label="Outcall"
                                        name="outcall"
                                        defaultChecked={
                                            profile?.outcall ?? false
                                        }
                                    />
                                </div>
                            </Section>

                            {/* ── Photos ──────────────────────── */}
                            <Section title="Photos" icon={Camera}>
                                {/* Cover */}
                                <div>
                                    <Label className="text-sm font-semibold text-foreground">
                                        Cover photo
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        The main image on your profile card.
                                    </p>
                                    <div className="mt-3">
                                        <label className="flex aspect-[4/3] w-full max-w-xs cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/40 transition hover:border-brand-pink/40">
                                            {coverPreview ? (
                                                <img
                                                    src={coverPreview}
                                                    alt="Cover preview"
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                    <Camera className="h-6 w-6" />
                                                    <span className="text-xs font-medium">
                                                        Upload cover
                                                    </span>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                name="cover_image"
                                                accept="image/*"
                                                onChange={handleCoverChange}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                    <InputError
                                        className="mt-2"
                                        message={errors.cover_image}
                                    />
                                </div>

                                {/* Gallery */}
                                <div className="mt-8">
                                    <Label className="text-sm font-semibold text-foreground">
                                        Gallery (up to 8)
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Show more of yourself — full body,
                                        outfits, vibe.
                                    </p>

                                    <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                                        {galleryPreview.map((url, i) => (
                                            <div
                                                key={i}
                                                className="group relative aspect-square overflow-hidden rounded-xl border border-border"
                                            >
                                                <img
                                                    src={url}
                                                    alt={`Gallery ${i + 1}`}
                                                    className="h-full w-full object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeGalleryImage(i)
                                                    }
                                                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}

                                        {galleryPreview.length < 8 && (
                                            <label className="flex aspect-square cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/40 text-muted-foreground transition hover:border-brand-pink/40">
                                                <ImageIcon className="h-5 w-5" />
                                                <input
                                                    type="file"
                                                    name="gallery[]"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={
                                                        handleGalleryChange
                                                    }
                                                    className="hidden"
                                                />
                                            </label>
                                        )}
                                    </div>
                                    <InputError
                                        className="mt-2"
                                        message={errors.gallery}
                                    />
                                </div>

                                {progress && (
                                    <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                        <div
                                            className="h-full bg-gradient-brand transition-all"
                                            style={{
                                                width: `${progress.percentage}%`,
                                            }}
                                        />
                                    </div>
                                )}
                            </Section>

                            {/* ── Submit ──────────────────────── */}
                            <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-xs text-muted-foreground">
                                    By submitting you agree to our community
                                    guidelines.
                                </p>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-full bg-gradient-brand px-8 py-2.5 text-sm font-bold text-white shadow-glow-pink transition-all hover:scale-[1.02] hover:shadow-glow-pink-strong"
                                >
                                    {isEditing
                                        ? "Save changes"
                                        : "Submit for review"}
                                    <ChevronRight className="ml-1 h-4 w-4" />
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

// ── Small reusable field components ──────────────────────────────

function Section({
    title,
    icon: Icon,
    children,
}: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
}) {
    return (
        <section>
            <div className="mb-4 flex items-center gap-2">
                <Icon className="h-4 w-4 text-brand-pink" />
                <h3 className="text-lg font-semibold text-foreground">
                    {title}
                </h3>
            </div>
            {children}
        </section>
    );
}

function TextField({
    label,
    name,
    type = "text",
    min,
    max,
    defaultValue,
    errors,
}: {
    label: string;
    name: string;
    type?: string;
    min?: number;
    max?: number;
    defaultValue?: string | number;
    errors?: string;
}) {
    return (
        <div className="space-y-2">
            <Label
                htmlFor={name}
                className="text-sm font-semibold text-foreground"
            >
                {label}
            </Label>
            <div className="border-b border-border pb-2 focus-within:border-brand-pink">
                <Input
                    id={name}
                    name={name}
                    type={type}
                    min={min}
                    max={max}
                    defaultValue={defaultValue}
                    className="w-full border-0 bg-transparent p-0 text-base text-foreground shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
            </div>
            <InputError className="mt-1" message={errors} />
        </div>
    );
}

function SelectField({
    label,
    name,
    defaultValue,
    options,
    errors,
}: {
    label: string;
    name: string;
    defaultValue?: string;
    options: (string | { value: string; label: string })[];
    errors?: string;
}) {
    const normalized = options.map((o) =>
        typeof o === "string" ? { value: o, label: o } : o,
    );
    return (
        <div className="space-y-2">
            <Label
                htmlFor={name}
                className="text-sm font-semibold text-foreground"
            >
                {label}
            </Label>
            <div className="border-b border-border pb-2 focus-within:border-brand-pink">
                <select
                    id={name}
                    name={name}
                    defaultValue={defaultValue}
                    className="w-full border-0 bg-transparent p-0 text-base text-foreground outline-none focus:ring-0"
                >
                    <option value="">Prefer not to say</option>
                    {normalized.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
            </div>
            <InputError className="mt-1" message={errors} />
        </div>
    );
}

function CheckboxField({
    label,
    name,
    defaultChecked,
}: {
    label: string;
    name: string;
    defaultChecked?: boolean;
}) {
    return (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
                type="checkbox"
                name={name}
                value="1"
                defaultChecked={defaultChecked}
                className="h-4 w-4 accent-brand-pink"
            />
            {label}
        </label>
    );
}
