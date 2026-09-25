// src/features/activity/api/activity.api.ts
import { apiClient } from '@/lib/api/client';
import { OrderActivityEntry, StaffActivityResponse } from '@/types/activity.types';

export const activityApi = {
    // The gateway forwards order.activity.recent, which returns the raw
    // array (no {data, meta} envelope) — see order.service.ts#getRecentActivity.
    getRecentOrderActivity: async (limit = 20): Promise<OrderActivityEntry[]> => {
        const data = await apiClient.get<OrderActivityEntry[]>('/orders/activity/recent', { limit });
        return data;
    },

    getRecentStaffActivity: async (page = 1, limit = 20): Promise<StaffActivityResponse> => {
        const data = await apiClient.get<StaffActivityResponse>('/users/activity/recent', { page, limit });
        return data;
    },
};
