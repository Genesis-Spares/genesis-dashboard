// src/features/orders/components/RecentOrdersList.tsx
'use client';

import { useRouter } from 'next/navigation';
import { ArrowPathIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useOrders, useUpdateOrderStatus, useCancelOrder } from '../hooks/useOrders';
import { Order, OrderStatus } from '@/types/order.types';
import { formatMoney } from './OrderTable';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
    PENDING: 'CONFIRMED',
    CONFIRMED: 'PROCESSING',
    PROCESSING: 'SHIPPED',
    SHIPPED: 'DELIVERED',
};
const TERMINAL: OrderStatus[] = ['DELIVERED', 'CANCELLED', 'REFUNDED'];

function OrderQuickRow({ order }: { order: Order }) {
    const router = useRouter();
    const { can } = usePermissions();
    const canUpdate = can({ permission: 'order:update' });
    const updateStatus = useUpdateOrderStatus(order.id);
    const cancelOrder = useCancelOrder();
    const next = NEXT_STATUS[order.status];
    const isTerminal = TERMINAL.includes(order.status);

    return (
        <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/40">
            <button
                onClick={() => router.push(`/orders/${order.id}`)}
                className="min-w-0 text-left"
            >
                <p className="truncate text-sm font-medium text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400">
                    {order.orderNumber} <span className="text-gray-400">· {order.customerName}</span>
                </p>
                <p className="text-xs text-gray-400">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{order.status}</span>
                    {' · '}
                    {formatMoney(order.total, order.currency)}
                </p>
            </button>
            {canUpdate && !isTerminal && (
                <div className="flex shrink-0 gap-1.5">
                    {next && (
                        <button
                            onClick={() => updateStatus.mutate({ status: next })}
                            disabled={updateStatus.isPending}
                            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:opacity-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20"
                        >
                            <ArrowPathIcon className="h-3.5 w-3.5" />
                            {next}
                        </button>
                    )}
                    <button
                        onClick={() => cancelOrder.mutate({ id: order.id, input: {} })}
                        disabled={cancelOrder.isPending}
                        className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:opacity-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20"
                    >
                        <XCircleIcon className="h-3.5 w-3.5" />
                        Cancel
                    </button>
                </div>
            )}
        </li>
    );
}

export function RecentOrdersList({ limit = 8 }: { limit?: number }) {
    const { data, isLoading } = useOrders({ limit, sortBy: 'createdAt', sortOrder: 'desc' });

    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Orders</h2>
                <a href="/orders" className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
                    View all
                </a>
            </div>
            {isLoading ? (
                <div className="py-8">
                    <LoadingSpinner size="sm" />
                </div>
            ) : !data?.data?.length ? (
                <p className="py-6 text-center text-sm text-gray-400">No orders yet.</p>
            ) : (
                <ul className="space-y-0.5">
                    {data.data.map((order) => (
                        <OrderQuickRow key={order.id} order={order} />
                    ))}
                </ul>
            )}
        </div>
    );
}
