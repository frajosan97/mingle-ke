// resources/js/Components/Conversation/MessageComposer.jsx
import {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from "react";
import {
    Button,
    Form,
    Image,
    InputGroup,
    OverlayTrigger,
    Tooltip,
} from "react-bootstrap";
import EmojiPicker from "emoji-picker-react";
import {
    FiSmile,
    FiPaperclip,
    FiSend,
    FiMic,
    FiX,
    FiAlertCircle,
    FiFile,
    FiImage,
    FiMusic,
    FiVideo,
} from "react-icons/fi";

const MAX_ROWS = 6;
const ROW_HEIGHT = 24;
const DEFAULT_MAX_FILES = 10;

/* ────────────────────────────────────────────────
 |  Attachment tile (grid cell)
 * ──────────────────────────────────────────────── */

function AttachmentTile({ file, onRemove }) {
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (!file?.type?.startsWith("image/")) return;
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    if (!file) return null;

    const isImage = file.type.startsWith("image/");
    const Icon = isImage
        ? FiImage
        : file.type.startsWith("audio/")
          ? FiMusic
          : file.type.startsWith("video/")
            ? FiVideo
            : FiFile;

    const sizeKb = Math.max(1, Math.round(file.size / 1024));

    return (
        <div
            className="message-composer-attachment-tile position-relative rounded overflow-hidden"
            style={{ aspectRatio: "1 / 1" }}
        >
            {previewUrl ? (
                <Image
                    src={previewUrl}
                    alt=""
                    className="w-100 h-100"
                    style={{ objectFit: "cover" }}
                />
            ) : (
                <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center p-2 text-center">
                    <Icon size={26} aria-hidden="true" />
                    <div
                        className="small text-truncate w-100 mt-1"
                        title={file.name}
                    >
                        {file.name}
                    </div>
                    <div className="small text-muted">{sizeKb} KB</div>
                </div>
            )}

            <Button
                variant="dark"
                size="sm"
                className="position-absolute top-0 end-0 m-1 rounded-circle border-0 d-inline-flex align-items-center justify-content-center"
                style={{ width: 26, height: 26, opacity: 0.85 }}
                onClick={onRemove}
                aria-label={`Remove ${file.name}`}
            >
                <FiX size={14} aria-hidden="true" />
            </Button>

            {previewUrl && (
                <div className="message-composer-attachment-caption position-absolute bottom-0 start-0 end-0 px-2 py-1 small text-truncate">
                    {file.name}
                </div>
            )}
        </div>
    );
}

/* ────────────────────────────────────────────────
 |  Main composer
 * ──────────────────────────────────────────────── */

const MessageComposer = forwardRef(function MessageComposer(
    {
        conversationId,
        onSend,
        onTyping,
        onStopTyping,
        placeholder = "Type a message",
        disabled = false,
        accept = "image/*,video/*,audio/*,.pdf,.doc,.docx,.zip",
        maxBytes = 25 * 1024 * 1024,
        maxFiles = DEFAULT_MAX_FILES,
        theme = "dark",
    },
    ref,
) {
    const [text, setText] = useState("");
    const [attachments, setAttachments] = useState([]);
    const [showEmoji, setShowEmoji] = useState(false);
    const [error, setError] = useState(null);

    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const emojiWrapRef = useRef(null);
    const typingTimerRef = useRef(null);

    // Guard so we never fire the same send twice in the same tick
    // (e.g. Enter + click). This replaces the old `sending` state guard
    // without blocking the UI while upload happens.
    const sendingRef = useRef(false);

    /* ── Imperative API ── */
    useImperativeHandle(
        ref,
        () => ({
            focus: () => textareaRef.current?.focus(),
            clear: () => {
                setText("");
                setAttachments([]);
                setError(null);
            },
            getText: () => text,
            getAttachments: () => attachments,
        }),
        [text, attachments],
    );

    /* ── Auto-resize ── */
    const resizeTextarea = useCallback(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        const maxHeight = MAX_ROWS * ROW_HEIGHT + 16;
        el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
        el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
    }, []);

    useEffect(() => {
        resizeTextarea();
    }, [text, resizeTextarea]);

    /* ── Close emoji picker on outside click / Escape ── */
    useEffect(() => {
        if (!showEmoji) return;

        const onPointerDown = (e) => {
            if (
                emojiWrapRef.current &&
                !emojiWrapRef.current.contains(e.target)
            ) {
                setShowEmoji(false);
            }
        };
        const onKey = (e) => {
            if (e.key === "Escape") setShowEmoji(false);
        };

        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [showEmoji]);

    /* ── Typing notify ── */
    const notifyTyping = useCallback(() => {
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        onTyping?.();
    }, [onTyping]);

    /* ── Emoji insert ── */
    const handleEmojiClick = useCallback((emojiData) => {
        const emoji = emojiData?.emoji;
        if (!emoji) return;

        const el = textareaRef.current;

        if (!el) {
            setText((t) => t + emoji);
            return;
        }

        const current = el.value ?? "";
        const start = el.selectionStart ?? current.length;
        const end = el.selectionEnd ?? current.length;
        const next = current.slice(0, start) + emoji + current.slice(end);

        setText(next);

        requestAnimationFrame(() => {
            el.focus();
            const caret = start + emoji.length;
            el.selectionStart = el.selectionEnd = caret;
        });
    }, []);

    /* ── File handling (multi) ── */
    const addFiles = useCallback(
        (fileList) => {
            const incoming = Array.from(fileList ?? []);
            if (incoming.length === 0) return;

            setError(null);

            setAttachments((prev) => {
                const next = [...prev];
                const errors = [];

                for (const file of incoming) {
                    if (next.length >= maxFiles) {
                        errors.push(`You can attach up to ${maxFiles} files.`);
                        break;
                    }
                    if (file.size > maxBytes) {
                        errors.push(
                            `"${file.name}" is too large. Max ${Math.round(
                                maxBytes / 1024 / 1024,
                            )} MB.`,
                        );
                        continue;
                    }
                    const isDup = next.some(
                        (f) =>
                            f.name === file.name &&
                            f.size === file.size &&
                            f.type === file.type,
                    );
                    if (isDup) continue;

                    next.push(file);
                }

                if (errors.length > 0) setError(errors.join(" "));
                return next;
            });
        },
        [maxBytes, maxFiles],
    );

    const handleFileInputChange = useCallback(
        (e) => {
            addFiles(e.target.files);
            e.target.value = "";
        },
        [addFiles],
    );

    const handleDrop = useCallback(
        (e) => {
            e.preventDefault();
            if (e.dataTransfer?.files?.length) {
                addFiles(e.dataTransfer.files);
            }
        },
        [addFiles],
    );

    const handleDragOver = useCallback((e) => e.preventDefault(), []);

    const handlePaste = useCallback(
        (e) => {
            const items = e.clipboardData?.items ?? [];
            const files = [];
            for (const item of items) {
                if (item.kind === "file") {
                    const file = item.getAsFile();
                    if (file) files.push(file);
                }
            }
            if (files.length > 0) {
                e.preventDefault();
                addFiles(files);
            }
        },
        [addFiles],
    );

    const removeAttachment = useCallback((index) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    }, []);

    /* ── Send — fully silent, fire-and-forget for the UI ── */
    const handleSend = useCallback(() => {
        if (disabled || sendingRef.current) return;
        if (!text.trim() && attachments.length === 0) return;

        // Snapshot payload.
        const payload = {
            conversationId,
            text: text.trim(),
            attachments,
        };

        // Latch the send guard for this microtask, then release.
        sendingRef.current = true;

        // ⭐ Hard reset the input IMMEDIATELY — no spinner, no delay.
        setError(null);
        setText("");
        setAttachments([]);
        onStopTyping?.();
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

        // Collapse the textarea in the same frame.
        const el = textareaRef.current;
        if (el) {
            el.style.height = "auto";
            el.style.overflowY = "hidden";
        }
        el?.focus();

        // Release the guard on the next macrotask so the very next
        // keystroke / Enter can fire a new message.
        queueMicrotask(() => {
            sendingRef.current = false;
        });

        // Fire the send in the background. Errors surface via the
        // parent's own handling (it re-marks the optimistic bubble as
        // failed). We don't block the composer on it.
        Promise.resolve()
            .then(() => onSend?.(payload))
            .catch((err) => {
                setError(
                    err?.response?.data?.message ??
                        "Failed to send. Please try again.",
                );
            });
    }, [disabled, text, attachments, onSend, conversationId, onStopTyping]);

    /* ── Keyboard ── */
    const handleKeyDown = useCallback(
        (e) => {
            if (disabled) return;
            if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
            ) {
                e.preventDefault();
                handleSend();
            }
        },
        [disabled, handleSend],
    );

    const handleChange = useCallback(
        (e) => {
            setText(e.target.value);
            if (e.target.value.length > 0) notifyTyping();
            else onStopTyping?.();
        },
        [notifyTyping, onStopTyping],
    );

    // "Can send" reflects only whether there's content — not whether
    // a previous send is in flight. This keeps the send button active
    // so the user can chain messages.
    const canSend =
        !disabled && (text.trim().length > 0 || attachments.length > 0);

    /* ── Cleanup ── */
    useEffect(
        () => () => {
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        },
        [],
    );

    return (
        <div
            className="msg-composer p-2 flex-shrink-0"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            {error && (
                <div className="message-composer-error small text-danger px-3 pt-2 d-flex align-items-center gap-2">
                    <FiAlertCircle size={14} aria-hidden="true" />
                    {error}
                </div>
            )}

            {attachments.length > 0 && (
                <div className="message-composer-attachments px-2 pt-2">
                    <div className="row g-2">
                        {attachments.map((file, index) => (
                            <div
                                className="col-4 col-sm-3 col-md-2"
                                key={`${file.name}-${file.size}-${index}`}
                            >
                                <AttachmentTile
                                    file={file}
                                    onRemove={() => removeAttachment(index)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="position-relative" ref={emojiWrapRef}>
                {showEmoji && (
                    <div className="emoji-picker">
                        <EmojiPicker
                            onEmojiClick={handleEmojiClick}
                            theme={theme}
                            lazyLoadEmojis
                            searchPlaceHolder="Search emoji"
                            width="100%"
                            height={340}
                            previewConfig={{ showPreview: false }}
                            skinTonesDisabled
                        />
                    </div>
                )}

                <InputGroup className="align-items-end msg-composer-group p-2 rounded-pill">
                    <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>Emoji</Tooltip>}
                    >
                        <Button
                            variant="light"
                            className="msg-composer-icon-btn d-inline-flex align-items-center justify-content-center border-0 rounded-circle flex-shrink-0"
                            style={{ width: 40, height: 40 }}
                            onClick={() => setShowEmoji((v) => !v)}
                            disabled={disabled}
                            aria-label="Toggle emoji picker"
                            aria-expanded={showEmoji}
                        >
                            <FiSmile size={20} aria-hidden="true" />
                        </Button>
                    </OverlayTrigger>

                    <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>Attach files</Tooltip>}
                    >
                        <Button
                            variant="light"
                            className="msg-composer-icon-btn d-inline-flex align-items-center justify-content-center border-0 rounded-circle flex-shrink-0 ms-1"
                            style={{ width: 40, height: 40 }}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={disabled}
                            aria-label="Attach files"
                        >
                            <FiPaperclip size={20} aria-hidden="true" />
                        </Button>
                    </OverlayTrigger>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={accept}
                        multiple
                        className="d-none"
                        onChange={handleFileInputChange}
                        tabIndex={-1}
                    />

                    <Form.Control
                        ref={textareaRef}
                        as="textarea"
                        rows={1}
                        className="msg-composer-input mx-2 border-0 shadow-none"
                        style={{ resize: "none", minHeight: 40 }}
                        placeholder={placeholder}
                        value={text}
                        disabled={disabled}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        aria-label="Message"
                    />

                    <OverlayTrigger
                        placement="top"
                        overlay={
                            <Tooltip>
                                {canSend ? "Send" : "Record voice"}
                            </Tooltip>
                        }
                    >
                        <Button
                            variant={canSend ? "primary" : "light"}
                            className={`d-inline-flex align-items-center justify-content-center border-0 rounded-circle flex-shrink-0 ${
                                canSend
                                    ? "msg-composer-send-btn"
                                    : "msg-composer-icon-btn"
                            }`}
                            style={{ width: 40, height: 40 }}
                            onClick={handleSend}
                            disabled={disabled}
                            aria-label={
                                canSend
                                    ? "Send message"
                                    : "Record voice message"
                            }
                        >
                            {canSend ? (
                                <FiSend size={18} aria-hidden="true" />
                            ) : (
                                <FiMic size={18} aria-hidden="true" />
                            )}
                        </Button>
                    </OverlayTrigger>
                </InputGroup>
            </div>
        </div>
    );
});

export default MessageComposer;
