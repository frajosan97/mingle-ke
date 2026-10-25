// resources/js/components/conversation/message-input/emoji-picker-button.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Smile } from "lucide-react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { cn } from "@/lib/utils";
import { isStickerAsset, type StickerAsset } from "@/types/message-input";

type PickerTab = "emoji" | "gif" | "sticker";

const EMOJI_CATEGORIES = [
    "frequent",
    "people",
    "nature",
    "foods",
    "activity",
    "places",
    "objects",
    "symbols",
    "flags",
] as const;

interface Props {
    disabled?: boolean;
    stickersEndpoint: string;
    onEmoji: (emoji: string) => void;
    onPickAsset: (url: string, name: string) => void;
}

export default function EmojiPickerButton({
    disabled,
    stickersEndpoint,
    onEmoji,
    onPickAsset,
}: Props) {
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState<PickerTab>("emoji");
    const [gifs, setGifs] = useState<StickerAsset[]>([]);
    const [stickers, setStickers] = useState<StickerAsset[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const wrapRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const loadedRef = useRef(false);

    useEffect(() => {
        const onOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                wrapRef.current &&
                !wrapRef.current.contains(target) &&
                !buttonRef.current?.contains(target)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", onOutside);
        return () => document.removeEventListener("mousedown", onOutside);
    }, []);

    const load = useCallback(async () => {
        if (loadedRef.current) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(stickersEndpoint, {
                headers: { Accept: "application/json" },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            setGifs(
                Array.isArray(json?.gifs)
                    ? json.gifs.filter(isStickerAsset)
                    : [],
            );
            setStickers(
                Array.isArray(json?.stickers)
                    ? json.stickers.filter(isStickerAsset)
                    : [],
            );
            loadedRef.current = true;
        } catch (err) {
            console.error("Could not load stickers:", err);
            setError("Could not load stickers.");
        } finally {
            setLoading(false);
        }
    }, [stickersEndpoint]);

    useEffect(() => {
        if (open) void load();
    }, [open, load]);

    const handleEmojiSelect = (emoji: { native?: string }) => {
        if (emoji?.native) onEmoji(emoji.native);
    };

    const renderGrid = (
        assets: StickerAsset[],
        cols: 2 | 3,
        objectFit: "cover" | "contain",
    ) => (
        <div
            className={cn(
                "grid gap-2",
                cols === 2 ? "grid-cols-2" : "grid-cols-3",
            )}
        >
            {assets.map((asset, i) => (
                <button
                    key={`${asset.url}-${i}`}
                    type="button"
                    onClick={() =>
                        onPickAsset(
                            asset.url,
                            asset.name.replace(/\.[^.]+$/, ""),
                        )
                    }
                    className="aspect-square overflow-hidden rounded-md bg-muted"
                    title={asset.name}
                >
                    <img
                        src={asset.url}
                        alt={asset.name}
                        loading="lazy"
                        className={cn(
                            "h-full w-full",
                            objectFit === "cover"
                                ? "object-cover"
                                : "object-contain",
                        )}
                    />
                </button>
            ))}
        </div>
    );

    const tabBtn = (id: PickerTab, label: string, icon: React.ReactNode) => (
        <button
            type="button"
            onClick={() => setTab(id)}
            aria-pressed={tab === id}
            className={cn(
                "flex h-8 items-center gap-1.5 px-4 text-xs font-medium transition-colors",
                tab === id
                    ? "bg-emerald-500 text-white"
                    : "text-muted-foreground hover:text-foreground",
            )}
        >
            {icon}
            {label}
        </button>
    );

    return (
        <div ref={wrapRef} className="relative shrink-0">
            {open && (
                <div className="absolute bottom-14 left-0 z-50 w-[340px] max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
                    <div className="h-[400px] overflow-hidden">
                        {tab === "emoji" && (
                            <Picker
                                data={data}
                                locale="en"
                                categories={[...EMOJI_CATEGORIES]}
                                perLine={9}
                                previewPosition="none"
                                skinTonePosition="search"
                                navPosition="none"
                                searchPosition="top"
                                onEmojiSelect={handleEmojiSelect}
                            />
                        )}

                        {tab === "gif" && (
                            <div className="h-full overflow-y-auto p-2">
                                {loading && gifs.length === 0 ? (
                                    <p className="flex h-full items-center justify-center text-xs text-muted-foreground">
                                        Loading GIFs…
                                    </p>
                                ) : error ? (
                                    <p className="flex h-full items-center justify-center px-4 text-center text-xs text-destructive">
                                        {error}
                                    </p>
                                ) : gifs.length === 0 ? (
                                    <p className="flex h-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
                                        No GIFs found.
                                    </p>
                                ) : (
                                    renderGrid(gifs, 2, "cover")
                                )}
                            </div>
                        )}

                        {tab === "sticker" && (
                            <div className="h-full overflow-y-auto p-2">
                                {loading && stickers.length === 0 ? (
                                    <p className="flex h-full items-center justify-center text-xs text-muted-foreground">
                                        Loading stickers…
                                    </p>
                                ) : error ? (
                                    <p className="flex h-full items-center justify-center px-4 text-center text-xs text-destructive">
                                        {error}
                                    </p>
                                ) : stickers.length === 0 ? (
                                    <p className="flex h-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
                                        No stickers found.
                                    </p>
                                ) : (
                                    renderGrid(stickers, 3, "contain")
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-center border-t border-border bg-popover px-2 py-2">
                        <div className="flex overflow-hidden rounded-full bg-muted">
                            {tabBtn(
                                "emoji",
                                "Emoji",
                                <Smile className="h-4 w-4" />,
                            )}
                            {tabBtn(
                                "gif",
                                "GIF",
                                <ImageIcon className="h-4 w-4" />,
                            )}
                            {tabBtn(
                                "sticker",
                                "Sticker",
                                <svg
                                    className="h-4 w-4"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <rect
                                        x="4"
                                        y="4"
                                        width="16"
                                        height="16"
                                        rx="3"
                                    />
                                    <path d="M14 8v4h4" />
                                </svg>,
                            )}
                        </div>
                    </div>
                </div>
            )}
            <button
                ref={buttonRef}
                type="button"
                aria-label="Choose emoji"
                aria-expanded={open}
                disabled={disabled}
                onClick={() => setOpen((v) => !v)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:opacity-50"
            >
                <Smile className="h-[23px] w-[23px]" />
            </button>
        </div>
    );
}
