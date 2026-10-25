// resources/js/lib/conversation/attachments.ts
import type { ConversationMessage, MessageAttachment } from "@/types";

export type AttachmentWithUrl = MessageAttachment & { url: string };

export function hasUsableUrl(a: MessageAttachment): a is AttachmentWithUrl {
    return typeof a.url === "string" && a.url.trim().length > 0;
}

export function getAttachmentType(
    a: MessageAttachment,
): "image" | "video" | "audio" | "file" {
    const type = String(a.type ?? "").toLowerCase();
    if (
        type === "image" ||
        type === "video" ||
        type === "audio" ||
        type === "file"
    ) {
        return type;
    }
    const mime = a.mime_type?.toLowerCase() ?? "";
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("video/")) return "video";
    if (mime.startsWith("audio/")) return "audio";
    return "file";
}

export interface ClassifiedAttachments {
    /** All attachments that have a resolvable URL, in display order. */
    withUrl: AttachmentWithUrl[];
    /** Images + videos that have a URL. */
    imagesAndVideos: AttachmentWithUrl[];
    /** Audio attachments with a URL. */
    audio: AttachmentWithUrl[];
    /** Documents / archives with a URL. */
    files: AttachmentWithUrl[];
    /** Attachments that exist but have no URL (broken state). */
    missingUrl: MessageAttachment[];
    /** True if the bubble is *only* an image/video with no text. */
    onlyMedia: boolean;
    /** True if the bubble is a single webp sticker (WhatsApp/Telegram style). */
    isSticker: boolean;
}

export function classifyAttachments(
    message: ConversationMessage,
    hasBody: boolean,
): ClassifiedAttachments {
    const list = [...(message.attachments ?? [])].sort((a, b) => {
        const pos = (a.position ?? 0) - (b.position ?? 0);
        return pos !== 0 ? pos : (a.id ?? 0) - (b.id ?? 0);
    });

    const usable = list.filter(hasUsableUrl);
    const imagesAndVideos = usable.filter((a) => {
        const t = getAttachmentType(a);
        return t === "image" || t === "video";
    });
    const audio = usable.filter((a) => getAttachmentType(a) === "audio");
    const files = usable.filter((a) => getAttachmentType(a) === "file");
    const missingUrl = list.filter((a) => !hasUsableUrl(a));

    const onlyMedia =
        imagesAndVideos.length > 0 &&
        !hasBody &&
        audio.length === 0 &&
        files.length === 0 &&
        missingUrl.length === 0 &&
        !message.replyTo;

    const isSticker =
        onlyMedia &&
        imagesAndVideos.length === 1 &&
        Boolean(
            imagesAndVideos[0].mime_type?.includes("webp") ||
            imagesAndVideos[0].original_name?.toLowerCase().endsWith(".webp"),
        );

    return {
        withUrl: usable,
        imagesAndVideos,
        audio,
        files,
        missingUrl,
        onlyMedia,
        isSticker,
    };
}