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
    Spinner,
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

/* ────────────────────────────────────────────────
 |  Attachment preview
 * ──────────────────────────────────────────────── */

function AttachmentPreview({ file, onRemove }) {
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (!file?.type.startsWith("image/")) return;
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    if (!file) return null;

    const icon = file.type.startsWith("image/")
        ? FiImage
        : file.type.startsWith("audio/")
          ? FiMusic
          : file.type.startsWith("video/")
            ? FiVideo
            : FiFile;

    const Icon = icon;
    const sizeKb = Math.round(file.size / 1024);

    return (
        <div className="message-composer-attachment d-flex align-items-center gap-2 px-3 py-2">
            {previewUrl ? (
                <Image
                    src={previewUrl}
                    alt=""
                    rounded
                    width={40}
                    height={40}
                    style={{ objectFit: "cover" }}
                />
            ) : (
                <span
                    className="message-composer-attachment-icon d-inline-flex align-items-center justify-content-center rounded"
                    style={{ width: 40, height: 40 }}
                >
                    <Icon size={20} aria-hidden="true" />
                </span>
            )}
            <div
                className="flex-grow-1 overflow-hidden"
                style={{ minWidth: 0 }}
            >
                <div className="small text-truncate fw-semibold">
                    {file.name}
                </div>
                <div className="small text-muted">{sizeKb} KB</div>
            </div>
            <Button
                variant="light"
                size="sm"
                className="rounded-circle border-0 d-inline-flex align-items-center justify-content-center"
                style={{ width: 32, height: 32 }}
                onClick={onRemove}
                aria-label="Remove attachment"
            >
                <FiX size={16} aria-hidden="true" />
            </Button>
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
        theme = "dark",
    },
    ref,
) {
    const [text, setText] = useState("");
    const [attachment, setAttachment] = useState(null);
    const [showEmoji, setShowEmoji] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);

    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const emojiWrapRef = useRef(null);
    const typingTimerRef = useRef(null);

    /* ── Imperative API ── */
    useImperativeHandle(
        ref,
        () => ({
            focus: () => textareaRef.current?.focus(),
            clear: () => {
                setText("");
                setAttachment(null);
                setError(null);
            },
            getText: () => text,
        }),
        [text],
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
    const handleEmojiClick = useCallback(
        (emojiData) => {
            const emoji = emojiData.emoji;
            const el = textareaRef.current;
            if (!el) {
                setText((t) => t + emoji);
                return;
            }
            const start = el.selectionStart ?? text.length;
            const end = el.selectionEnd ?? text.length;
            const next = text.slice(0, start) + emoji + text.slice(end);
            setText(next);
            requestAnimationFrame(() => {
                el.focus();
                el.selectionStart = el.selectionEnd = start + emoji.length;
            });
        },
        [text],
    );

    /* ── File handling ── */
    const handleFilePick = useCallback(
        (file) => {
            setError(null);
            if (!file) return;
            if (file.size > maxBytes) {
                setError(
                    `File too large. Max ${Math.round(
                        maxBytes / 1024 / 1024,
                    )} MB.`,
                );
                return;
            }
            setAttachment(file);
        },
        [maxBytes],
    );

    const handleFileInputChange = useCallback(
        (e) => {
            handleFilePick(e.target.files?.[0]);
            e.target.value = "";
        },
        [handleFilePick],
    );

    const handleDrop = useCallback(
        (e) => {
            e.preventDefault();
            handleFilePick(e.dataTransfer.files?.[0]);
        },
        [handleFilePick],
    );

    const handleDragOver = useCallback((e) => e.preventDefault(), []);

    const handlePaste = useCallback(
        (e) => {
            for (const item of e.clipboardData?.items ?? []) {
                if (item.kind === "file") {
                    const file = item.getAsFile();
                    if (file) {
                        e.preventDefault();
                        handleFilePick(file);
                        return;
                    }
                }
            }
        },
        [handleFilePick],
    );

    /* ── Send ── */
    const handleSend = useCallback(async () => {
        if (disabled || sending) return;
        if (!text.trim() && !attachment) return;

        setSending(true);
        setError(null);

        try {
            await Promise.resolve(
                onSend?.({
                    conversationId,
                    text: text.trim(),
                    attachment,
                }),
            );
            setText("");
            setAttachment(null);
            onStopTyping?.();
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
            textareaRef.current?.focus();
        } catch (err) {
            setError(
                err?.response?.data?.message ??
                    "Failed to send. Please try again.",
            );
        } finally {
            setSending(false);
        }
    }, [
        disabled,
        sending,
        text,
        attachment,
        onSend,
        conversationId,
        onStopTyping,
    ]);

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

    const canSend =
        !disabled && !sending && (text.trim().length > 0 || !!attachment);

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

            {attachment && (
                <AttachmentPreview
                    file={attachment}
                    onRemove={() => setAttachment(null)}
                />
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
                        overlay={<Tooltip>Attach file</Tooltip>}
                    >
                        <Button
                            variant="light"
                            className="msg-composer-icon-btn d-inline-flex align-items-center justify-content-center border-0 rounded-circle flex-shrink-0 ms-1"
                            style={{ width: 40, height: 40 }}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={disabled}
                            aria-label="Attach file"
                        >
                            <FiPaperclip size={20} aria-hidden="true" />
                        </Button>
                    </OverlayTrigger>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={accept}
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
                            disabled={disabled || sending}
                            aria-label={
                                canSend
                                    ? "Send message"
                                    : "Record voice message"
                            }
                        >
                            {sending ? (
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                />
                            ) : canSend ? (
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
