// resources/js/hooks/use-sound.ts
import { useCallback, useEffect, useRef } from "react";

/**
 * Preloads an audio file and returns a `play()` function.
 * Silently no-ops in SSR, when muted, or if the browser blocks autoplay.
 */
export function useSound(src: string, { volume = 0.5 } = {}) {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const audio = new Audio(src);
        audio.preload = "auto";
        audio.volume = volume;
        audioRef.current = audio;

        return () => {
            audio.pause();
            audio.src = "";
            audioRef.current = null;
        };
    }, [src, volume]);

    const play = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;

        // Rewind so rapid successive calls restart the sound.
        try {
            audio.currentTime = 0;
        } catch {
            // Some browsers throw if the file hasn't loaded yet — ignore.
        }

        // play() returns a promise that rejects if autoplay is blocked.
        void audio.play().catch(() => {
            // User hasn't interacted with the page yet — skip.
        });
    }, []);

    return play;
}