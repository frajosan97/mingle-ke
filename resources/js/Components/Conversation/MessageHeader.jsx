// resources/js/Components/Conversation/MessageHeader.jsx
import { Button, Image, Stack, Dropdown } from "react-bootstrap";
import {
    FiMoreVertical,
    FiX,
    FiTrash2,
    FiSlash,
    FiBellOff,
    FiBell,
    FiUserX,
    FiUserCheck,
} from "react-icons/fi";
import { getUserAvatar } from "@/Helpers/Functions";

export default function MessageHeader({
    name,
    avatar,
    status = "offline",
    isTyping = false,
    isOnline = false,
    isMuted = false,
    isBlocked = false,
    onBack,
    onCall,
    onVideo,
    onClose, // close the chat panel (deselect)
    onClear, // clear messages in this conversation
    onDelete, // delete the conversation entirely
    onMute, // toggle mute (passes the new value)
    onBlock, // toggle block (passes the new value)
    onMenu, // optional legacy hook — kept for backward compat
}) {
    // Ensure the avatar always resolves — falls back to initials if `avatar` is missing.
    const avatarSrc = avatar || getUserAvatar(name, { fallbackName: "User" });

    const handleSelect = (eventKey, e) => {
        e?.preventDefault?.();
        switch (eventKey) {
            case "close":
                onClose?.();
                break;
            case "clear":
                onClear?.();
                break;
            case "mute":
                onMute?.(!isMuted);
                break;
            case "block":
                onBlock?.(!isBlocked);
                break;
            case "delete":
                onDelete?.();
                break;
            default:
                break;
        }
    };

    return (
        <div className="msg-header d-flex align-items-center gap-3 px-3 py-2 flex-shrink-0">
            {onBack && (
                <Button
                    variant="light"
                    className="msg-header-btn d-md-none d-inline-flex align-items-center justify-content-center border-0 rounded-circle flex-shrink-0"
                    style={{ width: 36, height: 36 }}
                    onClick={onBack}
                    aria-label="Back"
                >
                    <i className="bi bi-arrow-left" aria-hidden="true" />
                </Button>
            )}

            <div className="position-relative flex-shrink-0">
                <Image
                    src={avatarSrc}
                    alt=""
                    roundedCircle
                    width={40}
                    height={40}
                    className="msg-header-avatar"
                    style={{ objectFit: "cover" }}
                    onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getUserAvatar(name, {
                            fallbackName: "User",
                        });
                    }}
                />
                {isOnline && !isTyping && (
                    <span
                        className="position-absolute bottom-0 end-0 bg-success rounded-circle border border-2 border-white"
                        style={{ width: 12, height: 12 }}
                        aria-label="Online"
                    />
                )}
            </div>

            <div
                className="flex-grow-1 overflow-hidden"
                style={{ minWidth: 0 }}
            >
                <div className="fw-semibold text-truncate msg-header-name">
                    {name}
                    {isMuted && (
                        <FiBellOff
                            size={14}
                            className="ms-2 text-muted"
                            aria-label="Muted"
                        />
                    )}
                    {isBlocked && (
                        <FiSlash
                            size={14}
                            className="ms-2 text-danger"
                            aria-label="Blocked"
                        />
                    )}
                </div>
                <div
                    className={`small text-truncate msg-header-status ${
                        isTyping ? "text-success fst-italic" : ""
                    }`}
                >
                    {status}
                </div>
            </div>

            <Stack direction="horizontal" gap={1} className="flex-shrink-0">
                <Button
                    variant="light"
                    className="msg-header-btn d-inline-flex align-items-center justify-content-center border-0 rounded-circle"
                    style={{ width: 36, height: 36 }}
                    onClick={onVideo}
                    aria-label="Video call"
                >
                    <i className="bi bi-camera-video" aria-hidden="true" />
                </Button>
                <Button
                    variant="light"
                    className="msg-header-btn d-inline-flex align-items-center justify-content-center border-0 rounded-circle"
                    style={{ width: 36, height: 36 }}
                    onClick={onCall}
                    aria-label="Voice call"
                >
                    <i className="bi bi-telephone" aria-hidden="true" />
                </Button>

                <Dropdown
                    align="end"
                    onSelect={handleSelect}
                    onClick={(e) => e.stopPropagation()}
                >
                    <Dropdown.Toggle
                        as={Button}
                        variant="light"
                        className="msg-header-btn d-inline-flex align-items-center justify-content-center border-0 rounded-circle"
                        style={{ width: 36, height: 36 }}
                        bsPrefix="btn"
                        aria-label="Menu"
                        id="msg-header-menu"
                    >
                        <FiMoreVertical size={18} />
                    </Dropdown.Toggle>

                    <Dropdown.Menu className="msg-header-menu shadow-sm">
                        <Dropdown.Item eventKey="close">
                            <FiX className="me-2" size={16} />
                            Close chat
                        </Dropdown.Item>

                        <Dropdown.Item eventKey="clear">
                            <FiTrash2 className="me-2" size={16} />
                            Clear chat
                        </Dropdown.Item>

                        <Dropdown.Item eventKey="mute">
                            {isMuted ? (
                                <FiBell className="me-2" size={16} />
                            ) : (
                                <FiBellOff className="me-2" size={16} />
                            )}
                            {isMuted ? "Unmute" : "Mute"}
                        </Dropdown.Item>

                        <Dropdown.Item eventKey="block">
                            {isBlocked ? (
                                <FiUserCheck className="me-2" size={16} />
                            ) : (
                                <FiUserX className="me-2" size={16} />
                            )}
                            {isBlocked ? "Unblock" : "Block"}
                        </Dropdown.Item>

                        <Dropdown.Divider />

                        <Dropdown.Item
                            eventKey="delete"
                            className="text-danger"
                        >
                            <FiTrash2 className="me-2" size={16} />
                            Delete chat
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </Stack>
        </div>
    );
}
