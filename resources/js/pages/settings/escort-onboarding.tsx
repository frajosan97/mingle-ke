// resources/js/pages/settings/escort-onboarding.tsx
import { Form, Head, Link } from "@inertiajs/react";
import { useMemo, useState } from "react";
import Select from "react-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import InputError from "@/components/input-error";
import { buildSelectStyles } from "@/components/ui/select-styles";
import { cn } from "@/lib/utils";
import {
    ArrowLeft,
    Camera,
    Check,
    ChevronRight,
    Coins,
    Image as ImageIcon,
    MapPin,
    ShieldCheck,
    Sparkles,
    User as UserIcon,
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

type Option = { value: string; label: string };

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
const AVAILABILITY_STATUSES: Option[] = [
    { value: "online", label: "Online now" },
    { value: "incall", label: "Incall only" },
    { value: "outcall", label: "Outcall only" },
    { value: "offline", label: "Offline" },
];

const toOptions = (arr: string[]): Option[] =>
    arr.map((v) => ({ value: v, label: v }));

const selectStyles = buildSelectStyles<Option, false>({ menuIsPortal: false });

// ── Tabs ─────────────────────────────────────────────────────────
const TABS = [
    { id: "appearance", label: "Appearance", icon: Sparkles },
    { id: "services", label: "Services", icon: Check },
    { id: "rates", label: "Rates", icon: Coins },
    { id: "availability", label: "Availability", icon: ShieldCheck },
    { id: "photos", label: "Photos", icon: Camera },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ── Field wrapper ────────────────────────────────────────────────
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

// ── Reusable React-Select field ──────────────────────────────────
function SelectField({
    label,
    name,
    defaultValue,
    options,
    error,
    placeholder = "Prefer not to say",
    icon,
}: {
    label: string;
    name: string;
    defaultValue?: string | null;
    options: Option[];
    error?: string;
    placeholder?: string;
    icon?: React.ComponentType<{ className?: string }>;
}) {
    const current = options.find((o) => o.value === defaultValue) ?? null;
    return (
        <Field label={label} htmlFor={name} icon={icon} error={error}>
            <Select<Option, false>
                inputId={name}
                name={name}
                options={options}
                defaultValue={current}
                placeholder={placeholder}
                isClearable
                isSearchable={false}
                styles={selectStyles}
                menuPosition="fixed"
                menuShouldScrollIntoView={false}
            />
        </Field>
    );
}

// ── Checkbox field ───────────────────────────────────────────────
function CheckboxField({
    label,
    name,
    defaultChecked,
    description,
}: {
    label: string;
    name: string;
    defaultChecked?: boolean;
    description?: string;
}) {
    return (
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background p-3 transition hover:border-brand-pink/40">
            <input
                type="checkbox"
                name={name}
                value="1"
                defaultChecked={defaultChecked}
                className="mt-0.5 h-4 w-4 accent-brand-pink"
            />
            <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">
                    {label}
                </span>
                {description && (
                    <span className="block text-xs text-muted-foreground">
                        {description}
                    </span>
                )}
            </span>
        </label>
    );
}

// ── Component ────────────────────────────────────────────────────
export default function EscortOnboarding({ profile }: Props) {
    const isEditing = profile !== null;

    const [activeTab, setActiveTab] = useState<TabId>("appearance");
    const [services, setServices] = useState<string[]>(profile?.services ?? []);
    const [galleryPreview, setGalleryPreview] = useState<string[]>(
        profile?.gallery_urls ?? [],
    );
    const [coverPreview, setCoverPreview] = useState<string | null>(
        profile?.cover_image_url ?? null,
    );
    const [removedGallery, setRemovedGallery] = useState<string[]>([]);

    const allSelected = services.length === SERVICE_OPTIONS.length;

    function toggleService(svc: string) {
        setServices((prev) =>
            prev.includes(svc) ? prev.filter((s) => s !== svc) : [...prev, svc],
        );
    }

    function toggleAllServices() {
        setServices(allSelected ? [] : [...SERVICE_OPTIONS]);
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
                            <h2 className="text-2xl font-bold tracking-tight text-foreground">
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
                                "mt-4 flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm",
                                profile.is_approved
                                    ? "border-brand-green/30 bg-brand-green/5 text-brand-green"
                                    : "border-amber-500/30 bg-amber-500/5 text-foreground",
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
                    className="space-y-8"
                >
                    {({ processing, errors, progress }) => (
                        <>
                            {removedGallery.map((url, i) => (
                                <input
                                    key={i}
                                    type="hidden"
                                    name={`removed_gallery[${i}]`}
                                    value={url}
                                />
                            ))}

                            {/* ── Tabs bar ────────────────────── */}
                            <div className="border-b border-border">
                                <nav
                                    className="-mb-px flex gap-1 overflow-x-auto scrollbar-hidden"
                                    aria-label="Profile sections"
                                >
                                    {TABS.map((tab) => {
                                        const active = activeTab === tab.id;
                                        const Icon = tab.icon;
                                        return (
                                            <button
                                                key={tab.id}
                                                type="button"
                                                onClick={() =>
                                                    setActiveTab(tab.id)
                                                }
                                                className={cn(
                                                    "inline-flex shrink-0 items-center gap-2 rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                                                    active
                                                        ? "border-brand-pink text-foreground"
                                                        : "border-transparent text-muted-foreground hover:text-foreground",
                                                )}
                                            >
                                                <Icon className="h-4 w-4" />
                                                {tab.label}
                                            </button>
                                        );
                                    })}
                                </nav>
                            </div>

                            {/* ── Appearance ──────────────────── */}
                            {activeTab === "appearance" && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <SelectField
                                            label="Orientation"
                                            name="orientation"
                                            defaultValue={profile?.orientation}
                                            options={toOptions(ORIENTATIONS)}
                                            error={errors.orientation}
                                            icon={UserIcon}
                                        />
                                        <SelectField
                                            label="Body type"
                                            name="body_type"
                                            defaultValue={profile?.body_type}
                                            options={toOptions(BODY_TYPES)}
                                            error={errors.body_type}
                                        />
                                        <Field
                                            label="Height (cm)"
                                            htmlFor="height_cm"
                                            error={errors.height_cm}
                                        >
                                            <Input
                                                id="height_cm"
                                                name="height_cm"
                                                type="number"
                                                min={100}
                                                max={250}
                                                defaultValue={
                                                    profile?.height_cm ?? ""
                                                }
                                                placeholder="e.g. 170"
                                            />
                                        </Field>
                                        <Field
                                            label="Weight (kg)"
                                            htmlFor="weight_kg"
                                            error={errors.weight_kg}
                                        >
                                            <Input
                                                id="weight_kg"
                                                name="weight_kg"
                                                type="number"
                                                min={30}
                                                max={200}
                                                defaultValue={
                                                    profile?.weight_kg ?? ""
                                                }
                                                placeholder="e.g. 60"
                                            />
                                        </Field>
                                        <SelectField
                                            label="Hair color"
                                            name="hair_color"
                                            defaultValue={profile?.hair_color}
                                            options={toOptions(HAIR_COLORS)}
                                            error={errors.hair_color}
                                        />
                                        <SelectField
                                            label="Eye color"
                                            name="eye_color"
                                            defaultValue={profile?.eye_color}
                                            options={toOptions(EYE_COLORS)}
                                            error={errors.eye_color}
                                        />
                                        <SelectField
                                            label="Ethnicity"
                                            name="ethnicity"
                                            defaultValue={profile?.ethnicity}
                                            options={toOptions(ETHNICITIES)}
                                            error={errors.ethnicity}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                                </div>
                            )}

                            {/* ── Services ────────────────────── */}
                            {activeTab === "services" && (
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <p className="text-sm text-muted-foreground">
                                            Select everything you offer. This is
                                            what clients filter by.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={toggleAllServices}
                                            className={cn(
                                                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                                                allSelected
                                                    ? "border-brand-pink bg-gradient-brand-soft text-brand-pink"
                                                    : "border-border bg-card text-foreground hover:border-brand-pink/40",
                                            )}
                                        >
                                            {allSelected
                                                ? "Clear all"
                                                : "Select all"}
                                        </button>
                                    </div>

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
                                            const active =
                                                services.includes(svc);
                                            return (
                                                <button
                                                    key={svc}
                                                    type="button"
                                                    onClick={() =>
                                                        toggleService(svc)
                                                    }
                                                    className={cn(
                                                        "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
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
                                    <InputError message={errors.services} />
                                </div>
                            )}

                            {/* ── Rates ───────────────────────── */}
                            {activeTab === "rates" && (
                                <div className="space-y-6">
                                    <SelectField
                                        label="Currency"
                                        name="currency"
                                        defaultValue={
                                            profile?.currency ?? "KES"
                                        }
                                        options={toOptions(CURRENCIES)}
                                        error={errors.currency}
                                        placeholder="Select currency"
                                    />

                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <Field
                                            label="15 minutes"
                                            htmlFor="rate_15min"
                                            error={errors.rate_15min}
                                        >
                                            <Input
                                                id="rate_15min"
                                                name="rate_15min"
                                                type="number"
                                                min={0}
                                                defaultValue={
                                                    profile?.rate_15min ?? ""
                                                }
                                                placeholder="0"
                                            />
                                        </Field>
                                        <Field
                                            label="30 minutes"
                                            htmlFor="rate_30min"
                                            error={errors.rate_30min}
                                        >
                                            <Input
                                                id="rate_30min"
                                                name="rate_30min"
                                                type="number"
                                                min={0}
                                                defaultValue={
                                                    profile?.rate_30min ?? ""
                                                }
                                                placeholder="0"
                                            />
                                        </Field>
                                        <Field
                                            label="1 hour"
                                            htmlFor="rate_1hour"
                                            error={errors.rate_1hour}
                                        >
                                            <Input
                                                id="rate_1hour"
                                                name="rate_1hour"
                                                type="number"
                                                min={0}
                                                defaultValue={
                                                    profile?.rate_1hour ?? ""
                                                }
                                                placeholder="0"
                                            />
                                        </Field>
                                        <Field
                                            label="Overnight"
                                            htmlFor="rate_night"
                                            error={errors.rate_night}
                                        >
                                            <Input
                                                id="rate_night"
                                                name="rate_night"
                                                type="number"
                                                min={0}
                                                defaultValue={
                                                    profile?.rate_night ?? ""
                                                }
                                                placeholder="0"
                                            />
                                        </Field>
                                    </div>
                                </div>
                            )}

                            {/* ── Availability ────────────────── */}
                            {activeTab === "availability" && (
                                <div className="space-y-6">
                                    <SelectField
                                        label="Status"
                                        name="availability_status"
                                        defaultValue={
                                            profile?.availability_status ??
                                            "offline"
                                        }
                                        options={AVAILABILITY_STATUSES}
                                        error={errors.availability_status}
                                        icon={MapPin}
                                        placeholder="Select status"
                                    />

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                        <CheckboxField
                                            label="Available now"
                                            name="is_available"
                                            defaultChecked={
                                                profile?.is_available ?? false
                                            }
                                            description="Show as online right now."
                                        />
                                        <CheckboxField
                                            label="Incall"
                                            name="incall"
                                            defaultChecked={
                                                profile?.incall ?? false
                                            }
                                            description="Clients come to you."
                                        />
                                        <CheckboxField
                                            label="Outcall"
                                            name="outcall"
                                            defaultChecked={
                                                profile?.outcall ?? false
                                            }
                                            description="You travel to clients."
                                        />
                                    </div>
                                </div>
                            )}

                            {/* ── Photos ──────────────────────── */}
                            {activeTab === "photos" && (
                                <div className="space-y-8">
                                    {/* Cover */}
                                    <div>
                                        <Label className="text-sm font-medium text-foreground">
                                            Cover photo
                                        </Label>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            The main image on your profile card.
                                        </p>
                                        <div className="mt-3">
                                            <label className="flex aspect-[4/3] w-full max-w-xs cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/40 transition hover:border-brand-pink/40">
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
                                            message={errors.cover_image}
                                        />
                                    </div>

                                    {/* Gallery */}
                                    <div>
                                        <Label className="text-sm font-medium text-foreground">
                                            Gallery (up to 8)
                                        </Label>
                                        <p className="mt-1 text-xs text-muted-foreground">
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
                                                            removeGalleryImage(
                                                                i,
                                                            )
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
                                        <InputError message={errors.gallery} />
                                    </div>

                                    {progress && (
                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                            <div
                                                className="h-full bg-gradient-brand transition-all"
                                                style={{
                                                    width: `${progress.percentage}%`,
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── Submit ──────────────────────── */}
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
