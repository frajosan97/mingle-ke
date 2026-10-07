// resources/js/Components/Chat/MessageBubble.jsx
import { Image } from "react-bootstrap";

const STATUS_ICON = {
    sending: "bi-clock",
    sent: "bi-check2",
    read: "bi-check2-all",
    failed: "bi-exclamation-circle text-danger",
};

export default function MessageBubble({
    text,
    time,
    own = false,
    type = "text",
    attachment = null,
    status = "sent",
    senderName,
}) {
    const metaClass = own
        ? "msg-bubble-meta msg-bubble-meta-own"
        : "msg-bubble-meta msg-bubble-meta-other";

    const tickClass =
        status === "read"
            ? "msg-bubble-tick-read"
            : status === "sent"
              ? "msg-bubble-tick-delivered"
              : "";

    return (
        <div
            className={`d-flex mb-1 ${
                own ? "justify-content-end" : "justify-content-start"
            }`}
        >
            <div
                className={`p-2 px-3 rounded-3 shadow-sm msg-bubble ${
                    own ? "msg-bubble-own" : "msg-bubble-other"
                }`}
                style={{ maxWidth: "70%" }}
            >
                {!own && senderName && (
                    <div className="fw-semibold small mb-1 msg-bubble-sender">
                        {senderName}
                    </div>
                )}

                {type === "image" && attachment && (
                    <Image src={`/storage/${attachment}`} fluid rounded />
                )}

                {type === "file" && attachment && (
                    <a
                        href={`/storage/${attachment}`}
                        target="_blank"
                        rel="noreferrer"
                        className="d-block small mb-1"
                    >
                        <i className="bi bi-paperclip me-1" /> Download
                        attachment
                    </a>
                )}

                {text && (
                    <div className="text-break msg-bubble-text">{text}</div>
                )}

                <div
                    className={`d-flex align-items-center justify-content-end gap-1 mt-1 small ${metaClass}`}
                >
                    <span>{time}</span>
                    {own && (
                        <i
                            className={`bi ${STATUS_ICON[status] ?? "bi-check2"} ${tickClass}`}
                            aria-hidden="true"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
