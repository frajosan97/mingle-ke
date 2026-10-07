// resources/js/Pages/Conversation/Index.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { Row, Col } from "react-bootstrap";
import { useTyping } from "@/Hooks/useTyping";
import { API, WEB } from "@/Lib/Api";
import axios from "axios";

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import EmptyState from "@/Components/Conversation/EmptyState";
import ConversationList from "@/Components/Conversation/ConversationList";
import MessageView from "@/Components/Conversation/MessageView";
import { usePushNotifications } from "@/Hooks/usePushNotifications";

const LIST_WIDTH = 360;

export default function ConversationIndex({
    activeRail = "conversations",
    conversations: initialConversations = null,
    activeConversation = null,
    messages: initialMessages = [],
    vapidPublicKey = null,
}) {
    const user = usePage().props.auth?.user;

    const listRef = useRef(null);
    const selectedConversation = activeConversation;

    const [messagesByConv, setMessagesByConv] = useState(() =>
        activeConversation ? { [activeConversation.id]: initialMessages } : {},
    );
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState({});

    const { typingNames, isAnyoneTyping, notifyTyping, stopTyping } = useTyping(
        selectedConversation?.id,
        user?.id,
    );

    const { permission, subscribed, subscribe } =
        usePushNotifications(vapidPublicKey);

    // Ask once, after the user has had a moment on the page.
    useEffect(() => {
        if (!vapidPublicKey) return;
        if (permission !== "default") return;
        if (sessionStorage.getItem("push-prompted")) return;

        const t = setTimeout(() => {
            subscribe().finally(() =>
                sessionStorage.setItem("push-prompted", "1"),
            );
        }, 3000);

        return () => clearTimeout(t);
    }, [vapidPublicKey, permission, subscribe]);

    /* ── Seed messages on navigation ── */
    useEffect(() => {
        if (!activeConversation) return;
        setMessagesByConv((prev) => ({
            ...prev,
            [activeConversation.id]: initialMessages,
        }));
    }, [activeConversation?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ── Fallback fetch if thread is empty ── */
    useEffect(() => {
        if (!selectedConversation) return;
        if (messagesByConv[selectedConversation.id]?.length) return;

        let cancelled = false;
        setLoadingMessages(true);

        axios
            .get(API.messages.index(selectedConversation.id))
            .then(({ data }) => {
                if (cancelled) return;
                setMessagesByConv((prev) => ({
                    ...prev,
                    [selectedConversation.id]: [...(data.data ?? [])].reverse(),
                }));
            })
            .finally(() => {
                if (!cancelled) setLoadingMessages(false);
            });

        return () => {
            cancelled = true;
        };
    }, [selectedConversation?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ── Shared handlers ── */

    /** Flip one specific message's read state for the peer. */
    const applyReadReceipt = useCallback((conversationId, event) => {
        setMessagesByConv((prev) => ({
            ...prev,
            [conversationId]: (prev[conversationId] ?? []).map((m) =>
                m.id === event.message_id
                    ? {
                          ...m,
                          reads: [
                              ...(m.reads ?? []).filter(
                                  (r) => r.user_id !== event.user_id,
                              ),
                              {
                                  user_id: event.user_id,
                                  read_at: event.read_at,
                              },
                          ],
                      }
                    : m,
            ),
        }));
    }, []);

    /**
     * Bulk mark every one of MY messages as read by the peer.
     * Used for the `.conversation.read` event, which doesn't carry a
     * specific message id.
     */
    const applyConversationRead = useCallback(
        (conversationId, event) => {
            if (event.user_id === user?.id) return;

            setMessagesByConv((prev) => ({
                ...prev,
                [conversationId]: (prev[conversationId] ?? []).map((m) => {
                    // Only my messages carry sender-side ticks.
                    if (m.sender_id !== user?.id) return m;

                    const alreadyRead = (m.reads ?? []).some(
                        (r) => r.user_id === event.user_id,
                    );
                    if (alreadyRead) return m;

                    return {
                        ...m,
                        reads: [
                            ...(m.reads ?? []),
                            {
                                user_id: event.user_id,
                                read_at: event.read_at,
                            },
                        ],
                    };
                }),
            }));
        },
        [user?.id],
    );

    const appendIncomingMessage = useCallback((conversationId, event) => {
        setMessagesByConv((prev) => {
            const list = prev[conversationId] ?? [];
            if (list.some((m) => m.id === event.id)) return prev;
            return { ...prev, [conversationId]: [...list, event] };
        });
    }, []);

    const handleIncomingMessage = useCallback(
        (event) => {
            listRef.current?.onIncomingMessage(event);

            if (event.conversation_id === selectedConversation?.id) {
                if (event.sender_id === user?.id) return;

                appendIncomingMessage(event.conversation_id, event);

                axios.post(API.messages.delivered(event.id)).catch(() => {});
                axios.post(API.messages.read(event.id)).catch(() => {});
            }
        },
        [selectedConversation?.id, user?.id, appendIncomingMessage],
    );

    const handleIncomingRead = useCallback(
        (event) => {
            listRef.current?.onIncomingRead(event);

            if (event.conversation_id === selectedConversation?.id) {
                applyReadReceipt(event.conversation_id, event);
            }
        },
        [selectedConversation?.id, applyReadReceipt],
    );

    const handleConversationRead = useCallback(
        (event) => {
            // Update the list — clear badges, flip ticks.
            listRef.current?.onIncomingRead(event);

            // Update the open thread — bulk-mark my messages as read.
            if (event.conversation_id === selectedConversation?.id) {
                applyConversationRead(event.conversation_id, event);
            }
        },
        [selectedConversation?.id, applyConversationRead],
    );

    /* ── Realtime: user channel — always active ── */
    useEffect(() => {
        if (!window.Echo || !user?.id) return;

        const channelName = `user.${user.id}`;
        const channel = window.Echo.private(channelName);

        channel
            .listen(".message.sent", handleIncomingMessage)
            .listen(".message.read", handleIncomingRead)
            .listen(".conversation.read", handleConversationRead)
            .listen(".user.status", (e) => {
                setOnlineUsers((prev) => ({
                    ...prev,
                    [e.user_id]: {
                        isOnline: e.is_online,
                        lastActiveAt: e.last_active_at,
                    },
                }));
            });

        return () => window.Echo.leave(channelName);
    }, [
        user?.id,
        handleIncomingMessage,
        handleIncomingRead,
        handleConversationRead,
    ]);

    /* ── Realtime: active conversation channel ── */
    useEffect(() => {
        if (!selectedConversation || !window.Echo) return;

        const conversationId = selectedConversation.id;
        const channelName = `conversation.${conversationId}`;
        const channel = window.Echo.private(channelName);

        channel
            .listen(".message.sent", (e) => {
                if (e.sender_id === user?.id) return;
                appendIncomingMessage(conversationId, e);
                axios.post(API.messages.delivered(e.id)).catch(() => {});
                axios.post(API.messages.read(e.id)).catch(() => {});
            })
            .listen(".message.updated", (e) => {
                setMessagesByConv((prev) => ({
                    ...prev,
                    [conversationId]: (prev[conversationId] ?? []).map((m) =>
                        m.id === e.id ? { ...m, ...e } : m,
                    ),
                }));
            })
            .listen(".message.deleted", (e) => {
                setMessagesByConv((prev) => ({
                    ...prev,
                    [conversationId]: (prev[conversationId] ?? []).filter(
                        (m) => m.id !== e.id,
                    ),
                }));
            })
            .listen(".message.read", (e) => {
                applyReadReceipt(conversationId, e);
            })
            .listen(".conversation.read", (e) => {
                applyConversationRead(conversationId, e);
            })
            .listen(".conversation.typing", (e) => {
                if (e.user_id === user?.id) return;
                listRef.current?.onPeerTyping(e);
            });

        return () => window.Echo.leave(channelName);
    }, [
        selectedConversation?.id,
        user?.id,
        appendIncomingMessage,
        applyReadReceipt,
        applyConversationRead,
    ]);

    /* ── Send ── */
    const handleSendMessage = useCallback(
        async ({ conversationId, text, attachments }) => {
            const trimmed = text?.trim();

            // Normalize to array — supports single File or File[].
            const files = Array.isArray(attachments)
                ? attachments.filter(Boolean)
                : attachments
                  ? [attachments]
                  : [];

            if (!trimmed && files.length === 0) return;

            stopTyping();

            const tempId = `temp-${Date.now()}`;

            // Create blob URLs for optimistic preview.
            const blobUrls = files.map((f) => URL.createObjectURL(f));

            // Infer type from the first file.
            const firstFile = files[0];
            const inferredType = firstFile
                ? firstFile.type.startsWith("image/")
                    ? "image"
                    : firstFile.type.startsWith("audio/")
                      ? "audio"
                      : firstFile.type.startsWith("video/")
                        ? "video"
                        : "file"
                : "text";

            const optimisticAttachments = files.map((f, i) => ({
                url: blobUrls[i],
                name: f.name,
                mime: f.type,
                size: f.size,
            }));

            const optimistic = {
                id: tempId,
                __optimistic: true,
                conversation_id: conversationId,
                sender_id: user?.id,
                sender: {
                    id: user?.id,
                    name: user?.name,
                    avatar: user?.avatar,
                },
                type: inferredType,
                body: trimmed || null,
                attachments: optimisticAttachments,
                created_at: new Date().toISOString(),
                status: "sending",
                uploadPct: files.length ? 0 : undefined,
                reads: [],
            };

            setMessagesByConv((prev) => ({
                ...prev,
                [conversationId]: [...(prev[conversationId] ?? []), optimistic],
            }));

            try {
                let response;

                if (files.length > 0) {
                    const form = new FormData();
                    if (trimmed) form.append("body", trimmed);
                    form.append("type", inferredType);

                    // ⭐ Backend reads `attachments[]`.
                    files.forEach((file, i) => {
                        form.append(`attachments[${i}]`, file, file.name);
                    });

                    response = await axios.post(
                        API.messages.store(conversationId),
                        form,
                        {
                            onUploadProgress: (e) => {
                                if (!e.total) return;
                                const pct = Math.round(
                                    (e.loaded / e.total) * 100,
                                );
                                setMessagesByConv((prev) => ({
                                    ...prev,
                                    [conversationId]: (
                                        prev[conversationId] ?? []
                                    ).map((m) =>
                                        m.id === tempId
                                            ? { ...m, uploadPct: pct }
                                            : m,
                                    ),
                                }));
                            },
                        },
                    );
                } else {
                    response = await axios.post(
                        API.messages.store(conversationId),
                        { type: "text", body: trimmed },
                    );
                }

                const serverMessage =
                    response.data?.data ??
                    response.data?.message ??
                    response.data;

                setMessagesByConv((prev) => ({
                    ...prev,
                    [conversationId]: (prev[conversationId] ?? []).map((m) =>
                        m.id === tempId
                            ? {
                                  ...serverMessage,
                                  id: serverMessage?.id ?? m.id,
                                  body: serverMessage?.body ?? m.body,
                                  type: serverMessage?.type ?? m.type,
                                  attachments:
                                      serverMessage?.attachments ??
                                      m.attachments ??
                                      [],
                                  sender_id:
                                      serverMessage?.sender_id ?? m.sender_id,
                                  sender: serverMessage?.sender ?? m.sender,
                                  created_at:
                                      serverMessage?.created_at ??
                                      m.created_at ??
                                      new Date().toISOString(),
                                  status: "sent",
                                  reads: serverMessage?.reads ?? [],
                                  uploadPct: undefined,
                                  __optimistic: false,
                              }
                            : m,
                    ),
                }));

                blobUrls.forEach((u) => URL.revokeObjectURL(u));

                listRef.current?.bumpToTop(conversationId, {
                    preview:
                        trimmed ||
                        (files.length === 1
                            ? "[attachment]"
                            : `[${files.length} attachments]`),
                    time: new Date().toISOString(),
                    lastMessageOwn: true,
                    lastMessageStatus: "sent",
                });
            } catch (err) {
                console.error(
                    "Send failed:",
                    err.response?.status,
                    err.response?.data,
                );

                setMessagesByConv((prev) => ({
                    ...prev,
                    [conversationId]: (prev[conversationId] ?? []).map((m) =>
                        m.id === tempId
                            ? { ...m, status: "failed", uploadPct: undefined }
                            : m,
                    ),
                }));

                throw err;
            }
        },
        [user, stopTyping],
    );

    /* ── Navigation ── */
    const handleSelectConversation = useCallback((conversation) => {
        if (!conversation?.id) return;
        router.get(
            WEB.conversations.show(conversation.id),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                only: ["activeConversation", "messages"],
            },
        );
    }, []);

    const handleBack = useCallback(() => {
        router.get(WEB.conversations.index(), {}, { preserveScroll: true });
    }, []);

    const handleNewConversation = useCallback(() => {
        router.visit(route("escort.index"));
    }, []);

    const handleEmptyAction = useCallback((label) => {
        if (label === "Browse escorts") router.visit(route("escort.index"));
        if (label === "Find someone") router.visit(route("users.index"));
    }, []);

    const title = useMemo(
        () => activeRail.charAt(0).toUpperCase() + activeRail.slice(1),
        [activeRail],
    );

    return (
        <AuthenticatedLayout activeRail={activeRail}>
            <Head
                title={
                    selectedConversation
                        ? `Conversation · ${selectedConversation.name}`
                        : "Conversations"
                }
            />

            <Row
                className="chat-page g-0 flex-grow-1 h-100"
                style={{ minHeight: 0, overflow: "hidden" }}
            >
                <Col
                    xs="auto"
                    className="chat-list-col d-flex flex-column h-100"
                    style={{
                        width: LIST_WIDTH,
                        minWidth: LIST_WIDTH,
                        minHeight: 0,
                        overflow: "hidden",
                    }}
                >
                    <ConversationList
                        ref={listRef}
                        title={title}
                        activeId={selectedConversation?.id}
                        onSelect={handleSelectConversation}
                        onNewConversation={handleNewConversation}
                        onlineUsers={onlineUsers}
                        initialConversations={initialConversations}
                        markReadOnSelect={false}
                    />
                </Col>

                <Col
                    className="chat-pane-col d-flex flex-column h-100"
                    style={{
                        minWidth: 0,
                        minHeight: 0,
                        overflow: "hidden",
                    }}
                >
                    {selectedConversation ? (
                        <MessageView
                            conversation={selectedConversation}
                            messages={
                                messagesByConv[selectedConversation.id] || []
                            }
                            loading={loadingMessages}
                            currentUserId={user?.id}
                            onSend={handleSendMessage}
                            onBack={handleBack}
                            onTyping={notifyTyping}
                            onStopTyping={stopTyping}
                            typingNames={typingNames}
                            isAnyoneTyping={isAnyoneTyping}
                            onlineUsers={onlineUsers}
                        />
                    ) : (
                        <EmptyState onAction={handleEmptyAction} />
                    )}
                </Col>
            </Row>
        </AuthenticatedLayout>
    );
}
