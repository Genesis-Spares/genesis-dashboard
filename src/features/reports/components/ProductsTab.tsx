'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { ProductSalesRow, ReportRange } from '@/types/report.types';
import { useProductReport } from '../api/reports.api';
import { csvNum, csvPct, ExportButton, int, Margin, money, pct, SortTh, TableShell, tdCls, thCls, useSort } from './ui';

export function ProductsTab({ range, fileTag }: { range: ReportRange; fileTag: string }) {
    const { data, isLoading } = useProductReport(range);
    const [q, setQ] = useState('');
    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        return !s ? data?.products : data?.products.filter((r) => [r.name, r.sku, r.brand, r.category].some((v) => v?.toLowerCase().includes(s)));
    }, [data, q]);
    const sort = useSort<ProductSalesRow>(filtered, 'revenue');
    const total = data?.totals.revenue || 0;

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative w-full max-w-xs">
                    <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by name, SKU, brand…" aria-label="Filter products"
                        className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                </div>
                <div className="flex items-center gap-3">
                    {data && <span className="text-xs text-gray-500 tabular-nums dark:text-gray-400">{data.products.length} products sold · {int(data.totals.units)} units</span>}
                    <ExportButton filename={`product-sales_${fileTag}.csv`} disabled={!sort.sorted.length} rows={() => [
                        ['SKU', 'Product', 'Brand', 'Category', 'Units', 'Orders', 'Revenue', 'Cost', 'Profit', 'Margin %', 'Cost estimated', 'Returned units', 'Return rate %', 'Stock now'],
                        ...sort.sorted.map((r) => [r.sku, r.name, r.brand, r.category, r.units, r.orders, csvNum(r.revenue), csvNum(r.cost), csvNum(r.profit), csvPct(r.margin), r.costEstimated ? 'yes' : '', r.returnedUnits, csvPct(r.returnRate), r.stockQty]),
                    ]} />
                </div>
            </div>

            <TableShell cols={9} loading={isLoading} empty={!isLoading && !sort.sorted.length && (q ? 'No products match that filter.' : 'No sales in this period.')}>
                <thead className="border-b border-gray-100 bg-gray-50/60 dark:border-gray-700/70 dark:bg-gray-900/30">
                    <tr>
                        <th className={`${thCls} w-10 text-right`}>#</th>
                        <SortTh label="Product" k="name" sort={sort} align="left" />
                        <SortTh label="Units" k="units" sort={sort} />
                        <SortTh label="Revenue" k="revenue" sort={sort} />
                        <th className={`${thCls} text-left`}>Share</th>
                        <SortTh label="Profit" k="profit" sort={sort} />
                        <SortTh label="Margin" k="margin" sort={sort} />
                        <SortTh label="Returns" k="returnRate" sort={sort} />
                        <SortTh label="Stock" k="stockQty" sort={sort} />
                    </tr>
                </thead>
                {!isLoading && (
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/70">
                        {sort.sorted.map((r, i) => (
                            <tr key={r.productId} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/20">
                                <td className={`${tdCls} text-right text-xs text-gray-400`}>{i + 1}</td>
                                <td className="max-w-[320px] px-3 py-2.5">
                                    {r.deleted ? <span className="font-medium text-gray-900 dark:text-white">{r.name}</span>
                                        : <Link href={`/products/${r.productId}`} className="font-medium text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400">{r.name}</Link>}
                                    <span className="block truncate text-xs text-gray-400">
                                        <span className="font-mono">{r.sku}</span>{r.brand && ` · ${r.brand}`}{r.category && ` · ${r.category}`}
                                        {r.deleted && ' · deleted'}{!r.deleted && !r.isActive && ' · hidden'}
                                    </span>
                                </td>
                                <td className={`${tdCls} text-right`}>{int(r.units)}<span className="block text-xs text-gray-400">{r.orders} order{r.orders === 1 ? '' : 's'}</span></td>
                                <td className={`${tdCls} text-right font-semibold text-gray-900 dark:text-white`}>{money(r.revenue)}</td>
                                <td className="px-3 py-2.5"><Share value={total ? r.revenue / total : 0} /></td>
                                <td className={`${tdCls} text-right`}>
                                    {r.profit == null ? <span className="text-xs text-gray-400" title="Set a cost price on this product to see profit">No cost price</span>
                                        : <span className={r.profit < 0 ? 'text-rose-600 dark:text-rose-400' : ''}>{money(r.profit)}{r.costEstimated && <span className="text-gray-400" title="Uses today's cost price for sales made before costs were recorded">*</span>}</span>}
                                </td>
                                <td className={`${tdCls} text-right`}><Margin value={r.margin} /></td>
                                <td className={`${tdCls} text-right`}>
                                    {r.returnedUnits ? <span className={r.returnRate >= 0.1 ? 'text-amber-600 dark:text-amber-400' : ''}>{r.returnedUnits} · {pct(r.returnRate, 0)}</span> : <span className="text-gray-400">—</span>}
                                </td>
                                <td className={`${tdCls} text-right ${r.stockQty === 0 ? 'font-semibold text-rose-600 dark:text-rose-400' : ''}`}>{r.stockQty ?? '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                )}
            </TableShell>
            {data?.totals.estimated && <p className="text-xs text-gray-500 dark:text-gray-400">* Profit uses today&apos;s cost price for sales made before costs were recorded on orders.</p>}
        </div>
    );
}

function Share({ value }: { value: number }) {
    return (
        <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                <div className="h-full rounded-full bg-blue-600 dark:bg-blue-400" style={{ width: `${Math.max(2, Math.min(100, value * 100))}%` }} />
            </div>
            <span className="text-xs text-gray-500 tabular-nums dark:text-gray-400">{pct(value, 0)}</span>
        </div>
    );
}
