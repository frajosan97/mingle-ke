import { useState } from "react";

export function useShare() {
    const [isCopied, setIsCopied] = useState(false);

    const share = async (title: string, text: string, url: string) => {
        // 1. Try Native Web Share API (Mobile & Modern Desktop)
        if (typeof navigator !== "undefined" && navigator.share) {
            try {
                await navigator.share({
                    title,
                    text,
                    url,
                });
                return;
            } catch (error) {
                // Failed to open share sheet
            }
        }

        // 2. Fallback: Copy to Clipboard
        try {
            await navigator.clipboard.writeText(url);
            setIsCopied(true);
            // Reset after 2 seconds
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            // Fallback failed
        }
    };

    return { share, isCopied };
}