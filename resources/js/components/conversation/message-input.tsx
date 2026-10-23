// resources/js/components/conversation/message-input.tsx
import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type ChangeEvent,
    type FormEvent,
    type KeyboardEvent,
} from "react";
import {
    Paperclip,
    Smile,
    Send,
    Mic,
    FileText,
    Image as ImageIcon,
    Camera,
    Headphones,
    X,
} from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { cn } from "@/lib/utils";

/**
 * Category hint sent to the backend alongside each file. Matches the
 * backend's allowed `attachment_categories.*` values.
 */
export type AttachmentCategory =
    | "image"
    | "video"
    | "audio"
    | "document"
    | "archive";

export interface OutgoingAttachment {
    file: File;
    category: AttachmentCategory;
}

interface Props {
    /**
     * Called when the user submits. `categories[i]` corresponds to
     * `files[i]` and lets the backend classify ambiguous containers
     * (webm / mp4 voice notes) without relying on ffprobe alone.
     */
    onSend: (
        text: string,
        files?: File[],
        categories?: AttachmentCategory[],
    ) => void;
    onTyping?: () => void;
    /** Optional: disable input while a message is in flight. */
    disabled?: boolean;
    /** Optional: initial focus on mount (default true). */
    autoFocus?: boolean;
}

type MediaType = "document" | "media" | "camera" | "audio";

// Preferred recording containers, most specific first.
// Every entry is audio-only — no video containers, ever.
const PREFERRED_AUDIO_MIMES = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/mp4;codecs=mp4a.40.2",
    "audio/mp4",
] as const;

const extensionForAudioMime = (mime: string): string => {
    if (mime.includes("webm")) return "webm";
    if (mime.includes("ogg")) return "ogg";
    if (mime.includes("mp4") || mime.includes("m4a")) return "m4a";
    if (mime.includes("wav")) return "wav";
    return "webm";
};

/**
 * Map a File to the category the backend expects. This is what makes
 * voice notes reliably classified as audio on the server side, even
 * when ffprobe is unavailable.
 */
const categoryForFile = (file: File): AttachmentCategory => {
    const type = file.type.toLowerCase();
    if (type.startsWith("image/")) return "image";
    if (type.startsWith("video/")) return "video";
    if (type.startsWith("audio/")) return "audio";

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (["zip"].includes(ext)) return "archive";
    if (
        [
            "doc",
            "docx",
            "xls",
            "xlsx",
            "ppt",
            "pptx",
            "pdf",
            "txt",
            "csv",
            "odt",
            "ods",
            "odp",
            "rtf",
        ].includes(ext)
    )
        return "document";
    if (["mp4", "mov", "avi", "webm", "mkv", "m4v", "3gp"].includes(ext)) {
        return "video";
    }
    if (
        ["mp3", "m4a", "ogg", "oga", "wav", "wave", "aac", "amr"].includes(ext)
    ) {
        return "audio";
    }
    if (["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext)) {
        return "image";
    }
    return "document";
};

interface PendingFile {
    file: File;
    /** Object URL created exactly once when the file was added. */
    url: string;
    category: AttachmentCategory;
}

const isImageFile = (file: File) => file.type.startsWith("image/");
const isVideoFile = (file: File) => file.type.startsWith("video/");
const isAudioFile = (file: File) => file.type.startsWith("audio/");

export default function MessageInput({
    onSend,
    onTyping,
    disabled = false,
    autoFocus = true,
}: Props) {
    const [text, setText] = useState("");
    const [files, setFiles] = useState<PendingFile[]>([]);
    const [showEmoji, setShowEmoji] = useState(false);
    const [showMediaMenu, setShowMediaMenu] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);

    const fileRef = useRef<HTMLInputElement>(null);
    const textInputRef = useRef<HTMLTextAreaElement>(null);
    const emojiWrapRef = useRef<HTMLDivElement>(null);
    const emojiButtonRef = useRef<HTMLButtonElement>(null);
    const mediaWrapRef = useRef<HTMLDivElement>(null);
    const mediaButtonRef = useRef<HTMLButtonElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingStreamRef = useRef<MediaStream | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastTypingRef = useRef(0);
    // Keep the latest callbacks available to async handlers (recorder.onstop)
    // without re-subscribing on every render.
    const onSendRef = useRef(onSend);

    useEffect(() => {
        onSendRef.current = onSend;
    }, [onSend]);

    // ---------------------------------------------------------------
    // Focus helpers
    // ---------------------------------------------------------------
    const focusInput = useCallback(() => {
        // Defer to next frame so layout is settled (esp. after menu close).
        requestAnimationFrame(() => {
            const el = textInputRef.current;
            if (!el || el.disabled) return;
            el.focus();
            // Place caret at end, not start.
            const len = el.value.length;
            try {
                el.setSelectionRange(len, len);
            } catch {
                /* setSelectionRange can throw on some mobile browsers */
            }
        });
    }, []);

    // Focus on mount when allowed.
    useEffect(() => {
        if (autoFocus) focusInput();
    }, [autoFocus, focusInput]);

    // ---------------------------------------------------------------
    // Timer
    // ---------------------------------------------------------------
    const stopTimer = useCallback(() => {
        if (timerRef.current !== null) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    // ---------------------------------------------------------------
    // Preview URL lifecycle — created on add, revoked on remove/reset.
    // ---------------------------------------------------------------
    const revokeUrl = useCallback((url: string) => {
        try {
            URL.revokeObjectURL(url);
        } catch {
            /* ignore — URL may already be revoked */
        }
    }, []);

    const clearPreviews = useCallback(
        (items: PendingFile[]) => {
            items.forEach((item) => revokeUrl(item.url));
        },
        [revokeUrl],
    );

    // ---------------------------------------------------------------
    // Popups
    // ---------------------------------------------------------------
    const closePopups = useCallback(() => {
        setShowEmoji(false);
        setShowMediaMenu(false);
    }, []);

    // ---------------------------------------------------------------
    // Textarea auto-resize
    // ---------------------------------------------------------------
    const resizeTextarea = useCallback(() => {
        const input = textInputRef.current;
        if (!input) return;
        input.style.height = "auto";
        input.style.height = `${Math.min(input.scrollHeight, 144)}px`;
        input.style.overflowY = input.scrollHeight > 144 ? "auto" : "hidden";
    }, []);

    useEffect(() => {
        resizeTextarea();
    }, [text, resizeTextarea]);

    // ---------------------------------------------------------------
    // Typing
    // ---------------------------------------------------------------
    const handleChange = (value: string) => {
        setText(value);
        if (value.trim() && Date.now() - lastTypingRef.current >= 1500) {
            lastTypingRef.current = Date.now();
            onTyping?.();
        }
    };

    const handleEmojiClick = (emojiData: { emoji: string }) => {
        setText((previous) => previous + emojiData.emoji);
        focusInput();
    };

    // ---------------------------------------------------------------
    // File selection
    // ---------------------------------------------------------------
    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(event.target.files ?? []);
        if (selected.length) {
            setFiles((previous) => {
                const existing = new Set(
                    previous.map(
                        (p) =>
                            `${p.file.name}:${p.file.size}:${p.file.lastModified}`,
                    ),
                );
                const additions: PendingFile[] = [];
                for (const file of selected) {
                    const key = `${file.name}:${file.size}:${file.lastModified}`;
                    if (existing.has(key)) continue;
                    existing.add(key);
                    additions.push({
                        file,
                        url: URL.createObjectURL(file),
                        category: categoryForFile(file),
                    });
                }
                return [...previous, ...additions];
            });
        }
        event.target.value = "";
        setShowMediaMenu(false);
        focusInput();
    };

    const triggerFileSelect = (type: MediaType) => {
        const input = fileRef.current;
        if (!input) return;
        input.value = "";
        input.removeAttribute("capture");
        switch (type) {
            case "document":
                input.accept =
                    ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip";
                break;
            case "media":
                input.accept = "image/*,video/*";
                break;
            case "camera":
                input.accept = "image/*";
                input.setAttribute("capture", "environment");
                break;
            case "audio":
                input.accept = "audio/*";
                break;
        }
        input.click();
    };

    const removeFile = (index: number) => {
        setFiles((previous) => {
            const removed = previous[index];
            if (removed) revokeUrl(removed.url);
            return previous.filter((_, i) => i !== index);
        });
        focusInput();
    };

    // ---------------------------------------------------------------
    // Reset / submit
    // ---------------------------------------------------------------
    const resetComposer = useCallback(() => {
        // Reset state first so a parent that unmounts us on send is safe.
        setText("");
        setFiles((previous) => {
            clearPreviews(previous);
            return [];
        });
        setRecordingTime(0);
        setShowEmoji(false);
        setShowMediaMenu(false);
        if (textInputRef.current) {
            textInputRef.current.style.height = "auto";
        }
        focusInput();
    }, [clearPreviews, focusInput]);

    const handleSubmit = (event?: FormEvent<HTMLFormElement>) => {
        event?.preventDefault();
        if (disabled || isRecording) return;
        if (!text.trim() && files.length === 0) return;

        const message = text.trim();
        const attachments = files.map((p) => p.file);
        const categories = files.map((p) => p.category);

        // Reset BEFORE calling onSend: the parent may unmount us
        // synchronously (e.g. optimistic list swap, route change),
        // and running cleanup on an unmounting component warns.
        resetComposer();
        onSend(message, attachments, categories);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Escape") {
            if (showEmoji || showMediaMenu) {
                event.preventDefault();
                closePopups();
                focusInput();
                return;
            }
            if (isRecording) {
                event.preventDefault();
                cancelRecording();
                return;
            }
        }

        if (
            event.key === "Enter" &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing
        ) {
            event.preventDefault();
            handleSubmit();
        }
    };

    // ---------------------------------------------------------------
    // Recording
    // ---------------------------------------------------------------
    const startRecording = async () => {
        if (disabled || isRecording || mediaRecorderRef.current) return;

        if (
            typeof navigator === "undefined" ||
            !navigator.mediaDevices?.getUserMedia ||
            typeof MediaRecorder === "undefined"
        ) {
            console.error("Audio recording is not supported in this browser.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });

            // Guard against double-start while awaiting getUserMedia.
            if (mediaRecorderRef.current) {
                stream.getTracks().forEach((t) => t.stop());
                return;
            }

            const resolvedMime =
                PREFERRED_AUDIO_MIMES.find((type) =>
                    MediaRecorder.isTypeSupported(type),
                ) ?? null;

            if (!resolvedMime) {
                console.error(
                    "No audio-only recording format is supported in this browser.",
                );
                stream.getTracks().forEach((t) => t.stop());
                return;
            }

            const recorder = new MediaRecorder(stream, {
                mimeType: resolvedMime,
            });
            mediaRecorderRef.current = recorder;
            recordingStreamRef.current = stream;
            audioChunksRef.current = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            recorder.onstop = () => {
                stopTimer();

                // Safari may report video/mp4 for an audio-only recording.
                // Browsers may also report video/webm for audio-only WebM
                // (MediaRecorder with audio:true sometimes picks the video
                // container). Normalise to audio/* so the server sees an
                // unambiguous audio stream and the client hint says "audio".
                const rawType = recorder.mimeType || resolvedMime;
                const normalisedType = rawType.startsWith("video/")
                    ? rawType.replace(/^video\//, "audio/")
                    : rawType;

                const audioBlob = new Blob(audioChunksRef.current, {
                    type: normalisedType,
                });
                const extension = extensionForAudioMime(normalisedType);
                const audioFile = new File(
                    [audioBlob],
                    `voice-note-${Date.now()}.${extension}`,
                    { type: normalisedType },
                );

                stream.getTracks().forEach((t) => t.stop());
                recordingStreamRef.current = null;
                mediaRecorderRef.current = null;
                audioChunksRef.current = [];
                setIsRecording(false);
                setRecordingTime(0);

                if (audioFile.size > 0) {
                    // Send as a normal attachment with an explicit "audio"
                    // category so the backend never guesses video from the
                    // container extension.
                    onSendRef.current("", [audioFile], ["audio"]);
                }

                focusInput();
            };

            recorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            closePopups();
            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        } catch (error) {
            console.error("Could not access the microphone:", error);
            recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
            recordingStreamRef.current = null;
            mediaRecorderRef.current = null;
            setIsRecording(false);
            focusInput();
        }
    };

    const stopRecording = () => {
        const recorder = mediaRecorderRef.current;
        if (recorder?.state === "recording") recorder.stop();
    };

    const cancelRecording = () => {
        const recorder = mediaRecorderRef.current;
        stopTimer();
        if (recorder) {
            recorder.onstop = null;
            if (recorder.state !== "inactive") recorder.stop();
        }
        recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
        recordingStreamRef.current = null;
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
        setIsRecording(false);
        setRecordingTime(0);
        focusInput();
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remaining = seconds % 60;
        return `${minutes}:${remaining.toString().padStart(2, "0")}`;
    };

    // ---------------------------------------------------------------
    // Outside-click handling
    // ---------------------------------------------------------------
    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            const target = event.target as Node;
            if (
                emojiWrapRef.current &&
                !emojiWrapRef.current.contains(target) &&
                !emojiButtonRef.current?.contains(target)
            ) {
                setShowEmoji(false);
            }
            if (
                mediaWrapRef.current &&
                !mediaWrapRef.current.contains(target) &&
                !mediaButtonRef.current?.contains(target)
            ) {
                setShowMediaMenu(false);
            }
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () =>
            document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    // ---------------------------------------------------------------
    // Unmount cleanup
    // ---------------------------------------------------------------
    useEffect(() => {
        return () => {
            stopTimer();
            const recorder = mediaRecorderRef.current;
            if (recorder) {
                recorder.onstop = null;
                if (recorder.state !== "inactive") recorder.stop();
            }
            recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
            // Revoke any preview URLs still alive.
            clearPreviews(files);
        };
        // `files` intentionally not in deps — we only want unmount cleanup.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clearPreviews, stopTimer]);

    // ---------------------------------------------------------------
    // Global keyboard: "/" focuses the composer (common chat shortcut).
    // ---------------------------------------------------------------
    useEffect(() => {
        const onGlobalKey = (event: globalThis.KeyboardEvent) => {
            if (event.key !== "/" || event.metaKey || event.ctrlKey) return;
            const active = document.activeElement;
            const tag = active?.tagName?.toLowerCase();
            if (
                tag === "input" ||
                tag === "textarea" ||
                (active as HTMLElement | null)?.isContentEditable
            ) {
                return;
            }
            event.preventDefault();
            focusInput();
        };
        document.addEventListener("keydown", onGlobalKey);
        return () => document.removeEventListener("keydown", onGlobalKey);
    }, [focusInput]);

    const hasContent = Boolean(text.trim() || files.length > 0);

    const attachmentsMenu = [
        { type: "document" as const, label: "Document", Icon: FileText },
        { type: "media" as const, label: "Photos & videos", Icon: ImageIcon },
        { type: "camera" as const, label: "Camera", Icon: Camera },
        { type: "audio" as const, label: "Audio file", Icon: Headphones },
    ];

    return (
        <footer className="relative z-20 shrink-0 px-2 py-3 sm:px-4">
            {files.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2 px-1">
                    {files.map(({ file, url, category }, index) => {
                        const image = isImageFile(file);
                        const video = isVideoFile(file);
                        const audio = isAudioFile(file);

                        return (
                            <div
                                key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                                className="relative flex max-w-full items-center gap-2 rounded-xl border border-border/60 bg-card p-2 pr-9 shadow-sm"
                            >
                                {image ? (
                                    <img
                                        src={url}
                                        alt={file.name}
                                        className="h-12 w-12 shrink-0 rounded-lg object-cover"
                                    />
                                ) : video ? (
                                    <video
                                        src={url}
                                        className="h-12 w-12 shrink-0 rounded-lg object-cover"
                                        muted
                                        playsInline
                                    />
                                ) : audio ? (
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-pink/10 text-brand-pink">
                                        <Mic className="h-6 w-6" />
                                    </div>
                                ) : (
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                                        <FileText className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                )}

                                <div className="min-w-0 max-w-[180px]">
                                    <p className="truncate text-xs font-medium text-foreground">
                                        {file.name}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground">
                                        {(file.size / 1024).toFixed(0)} KB
                                    </p>
                                    {audio && (
                                        <audio
                                            src={url}
                                            controls
                                            preload="metadata"
                                            className="mt-1 h-7 w-full max-w-[160px]"
                                        />
                                    )}
                                    {/* `category` is sent to the backend on submit. */}
                                    <span className="sr-only">{category}</span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => removeFile(index)}
                                    aria-label={`Remove ${file.name}`}
                                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:bg-destructive/15 hover:text-destructive"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="flex min-w-0 items-end gap-1.5 sm:gap-2">
                <div ref={mediaWrapRef} className="relative shrink-0">
                    {showMediaMenu && (
                        <div className="absolute bottom-14 left-0 z-50 w-60 max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-border bg-popover py-2 text-popover-foreground shadow-xl">
                            {attachmentsMenu.map(({ type, label, Icon }) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => triggerFileSelect(type)}
                                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-accent"
                                >
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-white">
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}
                    <button
                        ref={mediaButtonRef}
                        type="button"
                        aria-label="Attach files"
                        aria-expanded={showMediaMenu}
                        disabled={disabled || isRecording}
                        onClick={() => {
                            setShowMediaMenu((v) => !v);
                            setShowEmoji(false);
                        }}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:opacity-50"
                    >
                        <Paperclip className="h-[22px] w-[22px]" />
                    </button>
                </div>

                <input
                    ref={fileRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                />

                <div ref={emojiWrapRef} className="relative shrink-0">
                    {showEmoji && (
                        <div className="absolute bottom-14 left-0 z-50 max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl shadow-xl">
                            <EmojiPicker
                                theme={Theme.LIGHT}
                                onEmojiClick={handleEmojiClick}
                                width={320}
                                height={400}
                                autoFocusSearch={false}
                            />
                        </div>
                    )}
                    <button
                        ref={emojiButtonRef}
                        type="button"
                        aria-label="Choose emoji"
                        aria-expanded={showEmoji}
                        disabled={disabled || isRecording}
                        onClick={() => {
                            setShowEmoji((v) => !v);
                            if (!showEmoji) setShowMediaMenu(false);
                        }}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:opacity-50"
                    >
                        <Smile className="h-[23px] w-[23px]" />
                    </button>
                </div>

                {isRecording ? (
                    <div className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-full border border-brand-pink/30 bg-card px-3 shadow-sm sm:px-4">
                        <button
                            type="button"
                            onClick={cancelRecording}
                            aria-label="Cancel recording"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-destructive transition hover:bg-destructive/10"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5 shrink-0">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive" />
                            </span>
                            <span className="truncate text-sm text-foreground">
                                Recording audio…
                            </span>
                            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                {formatTime(recordingTime)}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={stopRecording}
                            aria-label="Send voice message"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-white shadow-glow-pink transition hover:shadow-glow-pink-strong"
                        >
                            <Send className="h-[18px] w-[18px]" />
                        </button>
                    </div>
                ) : (
                    <form
                        onSubmit={handleSubmit}
                        className="flex min-w-0 flex-1 items-end gap-1.5"
                    >
                        <div
                            className={cn(
                                "flex min-h-[42px] min-w-0 flex-1 items-end rounded-[21px] border border-border/60 bg-card px-3 shadow-sm transition-all sm:px-4",
                                "focus-within:border-brand-pink/40 focus-within:ring-2 focus-within:ring-brand-pink/20",
                                disabled && "opacity-60",
                            )}
                        >
                            <textarea
                                ref={textInputRef}
                                rows={1}
                                value={text}
                                disabled={disabled}
                                onChange={(e) => handleChange(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a message"
                                aria-label="Type a message"
                                className="block max-h-36 min-h-[42px] min-w-0 flex-1 resize-none overflow-y-hidden bg-transparent py-[11px] text-[15px] leading-5 text-foreground outline-none placeholder:text-muted-foreground focus:ring-0"
                            />
                        </div>

                        {hasContent ? (
                            <button
                                type="submit"
                                aria-label="Send message"
                                disabled={disabled}
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-white shadow-glow-pink transition hover:shadow-glow-pink-strong hover-lift active:scale-95 disabled:opacity-50"
                            >
                                <Send className="h-[19px] w-[19px]" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={startRecording}
                                aria-label="Record voice message"
                                disabled={disabled}
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground active:scale-95 disabled:opacity-50"
                            >
                                <Mic className="h-[25px] w-[25px]" />
                            </button>
                        )}
                    </form>
                )}
            </div>
        </footer>
    );
}
