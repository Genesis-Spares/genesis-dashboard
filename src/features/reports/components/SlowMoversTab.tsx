'use client';

import Link from 'next/link';
import { ReportRange, SlowMover } from '@/types/report.types';
import { useProductReport } from '../api/reports.api';
import { card, csvNum, ExportButton, int, money, shortDate, SortTh, TableShell, tdCls, useSort } from './ui';

/** Active products with stock on hand that sold nothing in the range. */
export function SlowMoversTab({ range, fileTag }: { range: ReportRange; fileTag: string }) {
    const { data, isLoading } = useProductReport(range);
    const rows = data?.slowMovers;
    const sort = useSort<SlowMover>(rows, 'stockValue');
    const units = rows?.reduce((n, r) => n + r.stockQty, 0) ?? 0;
    const missingCost = rows?.filter((r) => r.stockValue == null).length ?? 0;

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Tile label="Products not selling" value={rows ? int(rows.length) : '—'} />
                <Tile label="Units on the shelf" value={rows ? int(units) : '—'} />
                <Tile label="Stock value tied up (at cost)" value={money(data?.totals.slowMoverStockValue)}
                    note={missingCost ? `${missingCost} product${missingCost === 1 ? '' : 's'} without a cost price not counted` : undefined} />
            </div>
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">In stock but no sales in this period. Consider a discount, a flash sale, or not reordering.</p>
                <ExportButton filename={`slow-movers_${fileTag}.csv`} disabled={!rows?.length} rows={() => [
                    ['SKU', 'Product', 'Brand', 'Category', 'Stock', 'Cost price', 'Price', 'Stock value (cost)', 'Stock value (retail)', 'Last sold', 'Days without a sale'],
                    ...sort.sorted.map((r) => [r.sku, r.name, r.brand, r.category, r.stockQty, csvNum(r.costPrice), csvNum(r.price), csvNum(r.stockValue), csvNum(r.retailValue), r.lastSoldAt ? r.lastSoldAt.slice(0, 10) : 'never', r.daysIdle]),
                ]} />
            </div>
            <TableShell cols={6} loading={isLoading} empty={!isLoading && !rows?.length && 'Every product in stock sold at least once in this period.'}>
                <thead className="border-b border-gray-100 bg-gray-50/60 dark:border-gray-700/70 dark:bg-gray-900/30">
                    <tr>
                        <SortTh label="Product" k="name" sort={sort} align="left" />
                        <SortTh label="Stock" k="stockQty" sort={sort} />
                        <SortTh label="Value at cost" k="stockValue" sort={sort} />
                        <SortTh label="Retail value" k="retailValue" sort={sort} />
                        <SortTh label="Last sold" k="lastSoldAt" sort={sort} />
                        <SortTh label="Days idle" k="daysIdle" sort={sort} />
                    </tr>
                </thead>
                {!isLoading && (
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/70">
                        {sort.sorted.map((r) => (
                            <tr key={r.productId} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/20">
                                <td className="max-w-[340px] px-3 py-2.5">
                                    <Link href={`/products/${r.productId}`} className="font-medium text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400">{r.name}</Link>
                                    <span className="block truncate text-xs text-gray-400"><span className="font-mono">{r.sku}</span>{r.brand && ` · ${r.brand}`}{r.category && ` · ${r.category}`}</span>
                                </td>
                                <td className={`${tdCls} text-right`}>{int(r.stockQty)}</td>
                                <td className={`${tdCls} text-right font-semibold text-gray-900 dark:text-white`}>{r.stockValue == null ? <span className="text-xs font-normal text-gray-400">No cost price</span> : money(r.stockValue)}</td>
                                <td className={`${tdCls} text-right`}>{money(r.retailValue)}</td>
                                <td className={`${tdCls} text-right`}>{r.lastSoldAt ? shortDate(r.lastSoldAt) : <span className="text-gray-400">Never</span>}</td>
                                <td className={`${tdCls} text-right ${r.daysIdle >= 90 ? 'text-amber-600 dark:text-amber-400' : ''}`}>{int(r.daysIdle)}</td>
                            </tr>
                        ))}
                    </tbody>
                )}
            </TableShell>
        </div>
    );
}

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
    return (
        <div className={`${card} p-4`}>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-gray-900 dark:text-white">{value}</p>
            {note && <p className="mt-0.5 text-xs text-gray-400">{note}</p>}
        </div>
    );
}
