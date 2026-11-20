// resources/js/pages/settings/escort/create.tsx
import { Head, useForm } from "@inertiajs/react";
import { useState } from "react";
import {
    ChevronRight,
    ShieldCheck,
    Sparkles,
    Check,
    Coins,
    Camera,
    Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";
import type { EscortOnboardingProps } from "@/types/escort";
import AppearanceTab from "@/components/partials/escorts/onboarding-tabs/appearance-tab";
import ServicesTab from "@/components/partials/escorts/onboarding-tabs/services-tab";
import RatesTab from "@/components/partials/escorts/onboarding-tabs/rates-tab";
import AvailabilityTab from "@/components/partials/escorts/onboarding-tabs/availability-tab";
import PhotosTab from "@/components/partials/escorts/onboarding-tabs/photos-tab";
import VideosTab from "@/components/partials/escorts/onboarding-tabs/videos-tab";

const TABS = [
    { id: "appearance", label: "Appearance", icon: Sparkles },
    { id: "services", label: "Services", icon: Check },
    { id: "rates", label: "Rates", icon: Coins },
    { id: "availability", label: "Availability", icon: ShieldCheck },
    { id: "photos", label: "Photos", icon: Camera },
    { id: "videos", label: "Videos", icon: Video },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function EscortOnboarding({ profile }: EscortOnboardingProps) {
    const isEditing = profile !== null;
    const [activeTab, setActiveTab] = useState<TabId>("appearance");

    const form = useForm({
        orientation: profile?.orientation ?? null,
        body_type: profile?.body_type ?? null,
        height_cm: profile?.height_cm ?? null,
        weight_kg: profile?.weight_kg ?? null,
        hair_color: profile?.hair_color ?? null,
        eye_color: profile?.eye_color ?? null,
        ethnicity: profile?.ethnicity ?? null,
        smoking: profile?.smoking ?? false,
        drinking: profile?.drinking ?? false,
        services: profile?.services ?? [],
        currency: profile?.currency ?? "KES",
        rate_15min: profile?.rate_15min ?? null,
        rate_30min: profile?.rate_30min ?? null,
        rate_1hour: profile?.rate_1hour ?? null,
        rate_night: profile?.rate_night ?? null,
        availability_status: profile?.availability_status ?? "offline",
        is_available: profile?.is_available ?? false,
        incall: profile?.incall ?? false,
        outcall: profile?.outcall ?? false,

        // media
        cover_index: null as number | null,
        cover_existing_url: null as string | null,
    });

    // Image uploads
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
    const [removedImages, setRemovedImages] = useState<string[]>([]);

    // Video uploads
    const [videoFiles, setVideoFiles] = useState<File[]>([]);
    const [removedVideos, setRemovedVideos] = useState<string[]>([]);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.transform((data) => ({
            ...data,
            gallery: galleryFiles,
            removed_images: removedImages,
            videos: videoFiles,
            removed_videos: removedVideos,
            _method: isEditing ? "put" : "post",
        }));
        form.post("/escorts", {
            preserveScroll: true,
            forceFormData: true,
        });
    }

    return (
        <>
            <Head
                title={isEditing ? "Manage escort profile" : "Become an escort"}
            />

            <div className="space-y-10 pb-8">
                <PageHeader
                    title={
                        isEditing
                            ? "Manage your escort profile"
                            : "Become an escort"
                    }
                    description={
                        isEditing
                            ? "Keep your rates, services and availability up to date. Changes go live immediately."
                            : "Fill in your details below. Your profile will be reviewed and usually approved within 24 hours."
                    }
                    backHref="/settings"
                    backHrefTitle="Back to Settings"
                />

                <form
                    onSubmit={submit}
                    className="space-y-8"
                    encType="multipart/form-data"
                >
                    <div className="border-b border-border pb-4">
                        <nav
                            className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6"
                            aria-label="Profile sections"
                        >
                            {TABS.map((tab) => {
                                const active = activeTab === tab.id;
                                const Icon = tab.icon;

                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={cn(
                                            "flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-medium transition-colors",
                                            active
                                                ? "border-brand-pink bg-brand-pink/10 text-foreground"
                                                : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground",
                                        )}
                                    >
                                        <Icon className="h-4 w-4 shrink-0" />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {activeTab === "appearance" && (
                        <AppearanceTab
                            value={form.data}
                            errors={form.errors}
                            onChange={form.setData}
                        />
                    )}
                    {activeTab === "services" && (
                        <ServicesTab
                            services={form.data.services}
                            onChange={(v) => form.setData("services", v)}
                            error={form.errors.services}
                        />
                    )}
                    {activeTab === "rates" && (
                        <RatesTab
                            value={form.data}
                            errors={form.errors}
                            onChange={form.setData}
                        />
                    )}
                    {activeTab === "availability" && (
                        <AvailabilityTab
                            value={form.data}
                            errors={form.errors}
                            onChange={form.setData}
                        />
                    )}
                    {activeTab === "photos" && (
                        <PhotosTab
                            galleryFiles={galleryFiles}
                            onGalleryChange={setGalleryFiles}
                            existingGallery={profile?.gallery_urls ?? []}
                            removedImages={removedImages}
                            onRemoveExisting={(url) =>
                                setRemovedImages((r) => [...r, url])
                            }
                            coverIndex={form.data.cover_index}
                            onCoverIndexChange={(i) =>
                                form.setData("cover_index", i)
                            }
                            coverExistingUrl={form.data.cover_existing_url}
                            onCoverExistingChange={(url) =>
                                form.setData("cover_existing_url", url)
                            }
                            errors={form.errors as Record<string, string>}
                            progress={form.progress?.percentage}
                        />
                    )}
                    {activeTab === "videos" && (
                        <VideosTab
                            videoFiles={videoFiles}
                            onVideoChange={setVideoFiles}
                            existingVideos={profile?.video_urls ?? []}
                            removedVideos={removedVideos}
                            onRemoveExisting={(url) =>
                                setRemovedVideos((r) => [...r, url])
                            }
                            errors={form.errors as Record<string, string>}
                            progress={form.progress?.percentage}
                        />
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-muted-foreground">
                            By submitting you agree to our community guidelines.
                        </p>
                        <Button
                            type="submit"
                            disabled={form.processing}
                            className="rounded-full bg-primary px-8 py-2.5 text-sm font-bold text-white shadow-glow-pink transition-all hover:scale-[1.02] hover:shadow-glow-pink-strong"
                        >
                            {isEditing ? "Save changes" : "Submit for review"}
                            <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
