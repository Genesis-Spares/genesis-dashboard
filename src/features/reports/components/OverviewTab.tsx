'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { BanknotesIcon, ReceiptPercentIcon, ShoppingBagIcon, ArrowUturnLeftIcon, ScaleIcon, UsersIcon } from '@heroicons/react/24/outline';
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid';
import { KpiCard } from '@/features/dashboard/components/KpiCard';
import { RevenueChart } from '@/features/dashboard/components/RevenueChart';
import { ReportRange } from '@/types/report.types';
import { useProductReport, useSalesOverview } from '../api/reports.api';
import { card, int, Margin, money, pct } from './ui';

const METHOD_LABEL: Record<string, string> = { cod: 'Cash on delivery', mpesa: 'M-Pesa', card: 'Card', unknown: 'Not recorded' };
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Every day in the range (up to today) so gaps show as zero instead of being skipped. */
function fillDays(range: ReportRange, daily: { date: string; orders: number; revenue: number }[] = []) {
    const byDay = new Map(daily.map((d) => [d.date, d]));
    const out = [];
    const end = new Date(Math.min(new Date(range.to).getTime(), Date.now()));
    for (const d = new Date(range.from); d <= end; d.setDate(d.getDate() + 1)) {
        const key = ymd(d);
        out.push(byDay.get(key) ?? { date: key, orders: 0, revenue: 0 });
    }
    return out;
}

export function OverviewTab({ range, label, onOpen }: { range: ReportRange; label: string; onOpen: (t: 'products' | 'slow') => void }) {
    const { data: s, isLoading } = useSalesOverview(range);
    const { data: p, isLoading: pLoading } = useProductReport(range);
    const daily = useMemo(() => (s ? fillDays(range, s.daily) : undefined), [s, range]);
    const profit = s?.profit;
    const cmp = 'previous period';
    const methodTotal = s?.paymentMethods.reduce((n, m) => n + m.revenue, 0) || 0;

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <KpiCard label="Net sales" icon={BanknotesIcon} loading={isLoading} value={money(s?.net)}
                    current={s?.net} previous={s?.previous.net} compareLabel={cmp}
                    sub={<span>{money(s?.gross)} gross</span>} />
                <KpiCard label="Gross profit" icon={ScaleIcon} loading={isLoading} value={money(profit?.profit)}
                    sub={profit && <span>Margin <Margin value={profit.margin} />{profit.costCoverage < 1 && <> · covers {pct(profit.costCoverage, 0)} of sales</>}</span>} />
                <KpiCard label="Orders" icon={ShoppingBagIcon} loading={isLoading} value={s ? int(s.orders) : '—'}
                    current={s?.orders} previous={s?.previous.orders} compareLabel={cmp}
                    sub={s && <span>{int(s.units)} items sold{s.cancelled ? ` · ${s.cancelled} cancelled` : ''}</span>} />
                <KpiCard label="Average order" icon={ReceiptPercentIcon} loading={isLoading} value={money(s?.averageOrder)}
                    current={s?.averageOrder} previous={s?.previous.averageOrder} compareLabel={cmp} />
                <KpiCard label="Customers" icon={UsersIcon} loading={isLoading} value={s ? int(s.customers) : '—'}
                    current={s?.customers} previous={s?.previous.customers} compareLabel={cmp} sub={<span>who ordered</span>} />
                <KpiCard label="Refunds" icon={ArrowUturnLeftIcon} loading={isLoading} value={money(s?.refunds)}
                    tone={s && s.refunds > 0 ? 'warning' : 'default'}
                    sub={s && <span>{s.returnsRefunded} return{s.returnsRefunded === 1 ? '' : 's'} refunded</span>} />
            </div>

            <RevenueChart daily={daily} loading={isLoading} period={label} note="Cancelled and refunded orders excluded" />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <section className={`${card} p-5 lg:col-span-2`}>
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Best sellers</h2>
                        <button onClick={() => onOpen('products')} className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">All products</button>
                    </div>
                    {pLoading ? <div className="h-40 animate-pulse rounded-lg bg-gray-50 dark:bg-gray-700/40" /> : !p?.products.length ? (
                        <p className="py-8 text-center text-sm text-gray-500">No sales in this period.</p>
                    ) : (
                        <table className="w-full text-left text-[13px] responsive-table">
                            <thead>
                                <tr className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                    <th className="pb-2">Product</th><th className="pb-2 text-right">Units</th><th className="pb-2 text-right">Revenue</th><th className="pb-2 text-right">Margin</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/70">
                                {p.products.slice(0, 5).map((r) => (
                                    <tr key={r.productId}>
                                        <td className="py-2 pr-3 rt-full">
                                            {r.deleted ? <span className="font-medium text-gray-900 dark:text-white">{r.name}</span> :
                                                <Link href={`/products/${r.productId}`} className="font-medium text-gray-900 hover:text-blue-600 dark:text-white">{r.name}</Link>}
                                            <span className="block font-mono text-xs text-gray-400">{r.sku}</span>
                                        </td>
                                        <td data-label="Units" className="py-2 text-right tabular-nums">{int(r.units)}</td>
                                        <td data-label="Revenue" className="py-2 text-right font-medium tabular-nums text-gray-900 dark:text-white">{money(r.revenue)}</td>
                                        <td data-label="Margin" className="py-2 text-right tabular-nums"><Margin value={r.margin} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>

                <section className={`${card} p-5`}>
                    <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Profit</h2>
                    {isLoading || !profit ? <div className="h-40 animate-pulse rounded-lg bg-gray-50 dark:bg-gray-700/40" /> : (
                        <dl className="space-y-2 text-[13px]">
                            <Row label="Product sales" value={money(profit.revenue)} />
                            <Row label="Cost of goods" value={`− ${money(profit.cost)}`} />
                            <div className="border-t border-gray-100 pt-2 dark:border-gray-700/70">
                                <Row label="Gross profit" value={money(profit.profit)} strong />
                            </div>
                            <Row label="Margin" value={<Margin value={profit.margin} />} />
                            <Row label="Delivery charged" value={money(s?.delivery)} />
                            {(profit.estimated || profit.costCoverage < 1) && (
                                <p className="flex gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                                    <ExclamationTriangleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    <span>
                                        {profit.costCoverage < 1 && <>Some products have no cost price, so {pct(1 - profit.costCoverage, 0)} of sales is left out of profit. </>}
                                        {profit.estimated && <>Sales made before costs were recorded use today&apos;s cost price.</>}
                                    </span>
                                </p>
                            )}
                        </dl>
                    )}
                    {!!p?.slowMovers.length && (
                        <button onClick={() => onOpen('slow')} className="mt-4 w-full rounded-lg border border-gray-200 px-3 py-2 text-left text-xs text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700/40">
                            <strong className="text-gray-900 dark:text-white">{p.slowMovers.length} product{p.slowMovers.length === 1 ? '' : 's'}</strong> in stock with no sales in this period
                            {p.totals.slowMoverStockValue > 0 && <> · {money(p.totals.slowMoverStockValue)} tied up</>}
                        </button>
                    )}
                </section>
            </div>

            {!!s?.paymentMethods.length && (
                <section className={`${card} p-5`}>
                    <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Payment methods</h2>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {s.paymentMethods.map((m) => (
                            <div key={m.method} className="rounded-lg border border-gray-100 p-3 dark:border-gray-700/70">
                                <p className="text-xs text-gray-500 dark:text-gray-400">{METHOD_LABEL[m.method] ?? m.method}</p>
                                <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900 dark:text-white">{money(m.revenue)}</p>
                                <p className="text-xs text-gray-500 tabular-nums dark:text-gray-400">{m.orders} order{m.orders === 1 ? '' : 's'} · {pct(methodTotal ? m.revenue / methodTotal : 0, 0)}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

function Row({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
    return (
        <div className="flex items-center justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
            <dd className={`tabular-nums ${strong ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200'}`}>{value}</dd>
        </div>
    );
}
