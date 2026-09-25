// src/features/activity/hooks/useActivityLog.ts
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { activityApi } from '../api/activity.api';
import { ActivityLogEntry } from '@/types/activity.types';

const activityKeys = {
    orders: (limit: number) => ['activity', 'orders', limit] as const,
    staff: (page: number, limit: number) => ['activity', 'staff', page, limit] as const,
};

export const useRecentOrderActivity = (limit = 20) => {
    return useQuery({
        queryKey: activityKeys.orders(limit),
        queryFn: () => activityApi.getRecentOrderActivity(limit),
    });
};

export const useRecentStaffActivity = (limit = 20) => {
    return useQuery({
        queryKey: activityKeys.staff(1, limit),
        queryFn: () => activityApi.getRecentStaffActivity(1, limit),
    });
};

/**
 * Merges order status-change history and staff/user activity into one
 * chronological feed for the dashboard's "Logs" panel — the user asked for
 * "order activity + staff activity" combined into Logs.
 */
export const useActivityLog = (limit = 15) => {
    const orders = useRecentOrderActivity(limit);
    const staff = useRecentStaffActivity(limit);

    const entries = useMemo<ActivityLogEntry[]>(() => {
        const orderEntries: ActivityLogEntry[] = (orders.data ?? []).map((entry) => ({
            kind: 'order' as const,
            id: `order-${entry.id}`,
            createdAt: entry.createdAt,
            entry,
        }));
        const staffEntries: ActivityLogEntry[] = (staff.data?.data ?? []).map((entry) => ({
            kind: 'staff' as const,
            id: `staff-${entry.id}`,
            createdAt: entry.createdAt,
            entry,
        }));

        return [...orderEntries, ...staffEntries]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, limit);
    }, [orders.data, staff.data, limit]);

    return {
        entries,
        isLoading: orders.isLoading || staff.isLoading,
        isError: orders.isError || staff.isError,
    };
};
