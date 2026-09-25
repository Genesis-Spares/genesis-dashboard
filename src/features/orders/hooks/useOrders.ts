import {
    useMutation,
    useQuery,
    useQueryClient,
    keepPreviousData,
} from '@tanstack/react-query';
import { ordersApi } from '../api/orders.api';
import {
    OrderListParams,
    UpdateOrderInput,
    UpdateOrderStatusInput,
    UpdatePaymentStatusInput,
    UpdateTrackingInput,
    AddTrackingEventInput,
    CancelOrderInput,
} from '@/types/order.types';

const orderKeys = {
    all: ['orders'] as const,
    lists: () => [...orderKeys.all, 'list'] as const,
    list: (params?: OrderListParams) => [...orderKeys.lists(), params] as const,
    details: () => [...orderKeys.all, 'detail'] as const,
    detail: (id: string) => [...orderKeys.details(), id] as const,
    history: (id: string) => [...orderKeys.detail(id), 'history'] as const,
    notes: (id: string) => [...orderKeys.detail(id), 'notes'] as const,
    stats: () => [...orderKeys.all, 'stats'] as const,
    byCustomer: (customerId: string, params?: { page?: number; limit?: number; status?: string }) =>
        [...orderKeys.all, 'by-customer', customerId, params] as const,
};

export const useOrders = (params?: OrderListParams) => {
    return useQuery({
        queryKey: orderKeys.list(params),
        queryFn: () => ordersApi.list(params),
        placeholderData: keepPreviousData,
    });
};

export const useOrder = (id: string | undefined) => {
    return useQuery({
        queryKey: orderKeys.detail(id ?? ''),
        queryFn: () => ordersApi.get(id as string),
        enabled: Boolean(id),
    });
};

export const useOrdersByCustomer = (
    customerId: string | undefined,
    params?: { page?: number; limit?: number; status?: string },
) => {
    return useQuery({
        queryKey: orderKeys.byCustomer(customerId ?? '', params),
        queryFn: () => ordersApi.getByCustomer(customerId as string, params),
        enabled: Boolean(customerId),
    });
};

export const useOrderStats = () => {
    return useQuery({
        queryKey: orderKeys.stats(),
        queryFn: () => ordersApi.getStats(),
    });
};

export const useUpdateOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: UpdateOrderInput }) => ordersApi.update(id, input),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
            queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.id) });
        },
    });
};

export const useDeleteOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => ordersApi.remove(id),
        onSuccess: (_data, id) => {
            queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
            queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) });
        },
    });
};

export const useUpdateOrderStatus = (id: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: UpdateOrderStatusInput) => ordersApi.updateStatus(id, input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: orderKeys.stats() });
            queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
            queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: orderKeys.history(id) });
        },
    });
};

export const useUpdatePaymentStatus = (id: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: UpdatePaymentStatusInput) => ordersApi.updatePaymentStatus(id, input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
            queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: orderKeys.history(id) });
        },
    });
};

export const useUpdateTracking = (id: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: UpdateTrackingInput) => ordersApi.updateTracking(id, input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: orderKeys.history(id) });
        },
    });
};

export const useAddTrackingEvent = (id: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: AddTrackingEventInput) => ordersApi.addEvent(id, input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: orderKeys.history(id) });
            queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) });
        },
    });
};

/** Generic — pass {id, input} at call time so it works from both the list and detail views. */
export const useCancelOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: CancelOrderInput }) => ordersApi.cancel(id, input),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
            queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: orderKeys.history(variables.id) });
        },
    });
};

export const useBulkCancelOrders = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (ids: string[]) => ordersApi.bulkCancel(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
        },
    });
};

export const useOrderHistory = (orderId: string | undefined) => {
    return useQuery({
        queryKey: orderKeys.history(orderId ?? ''),
        queryFn: () => ordersApi.getHistory(orderId as string),
        enabled: Boolean(orderId),
    });
};

export const useOrderNotes = (orderId: string | undefined) => {
    return useQuery({
        queryKey: orderKeys.notes(orderId ?? ''),
        queryFn: () => ordersApi.getNotes(orderId as string),
        enabled: Boolean(orderId),
    });
};

export const useAddOrderNote = (orderId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: { content: string; isInternal?: boolean; authorId: string }) =>
            ordersApi.addNote(orderId, dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: orderKeys.notes(orderId) });
        },
    });
};

export const useUpdateOrderNote = (orderId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ noteId, dto }: { noteId: string; dto: { content?: string; isInternal?: boolean } }) =>
            ordersApi.updateNote(noteId, dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: orderKeys.notes(orderId) });
        },
    });
};

export const useDeleteOrderNote = (orderId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (noteId: string) => ordersApi.deleteNote(noteId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: orderKeys.notes(orderId) });
        },
    });
};
