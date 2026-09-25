import { apiClient } from '@/lib/api/client';
import { AdminReturn, RefundDueOrder, ReturnListResponse, ReturnStatus } from '@/types/return.types';

export const returnsApi = {
    list: (params?: { status?: ReturnStatus; search?: string; page?: number; limit?: number }): Promise<ReturnListResponse> =>
        apiClient.get<ReturnListResponse>('/returns', params),
    refundsDue: (): Promise<RefundDueOrder[]> => apiClient.get<RefundDueOrder[]>('/returns/refunds-due'),
    approve: (id: string, instructions?: string): Promise<AdminReturn> => apiClient.post<AdminReturn>(`/returns/${id}/approve`, { instructions }),
    reject: (id: string, reason: string): Promise<AdminReturn> => apiClient.post<AdminReturn>(`/returns/${id}/reject`, { reason }),
    receive: (id: string, restock: boolean, note?: string): Promise<AdminReturn> => apiClient.post<AdminReturn>(`/returns/${id}/receive`, { restock, note }),
    refund: (id: string, amount: number, note?: string): Promise<AdminReturn> => apiClient.post<AdminReturn>(`/returns/${id}/refund`, { amount, note }),
};
