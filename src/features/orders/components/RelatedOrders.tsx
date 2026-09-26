'use client';

import { useRouter } from 'next/navigation';
import { ArrowPathIcon, ExclamationTriangleIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { Order, OrderStatus } from '@/types/order.types';
import { formatMoney } from './OrderTable';

const STATUS_STYLE: Record<OrderStatus, string> = {
    PENDING: 'bg-amber-50 text-amber-700 ring-amber-600/15 dark:bg-amber-500/10 dark:text-amber-400',
    CONFIRMED: 'bg-blue-50 text-blue-700 ring-blue-600/15 dark:bg-blue-500/10 dark:text-blue-400',
    PROCESSING: 'bg-indigo-50 text-indigo-700 ring-indigo-600/15 dark:bg-indigo-500/10 dark:text-indigo-400',
    SHIPPED: 'bg-violet-50 text-violet-700 ring-violet-600/15 dark:bg-violet-500/10 dark:text-violet-400',
    DELIVERED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-400',
    CANCELLED: 'bg-gray-100 text-gray-600 ring-gray-500/15 dark:bg-gray-700 dark:text-gray-300',
    REFUNDED: 'bg-gray-100 text-gray-600 ring-gray-500/15 dark:bg-gray-700 dark:text-gray-300',
};

const PAYMENT_STYLE: Record<string, string> = {
    PAID: 'text-emerald-600 dark:text-emerald-400',
    PENDING: 'text-amber-600 dark:text-amber-400',
    FAILED: 'text-rose-600 dark:text-rose-400',
};

const title = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ');
export const CLOSED: OrderStatus[] = ['CANCELLED', 'REFUNDED'];

export interface SummaryStat {
    label: string;
    value: React.ReactNode;
}

/**
 * Compact order list used inside other entities' views (customer, product).
 * With `productId`, the quantity column shows how many of that product each order holds.
 */
export function RelatedOrders({
    orders,
    isLoading,
    isError,
    onRetry,
    emptyText,
    productId,
    summary,
    showCustomer,
}: {
    orders: Order[];
    isLoading?: boolean;
    isError?: boolean;
    onRetry?: () => void;
    emptyText: string;
    productId?: string;
    summary?: SummaryStat[];
    showCustomer?: boolean;
}) {
    const router = useRouter();

    if (isLoading) {
        return <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-50 dark:bg-gray-800" />)}</div>;
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 py-12 text-center dark:border-rose-900/30 dark:bg-rose-900/10">
                <ExclamationTriangleIcon className="h-6 w-6 text-rose-400" />
                <p className="text-sm text-rose-600 dark:text-rose-400">Couldn&apos;t load orders.</p>
                {onRetry && (
                    <button onClick={onRetry} className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                        <ArrowPathIcon className="h-4 w-4" /> Retry
                    </button>
                )}
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-200 py-14 text-center dark:border-gray-700">
                <ShoppingBagIcon className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                <p className="text-sm text-gray-500 dark:text-gray-400">{emptyText}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {summary && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {summary.map((s) => (
                        <div key={s.label} className="rounded-xl border border-gray-200/80 bg-white px-4 py-3 dark:border-gray-700/70 dark:bg-gray-800">
                            <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                            <p className="mt-0.5 text-lg font-semibold text-gray-900 tabular-nums dark:text-white">{s.value}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white dark:border-gray-700/70 dark:bg-gray-800">
                <div className="relative overflow-x-auto">
                    <table className="w-full min-w-[600px] text-left text-[13px] responsive-table">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-700/70 dark:bg-gray-900/30 dark:text-gray-400">
                                <th className="px-4 py-2.5">Order</th>
                                {showCustomer && <th className="px-3 py-2.5">Customer</th>}
                                <th className="px-3 py-2.5">Status</th>
                                <th className="px-3 py-2.5">Payment</th>
                                <th className="px-3 py-2.5 text-right">{productId ? 'Qty' : 'Items'}</th>
                                <th className="px-4 py-2.5 text-right">{productId ? 'Line total' : 'Total'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/70">
                            {orders.map((o) => {
                                const line = productId ? o.items?.find((i) => i.productId === productId) : undefined;
                                const units = productId ? line?.quantity ?? 0 : (o.items ?? []).reduce((n, i) => n + i.quantity, 0);
                                return (
                                    <tr key={o.id} onClick={() => router.push(`/orders/${o.id}`)} className="cursor-pointer transition hover:bg-gray-50/80 dark:hover:bg-gray-700/30">
                                        <td className="px-4 py-3 rt-full">
                                            <p className="font-mono text-[12.5px] font-semibold text-gray-900 dark:text-white">{o.orderNumber}</p>
                                            <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                        </td>
                                        {showCustomer && <td data-label="Customer" className="max-w-[160px] truncate px-3 py-3 text-gray-700 dark:text-gray-200">{o.customerName}</td>}
                                        <td data-label="Status" className="px-3 py-3">
                                            <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLE[o.status]}`}>{title(o.status)}</span>
                                        </td>
                                        <td data-label="Payment" className={`px-3 py-3 text-xs font-medium ${PAYMENT_STYLE[o.paymentStatus] ?? 'text-gray-500'}`}>
                                            {o.paymentStatus === 'PENDING' ? 'Unpaid' : title(o.paymentStatus)}
                                        </td>
                                        <td data-label={productId ? 'Qty' : 'Items'} className="px-3 py-3 text-right text-gray-700 tabular-nums dark:text-gray-200">{units}</td>
                                        <td data-label={productId ? 'Line total' : 'Total'} className="px-4 py-3 text-right font-semibold text-gray-900 tabular-nums dark:text-white">
                                            {formatMoney(line ? line.subtotal : o.total, o.currency)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
