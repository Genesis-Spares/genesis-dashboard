// src/types/activity.types.ts
// Types for the dashboard's "Logs" panel — a merged, chronological feed of
// order status changes and staff/user actions across the whole system.

export interface OrderActivityEntry {
    id: string;
    orderId: string;
    status: string;
    note?: string;
    changedBy?: string;
    createdAt: string;
    // Present on the global feed (order.activity.recent) — absent on the
    // per-order history endpoint, which doesn't need it.
    order?: {
        id: string;
        orderNumber: string;
        customerName: string;
    };
}

export interface OrderActivityResponse {
    data: OrderActivityEntry[];
}

export interface StaffActivityEntry {
    id: string;
    userId: string;
    action: string;
    resource?: string;
    resourceId?: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
}

export interface StaffActivityResponse {
    data: StaffActivityEntry[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

// A single normalized row the "Logs" panel can render regardless of source.
export type ActivityLogEntry =
    | { kind: 'order'; id: string; createdAt: string; entry: OrderActivityEntry }
    | { kind: 'staff'; id: string; createdAt: string; entry: StaffActivityEntry };
