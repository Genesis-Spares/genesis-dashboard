// src/features/orders/hooks/useUrgentOrders.ts
import { useMemo } from 'react';
import { useOrders } from './useOrders';
import { Order } from '@/types/order.types';

function dedupe(lists: (Order[] | undefined)[]): Order[] {
    const map = new Map<string, Order>();
    for (const list of lists) {
        for (const order of list ?? []) {
            map.set(order.id, order);
        }
    }
    return Array.from(map.values());
}

/**
 * Client-side compositing of the three "urgent order" criteria the user
 * asked for — the backend has no multi-status/percentile query, so each
 * criterion is its own request, merged and deduped here:
 *   - Stuck: PENDING or CONFIRMED for 24h+
 *   - Payment issues: FAILED payment, or PENDING payment for 12h+
 *   - High-value: top orders by total
 */
export const useUrgentOrders = () => {
    const cutoff24h = useMemo(() => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), []);
    const cutoff12h = useMemo(() => new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), []);

    const stuckPending = useOrders({
        status: 'PENDING',
        dateTo: cutoff24h,
        sortBy: 'createdAt',
        sortOrder: 'asc',
        limit: 25,
    });
    const stuckConfirmed = useOrders({
        status: 'CONFIRMED',
        dateTo: cutoff24h,
        sortBy: 'createdAt',
        sortOrder: 'asc',
        limit: 25,
    });
    const paymentFailed = useOrders({
        paymentStatus: 'FAILED',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        limit: 25,
    });
    const paymentPending = useOrders({
        paymentStatus: 'PENDING',
        dateTo: cutoff12h,
        sortBy: 'createdAt',
        sortOrder: 'asc',
        limit: 25,
    });
    const highValue = useOrders({
        sortBy: 'total',
        sortOrder: 'desc',
        limit: 10,
    });

    const stuck = useMemo(
        () => dedupe([stuckPending.data?.data, stuckConfirmed.data?.data]),
        [stuckPending.data, stuckConfirmed.data],
    );
    const paymentIssues = useMemo(
        () => dedupe([paymentFailed.data?.data, paymentPending.data?.data]),
        [paymentFailed.data, paymentPending.data],
    );
    const highValueOrders = highValue.data?.data ?? [];

    const isLoading =
        stuckPending.isLoading ||
        stuckConfirmed.isLoading ||
        paymentFailed.isLoading ||
        paymentPending.isLoading ||
        highValue.isLoading;

    // Union across all three criteria, deduped — for a combined "urgent" count/list.
    const all = useMemo(
        () => dedupe([stuck, paymentIssues, highValueOrders]),
        [stuck, paymentIssues, highValueOrders],
    );

    return { stuck, paymentIssues, highValueOrders, all, isLoading };
};
