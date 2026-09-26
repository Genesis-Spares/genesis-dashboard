'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AdjustmentsHorizontalIcon, ClockIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { formatMoney } from '@/features/orders/components/OrderTable';
import { fieldCls, Btn } from '@/features/orders/components/OrderDialogs';
import { useStockLevels } from '../hooks/useInventory';
import { AdjustDialog } from './AdjustDialog';
import { StockLevel } from '@/types/inventory.types';

const card = 'rounded-xl border border-gray-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] dark:border-gray-700/70 dark:bg-gray-800';

function status(p: StockLevel) {
    if (p.stockQty <= 0) return { label: 'Out of stock', cls: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400' };
    if (p.stockQty <= p.reorderLevel) return { label: 'Reorder', cls: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400' };
    return { label: 'In stock', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400' };
}

export function StockLevelsTab({ initialFilter = 'all', onHistory }: { initialFilter?: 'all' | 'low' | 'out'; onHistory: (p: StockLevel) => void }) {
    const [filter, setFilter] = useState<'all' | 'low' | 'out'>(initialFilter);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [adjusting, setAdjusting] = useState<StockLevel | null>(null);
    const { data, isLoading } = useStockLevels({ filter, search: search.trim() || undefined, page, limit: 50 });
    const s = data?.summary;

    const stats = [
        { label: 'Active products', value: s?.skus ?? '—' },
        { label: 'Units in stock', value: s ? s.units.toLocaleString('en-KE') : '—' },
        { label: 'Stock value (at cost)', value: s ? formatMoney(s.stockValue) : '—' },
        { label: 'Need reordering', value: s?.low ?? '—', tone: 'text-amber-600 dark:text-amber-400', f: 'low' as const },
        { label: 'Out of stock', value: s?.out ?? '—', tone: 'text-rose-600 dark:text-rose-400', f: 'out' as const },
    ];

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                {stats.map((st) => (
                    <button key={st.label} type="button" disabled={!st.f} onClick={() => { if (st.f) { setFilter(st.f); setPage(1); } }}
                        className={`${card} px-4 py-3 text-left ${st.f ? 'transition hover:border-gray-300' : 'cursor-default'}`}>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{st.label}</p>
                        <p className={`mt-0.5 text-lg font-semibold tabular-nums ${st.tone ?? 'text-gray-900 dark:text-white'}`}>{st.value}</p>
                    </button>
                ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-lg bg-gray-100 p-0.5 text-xs font-medium dark:bg-gray-700/60">
                    {(['all', 'low', 'out'] as const).map((f) => (
                        <button key={f} onClick={() => { setFilter(f); setPage(1); }}
                            className={`rounded-md px-3 py-1.5 transition ${filter === f ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                            {f === 'all' ? 'All' : f === 'low' ? 'Need reordering' : 'Out of stock'}
                        </button>
                    ))}
                </div>
                <div className="relative min-w-[220px] flex-1">
                    <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search SKU, name or brand…" className={`${fieldCls} pl-9`} />
                </div>
            </div>

            <div className={`${card} overflow-hidden`}>
                <div className="relative overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-[13px] responsive-table">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-700/70 dark:bg-gray-900/30 dark:text-gray-400">
                                <th className="px-4 py-2.5">Product</th><th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5 text-right">In stock</th>
                                <th className="px-3 py-2.5 text-right">Reorder at</th><th className="px-3 py-2.5 text-right">Unit cost</th><th className="px-3 py-2.5 text-right">Value</th><th className="px-4 py-2.5" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/70">
                            {isLoading && <tr><td colSpan={7} className="px-4 py-8"><div className="h-6 animate-pulse rounded bg-gray-50 dark:bg-gray-700/40" /></td></tr>}
                            {!isLoading && !data?.data.length && <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">No products match.</td></tr>}
                            {data?.data.map((p) => {
                                const st = status(p);
                                const cost = p.costPrice != null ? Number(p.costPrice) : null;
                                return (
                                    <tr key={p.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/20">
                                        <td className="px-4 py-2.5 rt-full">
                                            <Link href={`/products/${p.id}`} className="font-medium text-gray-900 hover:text-blue-600 dark:text-white">{p.name}</Link>
                                            <p className="font-mono text-xs text-gray-400">{p.sku}{p.brand ? ` · ${p.brand}` : ''}</p>
                                        </td>
                                        <td data-label="Status" className="px-3 py-2.5"><span className={`whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${st.cls}`}>{st.label}</span></td>
                                        <td data-label="In stock" className="px-3 py-2.5 text-right text-base font-semibold tabular-nums text-gray-900 dark:text-white">{p.stockQty}</td>
                                        <td data-label="Reorder at" className="px-3 py-2.5 text-right tabular-nums text-gray-500">{p.reorderLevel}{p.minStockQty == null && <span className="text-[10px] text-gray-400"> (default)</span>}</td>
                                        <td data-label="Unit cost" className="px-3 py-2.5 text-right tabular-nums text-gray-600 dark:text-gray-300">{cost != null ? formatMoney(cost) : <span className="text-gray-400">—</span>}</td>
                                        <td data-label="Value" className="px-3 py-2.5 text-right tabular-nums text-gray-600 dark:text-gray-300">{cost != null ? formatMoney(cost * Math.max(0, p.stockQty)) : '—'}</td>
                                        <td className="px-4 py-2.5 text-right rt-actions">
                                            <div className="inline-flex gap-1">
                                                <button onClick={() => setAdjusting(p)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"><AdjustmentsHorizontalIcon className="h-4 w-4" /> Adjust</button>
                                                <button onClick={() => onHistory(p)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"><ClockIcon className="h-4 w-4" /> History</button>
                                            </div>
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
            {adjusting && <AdjustDialog product={adjusting} onClose={() => setAdjusting(null)} />}
        </div>
    );
}
