export const API = {
    conversations: {
        index: () => `/api/conversations`,
        store: () => `/api/conversations`,
        show: (id) => `/api/conversations/${id}`,
        update: (id) => `/api/conversations/${id}`,
        destroy: (id) => `/api/conversations/${id}`,
        read: (id) => `/api/conversations/${id}/read`,
        delivered: (id) => `/api/conversations/${id}/delivered`,
        typing: (id) => `/api/conversations/${id}/typing`,
    },
    messages: {
        index: (conversationId) =>
            `/api/conversations/${conversationId}/messages`,
        store: (conversationId) =>
            `/api/conversations/${conversationId}/messages`,
        show: (id) => `/api/messages/${id}`,
        update: (id) => `/api/messages/${id}`,
        destroy: (id) => `/api/messages/${id}`,
        read: (id) => `/api/messages/${id}/read`,
        delivered: (id) => `/api/messages/${id}/delivered`,
    },
};

export const WEB = {
    conversations: {
        index: () => route("conversations.index"),
        show: (id) => route("conversations.show", id),
    },
};
