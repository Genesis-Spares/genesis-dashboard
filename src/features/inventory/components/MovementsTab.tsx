'use client';

import { useState } from 'react';
import Link from 'next/link';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Btn, fieldCls } from '@/features/orders/components/OrderDialogs';
import { useMovements } from '../hooks/useInventory';
import { MovementReason } from '@/types/inventory.types';

const REASON: Record<MovementReason, { label: string; cls: string }> = {
    ORDER: { label: 'Sale', cls: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' },
    ORDER_CANCELLED: { label: 'Order cancelled', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
    ORDER_FAILED: { label: 'Order failed', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
    RETURN: { label: 'Customer return', cls: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400' },
    RESTOCK: { label: 'Delivery', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
    ADJUSTMENT: { label: 'Adjustment', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' },
};

/** Stock movement log. With `productId` it's that product's history (no product column). */
export function MovementsTab({ productId, productLabel, onClearProduct }: { productId?: string; productLabel?: string; onClearProduct?: () => void }) {
    const [reason, setReason] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const { data, isLoading } = useMovements({ productId, reason: reason || undefined, search: productId ? undefined : search.trim() || undefined, page, limit: 50 });

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                {productId && productLabel && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                        {productLabel}{onClearProduct && <button onClick={onClearProduct} aria-label="Show all products"><XMarkIcon className="h-3.5 w-3.5" /></button>}
                    </span>
                )}
                {!productId && <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search SKU or product…" className={`${fieldCls} max-w-xs`} />}
                <select value={reason} onChange={(e) => { setReason(e.target.value); setPage(1); }} className={`${fieldCls} w-auto`} aria-label="Type">
                    <option value="">All movements</option>
                    {(Object.keys(REASON) as MovementReason[]).map((r) => <option key={r} value={r}>{REASON[r].label}</option>)}
                </select>
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white dark:border-gray-700/70 dark:bg-gray-800">
                <div className="relative overflow-x-auto">
                    <table className="w-full min-w-[680px] text-left text-[13px] responsive-table">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-700/70 dark:bg-gray-900/30 dark:text-gray-400">
                                <th className="px-4 py-2.5">When</th>{!productId && <th className="px-3 py-2.5">Product</th>}<th className="px-3 py-2.5">Type</th>
                                <th className="px-3 py-2.5 text-right">Change</th><th className="px-3 py-2.5 text-right">Stock after</th><th className="px-4 py-2.5">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/70">
                            {isLoading && <tr><td colSpan={6} className="px-4 py-8"><div className="h-6 animate-pulse rounded bg-gray-50 dark:bg-gray-700/40" /></td></tr>}
                            {!isLoading && !data?.data.length && <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">No stock movements yet.</td></tr>}
                            {data?.data.map((m) => {
                                const r = REASON[m.reason] ?? { label: m.reason, cls: 'bg-gray-100 text-gray-600' };
                                const orderLink = ['ORDER', 'ORDER_CANCELLED', 'ORDER_FAILED'].includes(m.reason) && m.reference;
                                return (
                                    <tr key={m.id}>
                                        <td data-label="When" className="whitespace-nowrap px-4 py-2.5 text-gray-500 tabular-nums">{new Date(m.createdAt).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                                        {!productId && <td className="px-3 py-2.5 rt-full">{m.product ? <><p className="font-medium text-gray-900 dark:text-white">{m.product.name}</p><p className="font-mono text-xs text-gray-400">{m.product.sku}</p></> : <span className="text-gray-400">Deleted product</span>}</td>}
                                        <td data-label="Type" className="px-3 py-2.5"><span className={`rounded px-1.5 py-0.5 text-xs font-medium ${r.cls}`}>{r.label}</span></td>
                                        <td data-label="Change" className={`px-3 py-2.5 text-right font-semibold tabular-nums ${m.change > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{m.change > 0 ? `+${m.change}` : m.change}</td>
                                        <td data-label="Stock after" className="px-3 py-2.5 text-right tabular-nums text-gray-900 dark:text-white">{m.stockAfter}</td>
                                        <td data-label="Details" className="px-4 py-2.5 text-xs text-gray-500">
                                            {m.note}{orderLink && <Link href={`/orders/${m.reference}`} className="text-blue-600 hover:underline dark:text-blue-400"> View order</Link>}
                                            {m.actor && <span className="block text-gray-400">by {m.actor}</span>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            {data && data.meta.totalPages > 1 && (
                <div className="flex items-center justify-end gap-2 text-sm">
                    <Btn onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Btn>
                    <span className="tabular-nums text-gray-500">{page} / {data.meta.totalPages}</span>
                    <Btn onClick={() => setPage((p) => p + 1)} disabled={page >= data.meta.totalPages}>Next</Btn>
                </div>
            )}
        </div>
    );
}
