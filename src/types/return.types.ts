export type ReturnStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'RECEIVED' | 'REFUNDED';

export interface ReturnItem {
    id: string;
    orderItemId: string;
    productId: string;
    sku: string;
    name: string;
    quantity: number;
    unitPrice: string | number;
}

export interface AdminReturn {
    id: string;
    rmaNumber: string;
    orderId: string;
    customerId: string;
    status: ReturnStatus;
    reason: string;
    reasonLabel: string;
    ourFault: boolean;
    details?: string | null;
    photos: string[];
    resolution: 'REFUND' | 'EXCHANGE';
    instructions?: string | null;
    rejectReason?: string | null;
    restocked: boolean;
    refundAmount?: string | number | null;
    adminNote?: string | null;
    createdAt: string;
    approvedAt?: string | null;
    rejectedAt?: string | null;
    receivedAt?: string | null;
    refundedAt?: string | null;
    items: ReturnItem[];
    order: {
        id: string; orderNumber: string; customerName: string; customerEmail: string;
        total: string | number; shippingAmount: string | number; currency: string;
        paymentMethod?: string | null; paymentStatus: string;
    };
}

export interface ReturnListResponse {
    data: AdminReturn[];
    meta: { total: number; page: number; limit: number; totalPages: number };
    byStatus: Partial<Record<ReturnStatus, number>>;
}

export interface RefundDueOrder {
    id: string;
    orderNumber: string;
    customerName: string;
    total: string | number;
    currency: string;
    cancelledAt?: string | null;
}
