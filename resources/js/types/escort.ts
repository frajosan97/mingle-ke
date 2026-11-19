// resources/js/types/escort.ts
export type AvailabilityStatus =
    | "online"
    | "busy"
    | "incall"
    | "outcall"
    | "offline";

export interface EscortProfile {
    // Appearance
    orientation: string | null;
    height_cm: number | null;
    weight_kg: number | null;
    body_type: string | null;
    hair_color: string | null;
    eye_color: string | null;
    ethnicity: string | null;

    // Services
    services: string[];
    smoking: boolean;
    drinking: boolean;

    // Rates
    rate_15min: number | null;
    rate_30min: number | null;
    rate_1hour: number | null;
    rate_night: number | null;
    currency: string;

    // Availability
    is_available: boolean;
    availability_status: AvailabilityStatus;
    incall: boolean;
    outcall: boolean;

    // Media (read-only projection from UserImage / UserVideo)
    cover_image_url: string | null;
    gallery_urls: string[];
    video_urls: string[];

    // Moderation
    is_approved: boolean;
    is_featured: boolean;
}

export interface EscortOnboardingProps {
    profile: EscortProfile | null;
}

/* -------------------------------------------------------------------------- */
/* Form shape used by the onboarding page                                     */
/* -------------------------------------------------------------------------- */

/**
 * The editable form data for escort onboarding.
 *
 * Media fields (gallery/videos/cover selection) live outside `useForm`
 * in local component state, because File objects cannot be reliably
 * serialized by Inertia's form helper without `forceFormData`.
 *
 * `cover_index`           — index into `gallery` File[] to promote as cover
 * `cover_existing_url`    — an already-uploaded image URL to promote as cover
 */
export interface EscortOnboardingFormData {
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
    availability_status: AvailabilityStatus;
    incall: boolean;
    outcall: boolean;
    cover_index: number | null;
    cover_existing_url: string | null;
}

/* -------------------------------------------------------------------------- */
/* Uploaded media (for tab components)                                        */
/* -------------------------------------------------------------------------- */

export interface UploadedImage {
    /** Existing URL (server-side image) — mutually exclusive with `file` */
    url: string | null;
    /** Freshly selected File — mutually exclusive with `url` */
    file: File | null;
    isCover: boolean;
}

export interface UploadedVideo {
    url: string | null;
    file: File | null;
}

/* -------------------------------------------------------------------------- */
/* Option helpers                                                             */
/* -------------------------------------------------------------------------- */

export type Option = { value: string; label: string };

export const toOptions = (arr: readonly string[]): Option[] =>
    arr.map((v) => ({ value: v, label: v }));

/* -------------------------------------------------------------------------- */
/* Static option lists                                                        */
/* -------------------------------------------------------------------------- */

export const BODY_TYPES = [
    "Slim",
    "Athletic",
    "Average",
    "Curvy",
    "Muscular",
    "Plus-size",
] as const;

export const HAIR_COLORS = [
    "Black",
    "Brown",
    "Blonde",
    "Red",
    "Other",
] as const;

export const EYE_COLORS = [
    "Brown",
    "Black",
    "Blue",
    "Green",
    "Hazel",
    "Other",
] as const;

export const ETHNICITIES = [
    "African",
    "Asian",
    "Caucasian",
    "Hispanic",
    "Middle Eastern",
    "Mixed",
    "Other",
] as const;

export const ORIENTATIONS = [
    "Straight",
    "Bisexual",
    "Lesbian",
    "Gay",
    "Pansexual",
    "Other",
] as const;

export const SERVICE_OPTIONS = [
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
] as const;

export const CURRENCIES = ["KES", "USD", "EUR", "GBP", "UGX", "TZS"] as const;

export const AVAILABILITY_STATUSES: Option[] = [
    { value: "online", label: "Online now" },
    { value: "busy", label: "Busy" },
    { value: "incall", label: "Incall only" },
    { value: "outcall", label: "Outcall only" },
    { value: "offline", label: "Offline" },
];

/* -------------------------------------------------------------------------- */
/* Upload constraints (mirror backend validation)                             */
/* -------------------------------------------------------------------------- */

export const MAX_GALLERY_IMAGES = 8;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

export const MAX_VIDEOS = 3;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB
export const ACCEPTED_VIDEO_MIME: readonly string[] = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
];