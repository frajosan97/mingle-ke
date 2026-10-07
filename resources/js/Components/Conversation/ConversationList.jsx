// resources/js/Components/Conversation/ConversationList.jsx
import {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    Button,
    Card,
    Form,
    Stack,
    InputGroup,
    Image,
    Badge,
} from "react-bootstrap";
import {
    FiSearch,
    FiMoreVertical,
    FiPlus,
    FiCheck,
    FiCheckCircle,
    FiClock,
} from "react-icons/fi";
import { usePage } from "@inertiajs/react";
import { API } from "@/Lib/Api";
import {
    normalizeConversation,
    formatConvoTime,
    getUserAvatar,
} from "@/Helpers/Functions";
import axios from "axios";

const TYPING_TIMEOUT_MS = 2500;
const SEARCH_DEBOUNCE_MS = 300;
const FILTERS = ["All", "Unread"];

/* ────────────────────────────────────────────────
 |  Tick icon for the last message preview
 * ──────────────────────────────────────────────── */
function TickIcon({ status }) {
    if (!status) return null;

    // Single grey  → sent
    // Double grey  → delivered
    // Double blue  → read
    if (status === "sending") {
        return (
            <FiClock
                size={14}
                className="me-1 flex-shrink-0 text-muted"
                aria-label="Sending"
            />
        );
    }
    if (status === "read") {
        return (
            <FiCheckCircle
                size={14}
                className="me-1 flex-shrink-0 text-info"
                aria-label="Read"
            />
        );
    }
    if (status === "delivered") {
        return (
            <FiCheckCircle
                size={14}
                className="me-1 flex-shrink-0 text-secondary"
                aria-label="Delivered"
            />
        );
    }
    // "sent" (default)
    return (
        <FiCheck
            size={14}
            className="me-1 flex-shrink-0 text-muted"
            aria-label="Sent"
        />
    );
}

/* ────────────────────────────────────────────────
 |  Inline item
 * ──────────────────────────────────────────────── */
function ConversationItem({
    name,
    preview,
    time,
    avatar,
    unreadCount = 0,
    active = false,
    isOnline = false,
    isTyping = false,
    lastMessageOwn = false,
    lastMessageStatus = null,
    onClick,
}) {
    const avatarSrc =
        avatar || getUserAvatar(name, { size: 96, fallbackName: name });

    return (
        <Button
            variant="light"
            onClick={onClick}
            className={`convo-item w-100 text-start border-0 rounded-0 d-flex align-items-center gap-3 px-3 py-2 ${
                active ? "convo-item-active" : ""
            }`}
        >
            <div className="position-relative flex-shrink-0">
                <Image
                    src={avatarSrc}
                    alt=""
                    roundedCircle
                    width={48}
                    height={48}
                    className="convo-item-avatar"
                    style={{ objectFit: "cover" }}
                    onError={(e) => {
                        // If the real URL 404s, swap to initials fallback.
                        e.currentTarget.onerror = null; // prevent loop
                        e.currentTarget.src = getUserAvatar(name, {
                            size: 96,
                            fallbackName: name,
                        });
                    }}
                />
                {isOnline && (
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
                <Stack direction="horizontal" className="align-items-baseline">
                    <span className="fw-semibold text-truncate flex-grow-1 convo-item-name">
                        {name}
                    </span>
                    <span
                        className={`small ms-2 flex-shrink-0 convo-item-time ${
                            active
                                ? "convo-item-time-active"
                                : unreadCount > 0
                                  ? "convo-item-time-unread"
                                  : "convo-item-time-read"
                        }`}
                    >
                        {formatConvoTime(time)}
                    </span>
                </Stack>

                <Stack direction="horizontal" className="align-items-center">
                    {isTyping ? (
                        <span className="text-truncate flex-grow-1 small convo-item-preview fst-italic">
                            <span
                                className="convo-typing-dots"
                                aria-hidden="true"
                            >
                                <span />
                                <span />
                                <span />
                            </span>
                            <span className="ms-1">typing…</span>
                        </span>
                    ) : (
                        <span className="text-truncate flex-grow-1 small convo-item-preview d-flex align-items-center">
                            {lastMessageOwn && lastMessageStatus && (
                                <TickIcon status={lastMessageStatus} />
                            )}
                            <span className="text-truncate">
                                {preview || "\u00A0"}
                            </span>
                        </span>
                    )}

                    {unreadCount > 0 && !isTyping && (
                        <Badge
                            pill
                            className="ms-2 flex-shrink-0 convo-item-badge"
                        >
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                    )}
                </Stack>
            </div>
        </Button>
    );
}

/* ────────────────────────────────────────────────
 |  List
 * ──────────────────────────────────────────────── */
const ConversationList = forwardRef(function ConversationList(
    {
        title = "Conversations",
        activeId = null,
        onSelect,
        onNewConversation,
        onMenu,
        autoFetch = true,
        onlineUsers = {},
        initialConversations = null,
        markReadOnSelect = false,
    },
    ref,
) {
    const user = usePage().props.auth?.user;

    const seedData = useMemo(
        () =>
            (initialConversations?.data ?? []).map((c) =>
                normalizeConversation(c, user?.id),
            ),
        [initialConversations, user?.id],
    );

    const [conversations, setConversations] = useState(seedData);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("All");
    const [loading, setLoading] = useState(seedData.length === 0);
    const [typingConversations, setTypingConversations] = useState(
        () => new Set(),
    );

    const typingTimersRef = useRef(new Map());
    const searchTimerRef = useRef(null);
    const didMountRef = useRef(false);

    /* Seed from server */
    useEffect(() => {
        if (!initialConversations) return;
        setConversations(seedData);
        setLoading(false);
    }, [seedData, initialConversations]);

    /* ── Helpers ── */
    const bumpToTop = useCallback((id, updates = {}) => {
        setConversations((prev) => {
            const updated = prev.map((c) =>
                c.id === id ? { ...c, ...updates } : c,
            );
            return [...updated].sort(
                (a, b) => new Date(b.time ?? 0) - new Date(a.time ?? 0),
            );
        });
    }, []);

    const markAsRead = useCallback((id) => {
        setConversations((prev) =>
            prev.map((c) =>
                c.id === id ? { ...c, read: true, unreadCount: 0 } : c,
            ),
        );
    }, []);

    const clearUnread = useCallback((id) => {
        setConversations((prev) =>
            prev.map((c) =>
                c.id === id ? { ...c, unreadCount: 0, read: true } : c,
            ),
        );
    }, []);

    const refetch = useCallback(
        (params = {}) => {
            return axios
                .get(API.conversations.index(), { params })
                .then(({ data }) =>
                    setConversations(
                        (data.data ?? []).map((c) =>
                            normalizeConversation(c, user?.id),
                        ),
                    ),
                )
                .catch(() => {});
        },
        [user?.id],
    );

    /* ── Debounced search — SKIP the initial run ── */
    useEffect(() => {
        if (!autoFetch) return;

        if (!didMountRef.current) {
            didMountRef.current = true;
            return;
        }

        clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            const params = {};
            if (search.trim()) params.search = search.trim();
            if (filter === "Unread") params.unread = 1;
            refetch(params);
        }, SEARCH_DEBOUNCE_MS);

        return () => clearTimeout(searchTimerRef.current);
    }, [search, filter, refetch, autoFetch]);

    /* ── Typing state ── */
    const clearTyping = useCallback((conversationId) => {
        const timer = typingTimersRef.current.get(conversationId);
        if (timer) {
            clearTimeout(timer);
            typingTimersRef.current.delete(conversationId);
        }
        setTypingConversations((prev) => {
            if (!prev.has(conversationId)) return prev;
            const next = new Set(prev);
            next.delete(conversationId);
            return next;
        });
    }, []);

    const setTyping = useCallback(
        (conversationId, isTyping = true) => {
            if (!conversationId) return;
            const existing = typingTimersRef.current.get(conversationId);
            if (existing) {
                clearTimeout(existing);
                typingTimersRef.current.delete(conversationId);
            }
            setTypingConversations((prev) => {
                const next = new Set(prev);
                if (isTyping) next.add(conversationId);
                else next.delete(conversationId);
                return next;
            });
            if (isTyping) {
                const timer = setTimeout(
                    () => clearTyping(conversationId),
                    TYPING_TIMEOUT_MS,
                );
                typingTimersRef.current.set(conversationId, timer);
            }
        },
        [clearTyping],
    );

    /* ── Realtime: active conversation channel ── */
    useEffect(() => {
        if (!window.Echo || !activeId) return;
        const channelName = `conversation.${activeId}`;
        const channel = window.Echo.private(channelName);

        channel
            .listen(".message.sent", (e) => {
                const isMine = e.sender_id === user?.id;
                setConversations((prev) =>
                    prev.map((c) =>
                        c.id === activeId
                            ? {
                                  ...c,
                                  preview: e.body ?? "[attachment]",
                                  time: e.created_at,
                                  unreadCount: isMine ? c.unreadCount : 0,
                                  read: true,
                                  // ⭐ Update tick state
                                  lastMessageOwn: isMine,
                                  lastMessageStatus: isMine ? "sent" : null,
                              }
                            : c,
                    ),
                );
            })
            .listen(".message.read", (e) => {
                // Only relevant if the row's last message was mine.
                setConversations((prev) =>
                    prev.map((c) =>
                        c.id === activeId &&
                        c.lastMessageOwn &&
                        c.lastMessageStatus !== "read"
                            ? { ...c, lastMessageStatus: "read" }
                            : c,
                    ),
                );
            })
            .listen(".conversation.typing", (e) => {
                if (e.user_id === user?.id) return;
                setTyping(activeId, e.is_typing !== false);
            });

        return () => window.Echo.leave(channelName);
    }, [activeId, user?.id, setTyping]);

    /* ── Cleanup ── */
    useEffect(() => {
        const timers = typingTimersRef.current;
        return () => {
            timers.forEach((t) => clearTimeout(t));
            timers.clear();
            clearTimeout(searchTimerRef.current);
        };
    }, []);

    /* ── Imperative handle ── */
    useImperativeHandle(
        ref,
        () => ({
            bumpToTop,
            markAsRead,
            clearUnread,
            refetch,
            setTyping,
            clearTyping,
            setAll: setConversations,
            getById: (id) => conversations.find((c) => c.id === id),

            onIncomingMessage: (e) => {
                const isMine = e.sender_id === user?.id;
                const isActive = activeId === e.conversation_id;
                setConversations((prev) => {
                    const exists = prev.some((c) => c.id === e.conversation_id);
                    if (!exists) {
                        refetch();
                        return prev;
                    }
                    const updated = prev.map((c) =>
                        c.id === e.conversation_id
                            ? {
                                  ...c,
                                  preview: e.body ?? "[attachment]",
                                  time: e.created_at,
                                  unreadCount:
                                      isMine || isActive
                                          ? c.unreadCount
                                          : (c.unreadCount ?? 0) + 1,
                                  read: isMine ? c.read : isActive,
                                  // ⭐ Update tick state
                                  lastMessageOwn: isMine,
                                  lastMessageStatus: isMine ? "sent" : null,
                              }
                            : c,
                    );
                    return [...updated].sort(
                        (a, b) => new Date(b.time ?? 0) - new Date(a.time ?? 0),
                    );
                });
            },

            onIncomingRead: (e) => {
                // Clear unread if this receipt is for me.
                if (e.user_id === user?.id) {
                    clearUnread(e.conversation_id);
                }

                // If the peer read *my* last message, flip the tick to "read".
                setConversations((prev) =>
                    prev.map((c) =>
                        c.id === e.conversation_id &&
                        c.lastMessageOwn &&
                        c.lastMessageStatus !== "read"
                            ? { ...c, lastMessageStatus: "read" }
                            : c,
                    ),
                );
            },

            onPeerTyping: (e) => {
                if (e.user_id === user?.id) return;
                setTyping(e.conversation_id, e.is_typing !== false);
            },
        }),
        [
            bumpToTop,
            markAsRead,
            clearUnread,
            refetch,
            setTyping,
            clearTyping,
            conversations,
            activeId,
            user?.id,
        ],
    );

    /* ── Select ── */
    const handleSelect = useCallback(
        (chat) => {
            markAsRead(chat.id);
            if (markReadOnSelect) {
                axios.post(API.conversations.read(chat.id)).catch(() => {});
            }
            onSelect?.(chat);
        },
        [markAsRead, onSelect, markReadOnSelect],
    );

    /* ── Client-side filter ── */
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return conversations.filter((c) => {
            if (q) return true;
            if (filter === "Unread") return (c.unreadCount ?? 0) > 0;
            return true;
        });
    }, [conversations, search, filter]);

    return (
        <Card
            className="h-100 d-flex flex-column border-0 rounded-0 convo-list-card"
            style={{ minHeight: 0 }}
        >
            <Card.Header className="convo-list-header d-flex align-items-center justify-content-between flex-shrink-0">
                <h5 className="mb-0 fw-semibold convo-list-title">{title}</h5>
                <Stack direction="horizontal" gap={1}>
                    <Button
                        variant="light"
                        size="sm"
                        className="convo-icon-btn d-inline-flex align-items-center justify-content-center border-0 rounded-circle"
                        style={{ width: 36, height: 36 }}
                        title="Menu"
                        aria-label="Menu"
                        onClick={onMenu}
                    >
                        <FiMoreVertical size={18} />
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        className="convo-new-btn d-inline-flex align-items-center justify-content-center border-0 rounded-circle"
                        style={{ width: 36, height: 36 }}
                        title="New conversation"
                        aria-label="New conversation"
                        onClick={onNewConversation}
                    >
                        <FiPlus size={18} />
                    </Button>
                </Stack>
            </Card.Header>

            <div className="convo-search-wrap px-3 py-2 flex-shrink-0">
                <Form onSubmit={(e) => e.preventDefault()}>
                    <InputGroup className="convo-search-group">
                        <InputGroup.Text className="convo-search-icon">
                            <FiSearch aria-hidden="true" />
                        </InputGroup.Text>
                        <Form.Control
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search conversations"
                            aria-label="Search conversations"
                            className="convo-search-input"
                        />
                    </InputGroup>
                </Form>
            </div>

            <div className="convo-filter-wrap px-3 py-2 flex-shrink-0">
                <Stack direction="horizontal" gap={2} className="flex-wrap">
                    {FILTERS.map((f) => (
                        <Button
                            key={f}
                            variant={
                                filter === f ? "primary" : "outline-secondary"
                            }
                            size="sm"
                            className={`rounded-pill convo-filter-btn ${
                                filter === f ? "convo-filter-btn-active" : ""
                            }`}
                            onClick={() => setFilter(f)}
                            aria-pressed={filter === f}
                        >
                            {f}
                        </Button>
                    ))}
                </Stack>
            </div>

            <Card.Body
                className="flex-grow-1 p-0 convo-list-body"
                style={{
                    minHeight: 0,
                    overflowY: "auto",
                    overflowX: "hidden",
                }}
            >
                {loading && conversations.length === 0 ? (
                    <div className="convo-empty text-center py-5 small">
                        Loading…
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="convo-empty text-center py-5 small">
                        No conversations found
                    </div>
                ) : (
                    <Stack direction="vertical" gap={0}>
                        {filtered.map((chat) => (
                            <ConversationItem
                                key={chat.id}
                                name={chat.name}
                                preview={chat.preview}
                                time={chat.time}
                                avatar={chat.avatar}
                                unreadCount={chat.unreadCount ?? 0}
                                active={activeId === chat.id}
                                isTyping={typingConversations.has(chat.id)}
                                isOnline={
                                    onlineUsers[chat.otherUserId]?.isOnline ??
                                    chat.isOnline ??
                                    false
                                }
                                lastMessageOwn={chat.lastMessageOwn}
                                lastMessageStatus={chat.lastMessageStatus}
                                onClick={() => handleSelect(chat)}
                            />
                        ))}
                    </Stack>
                )}
            </Card.Body>
        </Card>
    );
});

export default ConversationList;
