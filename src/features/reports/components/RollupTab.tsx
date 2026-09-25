'use client';

import { ReportRange, SalesRollup } from '@/types/report.types';
import { useProductReport } from '../api/reports.api';
import { csvNum, csvPct, ExportButton, int, Margin, money, ShareBar, SortTh, TableShell, tdCls, thCls, useSort } from './ui';

/** Sales grouped by category or by brand. */
export function RollupTab({ range, fileTag, kind }: { range: ReportRange; fileTag: string; kind: 'categories' | 'brands' }) {
    const { data, isLoading } = useProductReport(range);
    const rows = data?.[kind];
    const sort = useSort<SalesRollup>(rows, 'revenue');
    const total = data?.totals.revenue || 0;
    const noun = kind === 'categories' ? 'Category' : 'Brand';

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {kind === 'categories' ? 'Product sales grouped by each product’s category.' : 'Product sales grouped by brand.'} Delivery charges are not included.
                </p>
                <ExportButton filename={`sales-by-${kind === 'categories' ? 'category' : 'brand'}_${fileTag}.csv`} disabled={!rows?.length} rows={() => [
                    [noun, 'Products sold', 'Units', 'Revenue', 'Share %', 'Cost', 'Profit', 'Margin %', 'Cost incomplete'],
                    ...sort.sorted.map((r) => [r.label, r.products, r.units, csvNum(r.revenue), csvPct(total ? r.revenue / total : 0), csvNum(r.cost), csvNum(r.profit), csvPct(r.margin), r.costMissing ? 'yes' : '']),
                ]} />
            </div>
            <TableShell cols={7} loading={isLoading} empty={!isLoading && !rows?.length && 'No sales in this period.'}>
                <thead className="border-b border-gray-100 bg-gray-50/60 dark:border-gray-700/70 dark:bg-gray-900/30">
                    <tr>
                        <SortTh label={noun} k="label" sort={sort} align="left" />
                        <SortTh label="Products" k="products" sort={sort} />
                        <SortTh label="Units" k="units" sort={sort} />
                        <SortTh label="Revenue" k="revenue" sort={sort} />
                        <th className={`${thCls} text-left`}>Share of sales</th>
                        <SortTh label="Profit" k="profit" sort={sort} />
                        <SortTh label="Margin" k="margin" sort={sort} />
                    </tr>
                </thead>
                {!isLoading && (
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/70">
                        {sort.sorted.map((r) => (
                            <tr key={r.key} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/20">
                                <td className={`px-3 py-2.5 font-medium ${r.key === 'none' ? 'italic text-gray-500' : 'text-gray-900 dark:text-white'}`}>{r.label}</td>
                                <td className={`${tdCls} text-right`}>{int(r.products)}</td>
                                <td className={`${tdCls} text-right`}>{int(r.units)}</td>
                                <td className={`${tdCls} text-right font-semibold text-gray-900 dark:text-white`}>{money(r.revenue)}</td>
                                <td className="px-3 py-2.5"><ShareBar share={total ? r.revenue / total : 0} /></td>
                                <td className={`${tdCls} text-right`}>
                                    {r.profit == null ? <span className="text-xs text-gray-400" title="Some products in this group have no cost price">Incomplete</span> : money(r.profit)}
                                </td>
                                <td className={`${tdCls} text-right`}><Margin value={r.margin} /></td>
                            </tr>
                        ))}
                    </tbody>
                )}
            </TableShell>
        </div>
    );
}
