// resources/js/components/conversation/message-input/index.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import type { AttachmentCategory, PendingFile } from "@/types/message-input";
import { categoryForFile } from "@/types/message-input";
import { useAudioRecorder } from "@/hooks/conversations/use-audio-recorder";
import AttachmentPreview from "./attachment-preview";
import AttachmentsButton from "./attachments-button";
import EmojiPickerButton from "./emoji-picker-button";
import RecordingBar from "./recording-bar";
import ComposerTextarea from "./composer-textarea";

/** Shape the parent should throw / pass into `onError`. */
export interface SendError {
    status: number;
    code?: string;
    required?: number;
    available?: number;
    message?: string;
}

interface Props {
    onSend: (
        text: string,
        files?: File[],
        categories?: AttachmentCategory[],
    ) => void | Promise<void>;
    /**
     * Called if `onSend` throws (or returns a rejected promise).
     * The conversation page uses this to open the top-up modal on 402.
     */
    onError?: (error: SendError) => void;
    onTyping?: () => void;
    disabled?: boolean;
    autoFocus?: boolean;
    stickersEndpoint?: string;
}

export default function MessageInput({
    onSend,
    onError,
    onTyping,
    disabled = false,
    autoFocus = true,
    stickersEndpoint = "/api/stickers",
}: Props) {
    const [text, setText] = useState("");
    const [files, setFiles] = useState<PendingFile[]>([]);

    const textInputRef = useRef<HTMLTextAreaElement>(null);
    const lastTypingRef = useRef(0);
    const onSendRef = useRef(onSend);
    const onErrorRef = useRef(onError);

    useEffect(() => {
        onSendRef.current = onSend;
    }, [onSend]);

    useEffect(() => {
        onErrorRef.current = onError;
    }, [onError]);

    const focusInput = useCallback(() => {
        requestAnimationFrame(() => {
            const el = textInputRef.current;
            if (!el || el.disabled) return;
            el.focus();
            const len = el.value.length;
            try {
                el.setSelectionRange(len, len);
            } catch {
                /* ignore */
            }
        });
    }, []);

    useEffect(() => {
        if (autoFocus) focusInput();
    }, [autoFocus, focusInput]);

    const revokeUrl = useCallback((url: string) => {
        if (!url.startsWith("blob:")) return;
        try {
            URL.revokeObjectURL(url);
        } catch {
            /* ignore */
        }
    }, []);

    const clearPreviews = useCallback(
        (items: PendingFile[]) => items.forEach((i) => revokeUrl(i.url)),
        [revokeUrl],
    );

    /**
     * Wraps a send attempt so failures route through `onError` instead
     * of being swallowed. The composer has already reset itself by the
     * time this runs, so callers must own retry semantics.
     */
    const safeSend = useCallback(
        async (
            text: string,
            files: File[],
            categories: AttachmentCategory[],
        ) => {
            try {
                await onSendRef.current(
                    text,
                    files.length ? files : undefined,
                    categories.length ? categories : undefined,
                );
            } catch (err) {
                const e = err as Partial<SendError> & {
                    response?: {
                        status?: number;
                        data?: Partial<SendError>;
                    };
                };
                const status = e.status ?? e.response?.status ?? 0;
                const data = e.response?.data ?? (e as Partial<SendError>);
                onErrorRef.current?.({
                    status,
                    code: data?.code,
                    required: data?.required,
                    available: data?.available,
                    message: data?.message ?? "Could not send message.",
                });
            }
        },
        [],
    );

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

    // ---------------------------------------------------------------
    // Add / remove files
    // ---------------------------------------------------------------
    const addFiles = useCallback(
        (incoming: File[]) => {
            setFiles((prev) => {
                const seen = new Set(
                    prev.map(
                        (p) =>
                            `${p.file.name}:${p.file.size}:${p.file.lastModified}`,
                    ),
                );
                const additions: PendingFile[] = [];
                for (const file of incoming) {
                    const key = `${file.name}:${file.size}:${file.lastModified}`;
                    if (seen.has(key)) continue;
                    seen.add(key);
                    additions.push({
                        file,
                        url: URL.createObjectURL(file),
                        category: categoryForFile(file),
                    });
                }
                return [...prev, ...additions];
            });
            focusInput();
        },
        [focusInput],
    );

    const removeFile = (index: number) => {
        setFiles((prev) => {
            const removed = prev[index];
            if (removed) revokeUrl(removed.url);
            return prev.filter((_, i) => i !== index);
        });
        focusInput();
    };

    // ---------------------------------------------------------------
    // Submit / reset
    // ---------------------------------------------------------------
    const resetComposer = useCallback(() => {
        setText("");
        setFiles((prev) => {
            clearPreviews(prev);
            return [];
        });
        if (textInputRef.current) textInputRef.current.style.height = "auto";
        focusInput();
    }, [clearPreviews, focusInput]);

    const submit = useCallback(() => {
        if (disabled) return;
        if (!text.trim() && files.length === 0) return;
        const message = text.trim();
        const attachments = files.map((p) => p.file);
        const categories = files.map((p) => p.category);
        resetComposer();
        void safeSend(message, attachments, categories);
    }, [disabled, text, files, resetComposer, safeSend]);

    // ---------------------------------------------------------------
    // Audio recorder
    // ---------------------------------------------------------------
    const recorder = useAudioRecorder({
        disabled,
        onComplete: (file) => {
            void safeSend("", [file], ["audio"]);
            focusInput();
        },
    });

    // ---------------------------------------------------------------
    // Emoji + GIF/sticker sending
    // ---------------------------------------------------------------
    const sendRemoteAsset = useCallback(
        async (url: string, filename: string) => {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const blob = await response.blob();

                const extFromUrl =
                    url.split(".").pop()?.split("?")[0]?.toLowerCase() ?? "";
                const mime = blob.type || "image/gif";
                const ext = mime.includes("gif")
                    ? "gif"
                    : mime.includes("png")
                      ? "png"
                      : mime.includes("webp")
                        ? "webp"
                        : mime.includes("svg")
                          ? "svg"
                          : mime.includes("jpeg") || mime.includes("jpg")
                            ? "jpg"
                            : [
                                    "gif",
                                    "webp",
                                    "png",
                                    "jpg",
                                    "jpeg",
                                    "svg",
                                ].includes(extFromUrl)
                              ? extFromUrl
                              : "gif";

                const safeName = (filename || "sticker").replace(
                    /[^a-z0-9_-]+/gi,
                    "-",
                );
                const file = new File([blob], `${safeName}.${ext}`, {
                    type: mime,
                });
                await safeSend("", [file], ["image"]);
                focusInput();
            } catch (err) {
                console.error("Could not load GIF/sticker:", err);
            }
        },
        [focusInput, safeSend],
    );

    const handleEscape = useCallback(() => {
        if (recorder.isRecording) recorder.cancel();
    }, [recorder]);

    const hasContent = Boolean(text.trim() || files.length > 0);

    return (
        <footer className="relative z-20 shrink-0 px-2 py-3 sm:px-4">
            <AttachmentPreview files={files} onRemove={removeFile} />

            <div className="flex min-w-0 items-end gap-1.5 sm:gap-2">
                <AttachmentsButton
                    disabled={disabled || recorder.isRecording}
                    onFilesSelected={addFiles}
                />

                <EmojiPickerButton
                    disabled={disabled || recorder.isRecording}
                    stickersEndpoint={stickersEndpoint}
                    onEmoji={(e) => {
                        setText((p) => p + e);
                        focusInput();
                    }}
                    onPickAsset={sendRemoteAsset}
                />

                {recorder.isRecording ? (
                    <RecordingBar
                        seconds={recorder.recordingTime}
                        onCancel={recorder.cancel}
                        onStop={recorder.stop}
                    />
                ) : (
                    <ComposerTextarea
                        inputRef={textInputRef}
                        value={text}
                        onChange={handleChange}
                        onSubmit={submit}
                        onStartRecording={recorder.start}
                        onEscape={handleEscape}
                        hasContent={hasContent}
                        disabled={disabled}
                    />
                )}
            </div>
        </footer>
    );
}
