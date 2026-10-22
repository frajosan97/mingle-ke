// components/types/conversation.ts
export type MessageStatus = "sent" | "delivered" | "read";

export interface Conversation {
    id: number | string;
    name: string;
    lastMessage: string;
    lastMessageAt?: string | number | null;
    lastMessageSenderId?: number | string | null;
    lastMessageStatus?: MessageStatus;
    time: string;
    unread: number;
    avatarUrl?: string | null;
    online?: boolean;
    verified?: boolean;
    otherUserId?: number | string | null;
}

export interface MessageAttachment {
    name: string;
    path: string;
    mime: string;
    size: number;
    url: string;
}

export interface ReplyPreview {
    /** Display name of the author of the quoted message. */
    author: string;
    /** Short text or attachment label shown under the author. */
    preview: string;
    /** Optional id of the quoted message, for jump-to. */
    messageId?: number | string;
}

export interface ConversationMessage {
    id: number | string;
    conversation_id?: number | string;
    sender_id?: number | string;
    sender_name?: string;
    content: string | null;
    time: string;
    createdAt?: string;
    created_at?: string;
    mine: boolean;
    read?: boolean;
    delivered?: boolean;
    type: "text" | "image" | "video" | "audio" | "file";
    attachments?: MessageAttachment[];
    deleted?: boolean;
    /** Quoted message preview, when this message is a reply. */
    replyTo?: ReplyPreview;
}