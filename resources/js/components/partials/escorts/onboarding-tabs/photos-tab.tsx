// resources/js/components/partials/escort-onboarding/tabs/photos-tab.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
    Camera,
    ImagePlus,
    Loader2,
    Star,
    Trash2,
    UploadCloud,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import InputError from "@/components/input-error";
import { cn } from "@/lib/utils";
import { useFileDrop } from "@/hooks/use-file-drop";

import {
    MAX_GALLERY_IMAGES as MAX_IMAGES,
    MAX_IMAGE_BYTES as MAX_BYTES,
} from "@/types/escort";

type Props = {
    galleryFiles: File[];
    onGalleryChange: (files: File[]) => void;
    existingGallery: string[];
    removedImages: string[];
    onRemoveExisting: (url: string) => void;
    coverIndex: number | null;
    onCoverIndexChange: (index: number | null) => void;
    coverExistingUrl: string | null;
    onCoverExistingChange: (url: string | null) => void;
    errors: Record<string, string>;
    progress: number | undefined;
};

export default function PhotosTab({
    galleryFiles,
    onGalleryChange,
    existingGallery,
    removedImages,
    onRemoveExisting,
    coverIndex,
    onCoverIndexChange,
    coverExistingUrl,
    onCoverExistingChange,
    errors,
    progress,
}: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [localError, setLocalError] = useState<string | null>(null);

    // Revoke object URLs when files change / unmount
    const objectUrls = useMemo(
        () => galleryFiles.map((f) => URL.createObjectURL(f)),
        [galleryFiles],
    );
    useEffect(
        () => () => objectUrls.forEach((u) => URL.revokeObjectURL(u)),
        [objectUrls],
    );

    const visibleExisting = existingGallery.filter(
        (u) => !removedImages.includes(u),
    );
    const totalSlots = visibleExisting.length + galleryFiles.length;
    const remaining = MAX_IMAGES - totalSlots;

    function addFiles(incoming: File[]) {
        setLocalError(null);
        const accepted: File[] = [];
        for (const f of incoming) {
            if (!f.type.startsWith("image/")) {
                setLocalError("Only image files are allowed.");
                continue;
            }
            if (f.size > MAX_BYTES) {
                setLocalError(`"${f.name}" exceeds 5 MB.`);
                continue;
            }
            if (
                visibleExisting.length +
                    galleryFiles.length +
                    accepted.length >=
                MAX_IMAGES
            ) {
                setLocalError(`You can upload up to ${MAX_IMAGES} images.`);
                break;
            }
            accepted.push(f);
        }
        if (accepted.length) onGalleryChange([...galleryFiles, ...accepted]);
    }

    const drop = useFileDrop(addFiles);

    function pickCoverExisting(url: string) {
        onCoverExistingChange(url);
        onCoverIndexChange(null); // files take precedence only when explicitly chosen
    }

    function pickCoverNew(index: number) {
        onCoverIndexChange(index);
        onCoverExistingChange(null);
    }

    function removeNew(index: number) {
        const next = galleryFiles.filter((_, i) => i !== index);
        onGalleryChange(next);
        if (coverIndex === index) onCoverIndexChange(null);
        else if (coverIndex !== null && coverIndex > index)
            onCoverIndexChange(coverIndex - 1);
    }

    function removeExisting(url: string) {
        onRemoveExisting(url);
        if (coverExistingUrl === url) onCoverExistingChange(null);
    }

    return (
        <div className="space-y-8">
            {/* Dropzone */}
            <div>
                <Label className="text-sm font-medium text-foreground">
                    Photos
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">
                    Drag & drop or click to select. Up to {MAX_IMAGES} images,
                    max 5 MB each.
                </p>

                <div
                    {...drop}
                    onClick={() => inputRef.current?.click()}
                    className={cn(
                        "mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition",
                        drop.isDragging
                            ? "border-brand-pink bg-brand-pink/5"
                            : "border-border bg-muted/40 hover:border-brand-pink/40",
                    )}
                >
                    <UploadCloud className="h-7 w-7 text-muted-foreground" />
                    <p className="text-sm font-medium">
                        Drop images here or{" "}
                        <span className="text-brand-pink">browse</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {remaining > 0
                            ? `${remaining} slot${remaining === 1 ? "" : "s"} remaining`
                            : "Gallery is full — remove one to add another"}
                    </p>
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                            const files = Array.from(e.target.files ?? []);
                            if (files.length) addFiles(files);
                            e.target.value = "";
                        }}
                    />
                </div>
                <InputError message={localError ?? errors.gallery} />
                <InputError message={errors.cover_image} />
            </div>

            {/* Gallery grid */}
            {(visibleExisting.length > 0 || galleryFiles.length > 0) && (
                <div>
                    <Label className="text-sm font-medium text-foreground">
                        Gallery
                    </Label>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Click the <Star className="inline h-3 w-3" /> to set an
                        image as your cover.
                    </p>

                    <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                        {visibleExisting.map((url) => {
                            const isCover = coverExistingUrl === url;
                            return (
                                <Tile
                                    key={url}
                                    src={url}
                                    isCover={isCover}
                                    onSetCover={() => pickCoverExisting(url)}
                                    onRemove={() => removeExisting(url)}
                                />
                            );
                        })}

                        {galleryFiles.map((f, i) => {
                            const isCover = coverIndex === i;
                            return (
                                <Tile
                                    key={`${f.name}-${i}`}
                                    src={objectUrls[i]}
                                    isCover={isCover}
                                    onSetCover={() => pickCoverNew(i)}
                                    onRemove={() => removeNew(i)}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {progress !== undefined && (
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
        </div>
    );
}

/* -------------------------------------------------------------------------- */

function Tile({
    src,
    isCover,
    onSetCover,
    onRemove,
}: {
    src: string;
    isCover: boolean;
    onSetCover: () => void;
    onRemove: () => void;
}) {
    return (
        <div
            className={cn(
                "group relative aspect-square overflow-hidden rounded-xl border transition",
                isCover
                    ? "border-brand-pink ring-2 ring-brand-pink/40"
                    : "border-border",
            )}
        >
            <img src={src} alt="" className="h-full w-full object-cover" />

            {isCover && (
                <span className="absolute left-1 top-1 rounded-full bg-brand-pink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Cover
                </span>
            )}

            <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition group-hover:opacity-100">
                {!isCover && (
                    <button
                        type="button"
                        onClick={onSetCover}
                        title="Set as cover"
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-brand-pink"
                    >
                        <Star className="h-3 w-3" />
                    </button>
                )}
                <button
                    type="button"
                    onClick={onRemove}
                    title="Remove"
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-destructive"
                >
                    <Trash2 className="h-3 w-3" />
                </button>
            </div>
        </div>
    );
}
