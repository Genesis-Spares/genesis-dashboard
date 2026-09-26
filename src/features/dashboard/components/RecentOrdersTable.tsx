// src/features/dashboard/components/RecentOrdersTable.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useOrders } from '@/features/orders/hooks/useOrders';
import { StatusDialog, STATUS_ACTION } from '@/features/orders/components/OrderDialogs';
import { formatMoney } from '@/features/orders/components/OrderTable';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { Order, OrderStatus, PaymentStatus } from '@/types/order.types';

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
    PENDING: 'CONFIRMED',
    CONFIRMED: 'PROCESSING',
    PROCESSING: 'SHIPPED',
    SHIPPED: 'DELIVERED',
};

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
    CONFIRMED: 'Confirm',
    PROCESSING: 'Process',
    SHIPPED: 'Ship…',
    DELIVERED: 'Deliver',
};

const STATUS_STYLE: Record<OrderStatus, string> = {
    PENDING: 'bg-amber-50 text-amber-700 ring-amber-600/15 dark:bg-amber-500/10 dark:text-amber-400',
    CONFIRMED: 'bg-blue-50 text-blue-700 ring-blue-600/15 dark:bg-blue-500/10 dark:text-blue-400',
    PROCESSING: 'bg-indigo-50 text-indigo-700 ring-indigo-600/15 dark:bg-indigo-500/10 dark:text-indigo-400',
    SHIPPED: 'bg-violet-50 text-violet-700 ring-violet-600/15 dark:bg-violet-500/10 dark:text-violet-400',
    DELIVERED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-400',
    CANCELLED: 'bg-gray-100 text-gray-600 ring-gray-500/15 dark:bg-gray-700 dark:text-gray-300',
    REFUNDED: 'bg-gray-100 text-gray-600 ring-gray-500/15 dark:bg-gray-700 dark:text-gray-300',
};

const PAYMENT_STYLE: Partial<Record<PaymentStatus, string>> = {
    PAID: 'text-emerald-600 dark:text-emerald-400',
    PENDING: 'text-amber-600 dark:text-amber-400',
    FAILED: 'text-rose-600 dark:text-rose-400',
};

const title = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ');

const when = (iso: string) => {
    const d = new Date(iso);
    const mins = Math.round((Date.now() - d.getTime()) / 60000);
    if (mins < 60) return `${Math.max(1, mins)}m ago`;
    if (mins < 24 * 60) return `${Math.round(mins / 60)}h ago`;
    return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
};

export function RecentOrdersTable({ limit = 6 }: { limit?: number }) {
    const { data, isLoading } = useOrders({ limit, sortBy: 'createdAt', sortOrder: 'desc' });
    const orders = data?.data ?? [];

    return (
        <section className="overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] dark:border-gray-700/70 dark:bg-gray-800">
            <div className="flex items-center justify-between px-5 py-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recent orders</h2>
                <Link href="/orders" className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">View all orders</Link>
            </div>
            <div className="relative overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-[13px] responsive-table">
                    <thead>
                        <tr className="border-y border-gray-100 bg-gray-50/60 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-700/70 dark:bg-gray-900/30 dark:text-gray-400">
                            <th className="px-5 py-2.5">Order</th>
                            <th className="px-3 py-2.5">Customer</th>
                            <th className="px-3 py-2.5">Status</th>
                            <th className="px-3 py-2.5">Payment</th>
                            <th className="px-3 py-2.5 text-right">Total</th>
                            <th className="px-5 py-2.5 text-right"><span className="sr-only">Action</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/70">
                        {isLoading &&
                            Array.from({ length: 4 }).map((_, i) => (
                                <tr key={i}><td colSpan={6} className="px-5 py-3"><div className="h-5 animate-pulse rounded bg-gray-50 dark:bg-gray-700/40" /></td></tr>
                            ))}
                        {!isLoading && orders.length === 0 && (
                            <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">No orders yet.</td></tr>
                        )}
                        {orders.map((o) => <OrderRow key={o.id} order={o} />)}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function OrderRow({ order: o }: { order: Order }) {
    const router = useRouter();
    const { can } = usePermissions();
    const [target, setTarget] = useState<OrderStatus | null>(null);
    const next = NEXT_STATUS[o.status];
    const canUpdate = can({ permission: 'order:update' });

    return (
        <tr onClick={() => router.push(`/orders/${o.id}`)} className="cursor-pointer transition hover:bg-gray-50/80 dark:hover:bg-gray-700/30">
            <td className="px-5 py-3 rt-full">
                <p className="font-mono text-[12.5px] font-semibold text-gray-900 dark:text-white">{o.orderNumber}</p>
                <p className="text-xs text-gray-400">{when(o.createdAt)}</p>
            </td>
            <td data-label="Customer" className="max-w-[180px] truncate px-3 py-3 text-gray-700 dark:text-gray-200">{o.customerName}</td>
            <td data-label="Status" className="px-3 py-3">
                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLE[o.status]}`}>
                    {title(o.status)}
                </span>
            </td>
            <td data-label="Payment" className={`px-3 py-3 text-xs font-medium ${PAYMENT_STYLE[o.paymentStatus] ?? 'text-gray-500'}`}>{title(o.paymentStatus)}</td>
            <td data-label="Total" className="px-3 py-3 text-right font-semibold text-gray-900 tabular-nums dark:text-white">{formatMoney(o.total, o.currency)}</td>
            <td className="px-5 py-3 text-right rt-actions">
                {canUpdate && next && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setTarget(next); }}
                        title={STATUS_ACTION[next].verb}
                        className="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
                    >
                        {NEXT_LABEL[next]}
                    </button>
                )}
                {/* dialog is portalled visually via fixed positioning; stop clicks bubbling to the row */}
                <span onClick={(e) => e.stopPropagation()}>
                    <StatusDialog order={o} target={target} onClose={() => setTarget(null)} />
                </span>
            </td>
        </tr>
    );
}
