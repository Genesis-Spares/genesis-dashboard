// src/features/orders/hooks/useUrgentOrderCount.ts
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../api/orders.api';
import type { OrderListParams } from '@/types/order.types';

const PAGE = 25;

/**
 * Count for the sidebar's "Urgent orders" badge: orders that need someone to act —
 * stuck (PENDING/CONFIRMED for 24h+) or with a payment problem (FAILED, or PENDING
 * for 12h+). Same rules as the Urgent orders page, minus "high value", which is
 * informational rather than a problem. Refreshes every minute and whenever order
 * data is invalidated (the key lives under ['orders']).
 */
export function useUrgentOrderCount(enabled: boolean) {
    return useQuery({
        queryKey: ['orders', 'urgent-count'],
        enabled,
        staleTime: 30_000,
        refetchInterval: 60_000,
        queryFn: async () => {
            const now = Date.now();
            const h24 = new Date(now - 24 * 3600_000).toISOString();
            const h12 = new Date(now - 12 * 3600_000).toISOString();
            const queries: OrderListParams[] = [
                { status: 'PENDING', dateTo: h24, limit: PAGE },
                { status: 'CONFIRMED', dateTo: h24, limit: PAGE },
                { paymentStatus: 'FAILED', limit: PAGE },
                { paymentStatus: 'PENDING', dateTo: h12, limit: PAGE },
            ];
            const pages = await Promise.all(queries.map((q) => ordersApi.list(q)));
            const ids = new Set(pages.flatMap((p) => p.data.map((o) => o.id)));
            // a full page means there may be more than we fetched
            const more = pages.some((p) => p.data.length >= PAGE);
            return { count: ids.size, more };
        },
    });
}
