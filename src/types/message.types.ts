// src/types/message.types.ts
export type MessageStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type MessagePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface MessageReply {
    id: string;
    messageId: string;
    body: string;
    authorId: string;
    /** staff email, set server-side */
    authorName?: string | null;
    isInternal: boolean;
    createdAt: string;
}

export interface SupportMessage {
    id: string;
    customerId?: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    subject: string;
    body: string;
    status: MessageStatus;
    priority: MessagePriority;
    orderId?: string;
    orderNumber?: string;
    assignedTo?: string | null;
    assignedToName?: string | null;
    resolvedAt?: string;
    replies?: MessageReply[];
    _count?: { replies: number };
    createdAt: string;
    updatedAt: string;
}

export interface MessageListParams {
    search?: string;
    status?: MessageStatus;
    priority?: MessagePriority;
    sortBy?: 'createdAt' | 'updatedAt' | 'priority';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
    /** a staff user id, or "none" for unassigned */
    assignedTo?: string;
}

export interface MessageListResponse {
    data: SupportMessage[];
    meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface MessageStats {
    total: number;
    byStatus: Record<string, number>;
    urgentOpen: number;
}

export interface CreateMessageInput {
    customerId?: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    subject: string;
    body: string;
    priority?: MessagePriority;
    orderId?: string;
    orderNumber?: string;
}

/** The author is the signed-in user — the gateway sets it from the token. */
export interface ReplyMessageInput {
    body: string;
    isInternal?: boolean;
}

/** Partial update; `null` clears assignee / linked order. */
export interface UpdateMessageInput {
    status?: MessageStatus;
    priority?: MessagePriority;
    assignedTo?: string | null;
    assignedToName?: string | null;
    orderNumber?: string | null;
    orderId?: string | null;
}

export interface UpdateMessageStatusInput {
    status: MessageStatus;
    assignedTo?: string;
}
