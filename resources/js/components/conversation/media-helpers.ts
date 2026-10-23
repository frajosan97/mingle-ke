import type { MessageAttachment } from "@/types";
import type { MediaItem } from "@/components/conversation/media-viewer";

/** Attachments supported by the media viewer, with a guaranteed URL. */
export type OpenableAttachment = MessageAttachment & {
    type: MediaItem["type"];
    url: string;
};

/**
 * Check that an attachment has a supported media type and a usable URL.
 * This validates the URL's presence, not whether the server can serve it.
 */
export function isOpenable(
    attachment: MessageAttachment,
): attachment is OpenableAttachment {
    if (!attachment || typeof attachment !== "object") {
        return false;
    }

    const supportedType =
        attachment.type === "image" ||
        attachment.type === "video" ||
        attachment.type === "audio";

    return (
        supportedType &&
        typeof attachment.url === "string" &&
        attachment.url.trim().length > 0
    );
}

/** Convert an attachment to the media viewer's expected shape. */
export function toMediaItem(attachment: OpenableAttachment): MediaItem {
    return {
        url: attachment.url.trim(),
        type: attachment.type,
        name: attachment.original_name ?? undefined,
    };
}