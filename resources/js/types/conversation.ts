// resources/js/types/conversation.ts

export type MessageStatus = "sent" | "delivered" | "read";

/** Inbox row — mirrors App\Data\SharedConversationData. */
export interface Conversation {
    id: number;
    name: string;
    lastMessage: string;
    lastMessageId?: number | null;
    lastMessageAt: string | null;
    lastMessageSenderId: number | null;
    lastMessageStatus: MessageStatus | null;
    time: string;
    unread: number;
    avatarUrl: string | null;
    online: boolean;
    verified: boolean;
    otherUserId: number | null;
}

export type AttachmentKind = "image" | "video" | "audio" | "file";

/** Mirrors App\Models\MessageAttachment as returned by MessageResource. */
export interface MessageAttachment {
    id: number;
    type: AttachmentKind;
    /** Computed by the `url` accessor; may be absent or empty if the file cannot be resolved. */
    url?: string;
    original_name: string | null;
    mime_type: string | null;
    size_bytes: number | null;
    width: number | null;
    height: number | null;
    duration_seconds: number | null;
    position: number;
}

export type MessageType =
    | "text"
    | "image"
    | "video"
    | "audio"
    | "file"
    | "mixed";

export interface ReplyPreview {
    author: string;
    preview: string;
    messageId?: number;
}

/** Mirrors App\Models\Message as returned by MessageResource. */
export interface ConversationMessage {
    id: number;
    conversation_id: number;
    sender_id: number;
    sender_name: string;
    type: MessageType;
    body: string | null;
    attachments?: MessageAttachment[];
    edited_at?: string | null;
    created_at: string;
    time: string;
    // Client-side computed — not from the API.
    mine?: boolean;
    read?: boolean;
    delivered?: boolean;
    deleted?: boolean;
    replyTo?: ReplyPreview;
}