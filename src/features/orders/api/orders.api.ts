import { apiClient } from '@/lib/api/client';
import {
    Order,
    OrderListParams,
    OrderListResponse,
    OrderStats,
    UpdateOrderInput,
    UpdateOrderStatusInput,
    UpdatePaymentStatusInput,
    UpdateTrackingInput,
    AddTrackingEventInput,
    CancelOrderInput,
    OrderStatusHistoryEntry,
    OrderNote,
} from '@/types/order.types';

export const ordersApi = {
    // Note: apiClient.get(url, config) already wraps `config` as
    // `{ params: config }` internally (see lib/api/client.ts) — pass the
    // filters object directly here, not wrapped again in `{ params }`
    // (that would send `?params[status]=...` instead of `?status=...` and
    // silently drop every filter/sort param the gateway expects).
    list: async (params?: OrderListParams): Promise<OrderListResponse> => {
        const data = await apiClient.get<OrderListResponse>('/orders', params);
        return data;
    },

    get: async (id: string): Promise<Order> => {
        const data = await apiClient.get<Order>(`/orders/${id}`);
        return data;
    },

    getByNumber: async (orderNumber: string): Promise<Order> => {
        const data = await apiClient.get<Order>(`/orders/number/${orderNumber}`);
        return data;
    },

    getByCustomer: async (
        customerId: string,
        params?: { page?: number; limit?: number; status?: string },
    ): Promise<OrderListResponse> => {
        const data = await apiClient.get<OrderListResponse>(`/orders/customer/${customerId}`, params);
        return data;
    },

    getStats: async (): Promise<OrderStats> => {
        const data = await apiClient.get<OrderStats>('/orders/stats');
        return data;
    },

    search: async (query: string, limit = 20): Promise<{ query: string; count: number; orders: Order[] }> => {
        const data = await apiClient.get<{ query: string; count: number; orders: Order[] }>('/orders/search', {
            q: query,
            limit,
        });
        return data;
    },

    update: async (id: string, input: UpdateOrderInput): Promise<Order> => {
        const data = await apiClient.put<Order>(`/orders/${id}`, input);
        return data;
    },

    remove: async (id: string): Promise<void> => {
        await apiClient.delete(`/orders/${id}`);
    },

    updateStatus: async (id: string, input: UpdateOrderStatusInput): Promise<Order> => {
        const data = await apiClient.patch<Order>(`/orders/${id}/status`, input);
        return data;
    },

    updatePaymentStatus: async (id: string, input: UpdatePaymentStatusInput): Promise<Order> => {
        const data = await apiClient.patch<Order>(`/orders/${id}/payment-status`, input);
        return data;
    },

    updateTracking: async (id: string, input: UpdateTrackingInput): Promise<Order> => {
        const data = await apiClient.patch<Order>(`/orders/${id}/tracking`, input);
        return data;
    },

    addEvent: async (id: string, input: AddTrackingEventInput): Promise<OrderStatusHistoryEntry> => {
        const data = await apiClient.post<OrderStatusHistoryEntry>(`/orders/${id}/events`, input);
        return data;
    },

    cancel: async (id: string, input: CancelOrderInput): Promise<Order> => {
        const data = await apiClient.post<Order>(`/orders/${id}/cancel`, input);
        return data;
    },

    getHistory: async (id: string): Promise<OrderStatusHistoryEntry[]> => {
        const data = await apiClient.get<OrderStatusHistoryEntry[]>(`/orders/${id}/history`);
        return data;
    },

    // Notes
    getNotes: async (orderId: string): Promise<OrderNote[]> => {
        const data = await apiClient.get<OrderNote[]>(`/orders/${orderId}/notes`);
        return data;
    },

    addNote: async (
        orderId: string,
        dto: { content: string; isInternal?: boolean; authorId: string },
    ): Promise<OrderNote> => {
        const data = await apiClient.post<OrderNote>(`/orders/${orderId}/notes`, dto);
        return data;
    },

    updateNote: async (noteId: string, dto: { content?: string; isInternal?: boolean }): Promise<OrderNote> => {
        const data = await apiClient.put<OrderNote>(`/orders/notes/${noteId}`, dto);
        return data;
    },

    deleteNote: async (noteId: string): Promise<void> => {
        await apiClient.delete(`/orders/notes/${noteId}`);
    },

    // Bulk
    bulkCancel: async (ids: string[]): Promise<void> => {
        await apiClient.post('/orders/bulk/cancel', { ids });
    },
};
