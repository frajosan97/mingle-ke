// resources/js/types/message-input.ts
export type AttachmentCategory =
    | "image"
    | "video"
    | "audio"
    | "document"
    | "archive";

export interface PendingFile {
    file: File;
    url: string;
    category: AttachmentCategory;
}

export interface StickerAsset {
    name: string;
    url: string;
    size: number;
    mtime: number;
}

export const isStickerAsset = (x: any): x is StickerAsset =>
    x && typeof x.url === "string" && typeof x.name === "string";

export const categoryForFile = (file: File): AttachmentCategory => {
    const type = file.type.toLowerCase();
    if (type.startsWith("image/")) return "image";
    if (type.startsWith("video/")) return "video";
    if (type.startsWith("audio/")) return "audio";

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (ext === "zip") return "archive";
    if (
        [
            "doc", "docx", "xls", "xlsx", "ppt", "pptx",
            "pdf", "txt", "csv", "odt", "ods", "odp", "rtf",
        ].includes(ext)
    )
        return "document";
    if (["mp4", "mov", "avi", "webm", "mkv", "m4v", "3gp"].includes(ext))
        return "video";
    if (["mp3", "m4a", "ogg", "oga", "wav", "wave", "aac", "amr"].includes(ext))
        return "audio";
    if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext))
        return "image";
    return "document";
};

export const isImageFile = (file: File) => file.type.startsWith("image/");
export const isVideoFile = (file: File) => file.type.startsWith("video/");
export const isAudioFile = (file: File) => file.type.startsWith("audio/");