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

interface Props {
    onSend: (text: string, files?: File[], audioBlob?: Blob) => void;
    onTyping?: () => void;
}

type MediaType = "document" | "media" | "camera" | "audio";

export default function MessageInput({ onSend, onTyping }: Props) {
    const [text, setText] = useState("");
    const [files, setFiles] = useState<File[]>([]);
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
    const previewUrlsRef = useRef<Map<File, string>>(new Map());
    const onSendRef = useRef(onSend);

    useEffect(() => {
        onSendRef.current = onSend;
    }, [onSend]);

    // ...all state/fx logic unchanged from original...
    // (paste the same timer/preview/resize/recording logic here verbatim)

    const stopTimer = useCallback(() => {
        if (timerRef.current !== null) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const getPreviewUrl = useCallback((file: File) => {
        const cached = previewUrlsRef.current.get(file);
        if (cached) return cached;
        const url = URL.createObjectURL(file);
        previewUrlsRef.current.set(file, url);
        return url;
    }, []);

    const revokePreview = useCallback((file: File) => {
        const url = previewUrlsRef.current.get(file);
        if (url) {
            URL.revokeObjectURL(url);
            previewUrlsRef.current.delete(file);
        }
    }, []);

    const clearPreviews = useCallback(() => {
        previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        previewUrlsRef.current.clear();
    }, []);

    const closePopups = () => {
        setShowEmoji(false);
        setShowMediaMenu(false);
    };

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

    const handleChange = (value: string) => {
        setText(value);
        if (value.trim() && Date.now() - lastTypingRef.current >= 1500) {
            lastTypingRef.current = Date.now();
            onTyping?.();
        }
    };

    const handleEmojiClick = (emojiData: { emoji: string }) => {
        setText((previous) => previous + emojiData.emoji);
        textInputRef.current?.focus();
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(event.target.files ?? []);
        if (selected.length) {
            setFiles((previous) => {
                const existing = new Set(
                    previous.map(
                        (f) => `${f.name}:${f.size}:${f.lastModified}`,
                    ),
                );
                const additions = selected.filter((file) => {
                    const key = `${file.name}:${file.size}:${file.lastModified}`;
                    if (existing.has(key)) return false;
                    existing.add(key);
                    return true;
                });
                return [...previous, ...additions];
            });
        }
        event.target.value = "";
        setShowMediaMenu(false);
        textInputRef.current?.focus();
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
            const file = previous[index];
            if (file) revokePreview(file);
            return previous.filter((_, i) => i !== index);
        });
    };

    const resetComposer = () => {
        setText("");
        setFiles([]);
        setRecordingTime(0);
        closePopups();
        clearPreviews();
        if (textInputRef.current) {
            textInputRef.current.style.height = "auto";
            textInputRef.current.focus();
        }
    };

    const handleSubmit = (event?: FormEvent<HTMLFormElement>) => {
        event?.preventDefault();
        if (isRecording || (!text.trim() && files.length === 0)) return;
        const message = text.trim();
        const attachments = [...files];
        onSend(message, attachments);
        resetComposer();
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (
            event.key === "Enter" &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing
        ) {
            event.preventDefault();
            handleSubmit();
        }
    };

    const startRecording = async () => {
        // unchanged logic
        if (isRecording || mediaRecorderRef.current) return;
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
            if (mediaRecorderRef.current) {
                stream.getTracks().forEach((t) => t.stop());
                return;
            }
            const mimeType = [
                "audio/webm;codecs=opus",
                "audio/webm",
                "audio/mp4",
            ].find((type) => MediaRecorder.isTypeSupported(type));
            const recorder = mimeType
                ? new MediaRecorder(stream, { mimeType })
                : new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            recordingStreamRef.current = stream;
            audioChunksRef.current = [];
            recorder.ondataavailable = (event) => {
                if (event.data.size > 0)
                    audioChunksRef.current.push(event.data);
            };
            recorder.onstop = () => {
                stopTimer();
                const blobType = recorder.mimeType || "audio/webm";
                const audioBlob = new Blob(audioChunksRef.current, {
                    type: blobType,
                });
                stream.getTracks().forEach((t) => t.stop());
                recordingStreamRef.current = null;
                mediaRecorderRef.current = null;
                audioChunksRef.current = [];
                setIsRecording(false);
                setRecordingTime(0);
                if (audioBlob.size > 0) onSendRef.current("", [], audioBlob);
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
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remaining = seconds % 60;
        return `${minutes}:${remaining.toString().padStart(2, "0")}`;
    };

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            const target = event.target as Node;
            if (
                emojiWrapRef.current &&
                !emojiWrapRef.current.contains(target) &&
                !emojiButtonRef.current?.contains(target)
            )
                setShowEmoji(false);
            if (
                mediaWrapRef.current &&
                !mediaWrapRef.current.contains(target) &&
                !mediaButtonRef.current?.contains(target)
            )
                setShowMediaMenu(false);
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () =>
            document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    useEffect(() => {
        return () => {
            stopTimer();
            const recorder = mediaRecorderRef.current;
            if (recorder) {
                recorder.onstop = null;
                if (recorder.state !== "inactive") recorder.stop();
            }
            recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
            clearPreviews();
        };
    }, [clearPreviews, stopTimer]);

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
                    {files.map((file, index) => {
                        const isImage = file.type.startsWith("image/");
                        const isVideo = file.type.startsWith("video/");
                        const preview =
                            isImage || isVideo ? getPreviewUrl(file) : null;
                        return (
                            <div
                                key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                                className="relative flex max-w-full items-center gap-2 rounded-xl border border-border/60 bg-card p-2 pr-9 shadow-sm"
                            >
                                {isImage ? (
                                    <img
                                        src={preview ?? ""}
                                        alt={file.name}
                                        className="h-12 w-12 shrink-0 rounded-lg object-cover"
                                    />
                                ) : isVideo ? (
                                    <video
                                        src={preview ?? ""}
                                        className="h-12 w-12 shrink-0 rounded-lg object-cover"
                                        muted
                                        playsInline
                                    />
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
                        onClick={() => {
                            setShowMediaMenu((v) => !v);
                            setShowEmoji(false);
                        }}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
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
                        onClick={() => {
                            setShowEmoji((v) => !v);
                            if (!showEmoji) setShowMediaMenu(false);
                        }}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
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
                            )}
                        >
                            <textarea
                                ref={textInputRef}
                                rows={1}
                                value={text}
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
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-white shadow-glow-pink transition hover:shadow-glow-pink-strong hover-lift active:scale-95"
                            >
                                <Send className="h-[19px] w-[19px]" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={startRecording}
                                aria-label="Record voice message"
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground active:scale-95"
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
