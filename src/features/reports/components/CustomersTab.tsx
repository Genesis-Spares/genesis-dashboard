'use client';

import { CustomerReport, ReportRange } from '@/types/report.types';
import { useCustomerReport } from '../api/reports.api';
import { card, csvNum, ExportButton, int, money, pct, shortDate, SortTh, TableShell, tdCls, thCls, useSort } from './ui';

type Row = CustomerReport['top'][number];

/** Lifetime value is all-time; the "this period" columns follow the date range. */
export function CustomersTab({ range, fileTag }: { range: ReportRange; fileTag: string }) {
    const { data, isLoading } = useCustomerReport(range, 200);
    const sort = useSort<Row>(data?.top, 'lifetimeValue');
    const s = data?.summary;

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Tile label="Customers who have ordered" value={s ? int(s.customers) : '—'} note={s ? `${int(s.newInPeriod)} new in this period` : undefined} />
                <Tile label="Average lifetime value" value={money(s?.averageLifetimeValue)} note={s ? `${s.averageOrders.toFixed(1)} orders per customer` : undefined} />
                <Tile label="Repeat customers" value={s ? int(s.repeatCustomers) : '—'} note="ordered more than once" />
                <Tile label="Repeat rate" value={pct(s?.repeatRate, 0)} note="of all customers" />
            </div>
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">Top customers by lifetime value (all time, excluding cancelled and refunded orders).</p>
                <ExportButton filename={`customer-value_${fileTag}.csv`} disabled={!data?.top.length} rows={() => [
                    ['Name', 'Email', 'Orders', 'Lifetime value', 'Average order', 'First order', 'Last order', 'Orders this period', 'Spent this period'],
                    ...sort.sorted.map((c) => [c.name, c.email, c.orders, csvNum(c.lifetimeValue), csvNum(c.averageOrder), c.firstOrder.slice(0, 10), c.lastOrder.slice(0, 10), c.periodOrders, csvNum(c.periodValue)]),
                ]} />
            </div>
            <TableShell cols={8} loading={isLoading} empty={!isLoading && !data?.top.length && 'No customer orders yet.'}>
                <thead className="border-b border-gray-100 bg-gray-50/60 dark:border-gray-700/70 dark:bg-gray-900/30">
                    <tr>
                        <th className={`${thCls} w-10 text-right`}>#</th>
                        <SortTh label="Customer" k="name" sort={sort} align="left" />
                        <SortTh label="Orders" k="orders" sort={sort} />
                        <SortTh label="Lifetime value" k="lifetimeValue" sort={sort} />
                        <SortTh label="Avg order" k="averageOrder" sort={sort} />
                        <SortTh label="Last order" k="lastOrder" sort={sort} />
                        <SortTh label="This period" k="periodValue" sort={sort} />
                        <SortTh label="Customer since" k="firstOrder" sort={sort} />
                    </tr>
                </thead>
                {!isLoading && (
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/70">
                        {sort.sorted.map((c, i) => (
                            <tr key={c.customerId} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/20">
                                <td className={`${tdCls} text-right text-xs text-gray-400`}>{i + 1}</td>
                                <td className="max-w-[280px] px-3 py-2.5">
                                    <span className="font-medium text-gray-900 dark:text-white">{c.name}</span>
                                    <span className="block truncate text-xs text-gray-400">{c.email}</span>
                                </td>
                                <td className={`${tdCls} text-right`}>{int(c.orders)}</td>
                                <td className={`${tdCls} text-right font-semibold text-gray-900 dark:text-white`}>{money(c.lifetimeValue)}</td>
                                <td className={`${tdCls} text-right`}>{money(c.averageOrder)}</td>
                                <td className={`${tdCls} text-right`}>{shortDate(c.lastOrder)}</td>
                                <td className={`${tdCls} text-right`}>{c.periodOrders ? <>{money(c.periodValue)}<span className="block text-xs text-gray-400">{c.periodOrders} order{c.periodOrders === 1 ? '' : 's'}</span></> : <span className="text-gray-400">—</span>}</td>
                                <td className={`${tdCls} text-right`}>{shortDate(c.firstOrder)}</td>
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
