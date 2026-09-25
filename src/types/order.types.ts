export type OrderStatus =
    | 'PENDING'
    | 'CONFIRMED'
    | 'PROCESSING'
    | 'SHIPPED'
    | 'DELIVERED'
    | 'CANCELLED'
    | 'REFUNDED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';

export interface OrderAddress {
    label?: string;
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    phone?: string;
}

export interface OrderItem {
    id: string;
    orderId: string;
    productId: string;
    variantId?: string;
    sku: string;
    name: string;
    image?: string;
    unitPrice: string | number;
    quantity: number;
    subtotal: string | number;
    attributes?: Record<string, unknown>;
    createdAt: string;
}

export type TimelineEntryType = 'STATUS' | 'TRACKING' | 'PAYMENT' | 'UPDATE';

export interface OrderStatusHistoryEntry {
    id: string;
    orderId: string;
    type?: TimelineEntryType;
    status: string;
    note?: string;
    location?: string;
    /** false = internal, hidden from the customer's tracker */
    isPublic?: boolean;
    changedBy?: string;
    /** admin email, or "customer" / "system" */
    actor?: string;
    createdAt: string;
}

export interface OrderNote {
    id: string;
    orderId: string;
    content: string;
    authorId: string;
    isInternal: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Order {
    id: string;
    orderNumber: string;
    customerId: string;
    customerEmail: string;
    customerName: string;
    customerPhone?: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    paymentMethod?: string;
    currency: string;
    subtotal: string | number;
    taxAmount: string | number;
    shippingAmount: string | number;
    discountAmount: string | number;
    total: string | number;
    couponCode?: string;
    customerNote?: string;
    shippingAddress: OrderAddress;
    billingAddress?: OrderAddress;
    trackingNumber?: string;
    trackingCarrier?: string;
    estimatedDeliveryAt?: string;
    /** Server-computed next statuses this order may move to. */
    allowedTransitions?: OrderStatus[];
    shippedAt?: string;
    deliveredAt?: string;
    cancelledAt?: string;
    cancelReason?: string;
    items?: OrderItem[];
    statusHistory?: OrderStatusHistoryEntry[];
    _count?: { items: number; notes: number };
    createdAt: string;
    updatedAt: string;
}

export interface OrderListParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: OrderStatus | string;
    paymentStatus?: PaymentStatus | string;
    customerId?: string;
    /** orders that contain this product */
    productId?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: 'createdAt' | 'total' | 'status' | 'orderNumber';
    sortOrder?: 'asc' | 'desc';
}

export interface OrderListResponse {
    data: Order[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface OrderStatsDay {
    date: string; // YYYY-MM-DD, server local time
    orders: number;
    revenue: number; // paid orders only
}

export interface OrderStats {
    totalOrders: number;
    totalRevenue: string | number;
    byStatus: Record<string, number>;
    /** Rolling window (last 30 days incl. today), excluding cancelled/refunded. */
    period?: { days: number; orders: number; revenue: number; previousOrders: number; previousRevenue: number };
    today?: { orders: number; revenue: number };
    daily?: OrderStatsDay[];
}

export interface CreateOrderItemInput {
    productId: string;
    variantId?: string;
    sku: string;
    name: string;
    image?: string;
    unitPrice: number;
    quantity: number;
    attributes?: Record<string, unknown>;
}

export interface CreateOrderPayload {
    customerId: string;
    customerEmail: string;
    customerName: string;
    customerPhone?: string;
    items: CreateOrderItemInput[];
    shippingAddress: OrderAddress;
    billingAddress?: OrderAddress;
    paymentMethod?: string;
    currency?: string;
    taxAmount?: number;
    shippingAmount?: number;
    discountAmount?: number;
    couponCode?: string;
    customerNote?: string;
}

export interface UpdateOrderInput {
    shippingAddress?: OrderAddress;
    billingAddress?: OrderAddress;
    paymentMethod?: string;
    customerNote?: string;
    couponCode?: string;
}

// Audit fields (changedBy/actor) are set by the gateway from the JWT — not sent from here.
export interface UpdateOrderStatusInput {
    status: OrderStatus;
    note?: string;
    location?: string;
    isPublic?: boolean;
    trackingCarrier?: string;
    trackingNumber?: string;
    estimatedDeliveryAt?: string;
    paymentCollected?: boolean;
}

export interface UpdatePaymentStatusInput {
    paymentStatus: PaymentStatus;
    paymentMethod?: string;
    note?: string;
}

export interface UpdateTrackingInput {
    trackingNumber?: string;
    trackingCarrier?: string;
    estimatedDeliveryAt?: string;
}

export interface AddTrackingEventInput {
    note: string;
    location?: string;
    isPublic?: boolean;
}

export interface CancelOrderInput {
    reason?: string;
    changedBy?: string;
}
