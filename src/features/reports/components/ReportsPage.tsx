'use client';

import { useMemo, useState } from 'react';
import { ReportRange } from '@/types/report.types';
import { OverviewTab } from './OverviewTab';
import { ProductsTab } from './ProductsTab';
import { RollupTab } from './RollupTab';
import { SlowMoversTab } from './SlowMoversTab';
import { CustomersTab } from './CustomersTab';
import { ExportPdfDialog } from './ExportPdfDialog';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';

type Preset = '7d' | '30d' | '90d' | '12m' | 'custom';
const PRESETS: { id: Preset; label: string; days?: number }[] = [
    { id: '7d', label: '7 days', days: 7 },
    { id: '30d', label: '30 days', days: 30 },
    { id: '90d', label: '90 days', days: 90 },
    { id: '12m', label: '12 months', days: 365 },
    { id: 'custom', label: 'Custom' },
];

type Tab = 'overview' | 'products' | 'categories' | 'brands' | 'slow' | 'customers';
const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'products', label: 'Products' },
    { id: 'categories', label: 'Categories' },
    { id: 'brands', label: 'Brands' },
    { id: 'slow', label: 'Slow movers' },
    { id: 'customers', label: 'Customers' },
];

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const startOf = (day: string) => new Date(`${day}T00:00:00`);
const endOf = (day: string) => new Date(`${day}T23:59:59.999`);

/** Whole local days, so the query key stays stable for the rest of the day. */
function rangeFor(preset: Preset, custom: { from: string; to: string }): ReportRange & { fromDay: string; toDay: string } {
    const today = ymd(new Date());
    let fromDay: string, toDay: string;
    if (preset === 'custom') {
        fromDay = custom.from || today;
        toDay = custom.to && custom.to >= fromDay ? custom.to : fromDay;
    } else {
        const days = PRESETS.find((p) => p.id === preset)?.days ?? 30;
        const start = new Date();
        start.setDate(start.getDate() - (days - 1));
        fromDay = ymd(start);
        toDay = today;
    }
    return { from: startOf(fromDay).toISOString(), to: endOf(toDay).toISOString(), fromDay, toDay };
}

export function ReportsPage() {
    const [preset, setPreset] = useState<Preset>('30d');
    const [custom, setCustom] = useState(() => {
        const r = rangeFor('30d', { from: '', to: '' });
        return { from: r.fromDay, to: r.toDay };
    });
    const [tab, setTab] = useState<Tab>('overview');
    const [exporting, setExporting] = useState(false);
    const r = useMemo(() => rangeFor(preset, custom), [preset, custom]);
    const range = useMemo(() => ({ from: r.from, to: r.to }), [r.from, r.to]);
    const label = preset === 'custom'
        ? `${startOf(r.fromDay).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })} – ${startOf(r.toDay).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}`
        : `last ${PRESETS.find((p) => p.id === preset)?.label}`;
    const fileTag = `${r.fromDay}_to_${r.toDay}`;

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Reports</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Sales, profit, product performance and customer value. Cancelled and refunded orders are excluded.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex rounded-lg bg-gray-100 p-0.5 text-xs font-medium dark:bg-gray-700/60" role="radiogroup" aria-label="Date range">
                        {PRESETS.map((p) => (
                            <button key={p.id} role="radio" aria-checked={preset === p.id} onClick={() => setPreset(p.id)}
                                className={`rounded-md px-3 py-1.5 transition ${preset === p.id ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
                                {p.label}
                            </button>
                        ))}
                    </div>
                    {preset === 'custom' && (
                        <div className="flex items-center gap-1.5 text-sm">
                            <input type="date" aria-label="From" value={custom.from} max={custom.to || undefined}
                                onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))}
                                className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                            <span className="text-gray-400">–</span>
                            <input type="date" aria-label="To" value={custom.to} min={custom.from || undefined}
                                onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
                                className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                        </div>
                    )}
                    <button type="button" onClick={() => setExporting(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700">
                        <DocumentArrowDownIcon className="h-4 w-4" /> Export PDF
                    </button>
                </div>
            </div>

            <div className="flex gap-1 relative overflow-x-auto border-b border-gray-200 dark:border-gray-700">
                {TABS.map((t) => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition ${tab === t.id ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'overview' && <OverviewTab range={range} label={label} onOpen={setTab} />}
            {tab === 'products' && <ProductsTab range={range} fileTag={fileTag} />}
            {tab === 'categories' && <RollupTab range={range} fileTag={fileTag} kind="categories" />}
            {tab === 'brands' && <RollupTab range={range} fileTag={fileTag} kind="brands" />}
            {tab === 'slow' && <SlowMoversTab range={range} fileTag={fileTag} />}
            {tab === 'customers' && <CustomersTab range={range} fileTag={fileTag} />}
            {exporting && <ExportPdfDialog range={range} fromDay={r.fromDay} toDay={r.toDay} onClose={() => setExporting(false)} />}
        </div>
    );
}
