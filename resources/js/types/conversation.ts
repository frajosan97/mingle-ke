// resources/js/types/conversation.ts

export type MessageStatus = "pending" | "sent" | "delivered" | "read";

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

export interface MessageAttachment {
    id: number;
    type: AttachmentKind;
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
    mine?: boolean;
    read?: boolean;
    delivered?: boolean;
    status: MessageStatus;
    deleted?: boolean;
    replyTo?: ReplyPreview;
}