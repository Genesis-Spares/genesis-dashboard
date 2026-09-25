'use client';

import { useMemo, useState } from 'react';
import { ArrowDownTrayIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/20/solid';
import { formatMoney } from '@/features/orders/components/OrderTable';
import { downloadCsv, toCsv } from '@/features/inventory/csv';

export const card = 'rounded-xl border border-gray-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] dark:border-gray-700/70 dark:bg-gray-800';
export const thCls = 'px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400';
export const tdCls = 'px-3 py-2.5 tabular-nums';

export const money = (n: number | null | undefined) => (n == null ? '—' : formatMoney(n));
export const pct = (n: number | null | undefined, digits = 1) => (n == null ? '—' : `${(n * 100).toFixed(digits)}%`);
export const int = (n: number) => n.toLocaleString('en-KE');
export const shortDate = (iso: string | null | undefined) =>
    iso ? new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

/** Client-side sorting for report tables; nulls always sort last. */
export function useSort<T>(rows: T[] | undefined, initial: keyof T & string, initialDir: 'asc' | 'desc' = 'desc') {
    const [key, setKey] = useState<keyof T & string>(initial);
    const [dir, setDir] = useState<'asc' | 'desc'>(initialDir);
    const sorted = useMemo(() => {
        const list = [...(rows ?? [])];
        return list.sort((a, b) => {
            const x = a[key] as unknown, y = b[key] as unknown;
            if (x == null && y == null) return 0;
            if (x == null) return 1;
            if (y == null) return -1;
            const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
            return dir === 'asc' ? c : -c;
        });
    }, [rows, key, dir]);
    const toggle = (k: keyof T & string) => {
        if (k === key) setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        else { setKey(k); setDir(typeof rows?.[0]?.[k] === 'string' ? 'asc' : 'desc'); }
    };
    return { sorted, key, dir, toggle };
}

export function SortTh<K extends string>({ label, k, sort, align = 'right', className = '' }: {
    label: string; k: K; sort: { key: string; dir: 'asc' | 'desc'; toggle: (k: K) => void }; align?: 'left' | 'right'; className?: string;
}) {
    const active = sort.key === k;
    const Icon = sort.dir === 'asc' ? ChevronUpIcon : ChevronDownIcon;
    return (
        <th className={`${thCls} ${align === 'right' ? 'text-right' : 'text-left'} ${className}`} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
            <button type="button" onClick={() => sort.toggle(k)}
                className={`inline-flex items-center gap-0.5 uppercase hover:text-gray-900 dark:hover:text-white ${active ? 'text-gray-900 dark:text-white' : ''}`}>
                {label}
                <Icon className={`h-3.5 w-3.5 ${active ? '' : 'opacity-0'}`} />
            </button>
        </th>
    );
}

export function ExportButton({ filename, rows, disabled }: { filename: string; rows: () => (string | number | null | undefined)[][]; disabled?: boolean }) {
    return (
        <button type="button" disabled={disabled} onClick={() => downloadCsv(filename, toCsv(rows()))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
            <ArrowDownTrayIcon className="h-4 w-4" /> Export CSV
        </button>
    );
}

/** Profit margin with a colour hint; red when selling below cost. */
export function Margin({ value }: { value: number | null }) {
    if (value == null) return <span className="text-gray-400">—</span>;
    const tone = value < 0 ? 'text-rose-600 dark:text-rose-400' : value < 0.1 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-700 dark:text-gray-200';
    return <span className={tone}>{pct(value)}</span>;
}

/** Thin share-of-total bar used in rollup tables. */
export function ShareBar({ share }: { share: number }) {
    return (
        <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                <div className="h-full rounded-full bg-blue-600 dark:bg-blue-400" style={{ width: `${Math.max(2, Math.min(100, share * 100))}%` }} />
            </div>
            <span className="w-12 text-right text-xs text-gray-500 tabular-nums dark:text-gray-400">{pct(share, 0)}</span>
        </div>
    );
}

export function TableShell({ children, loading, empty, cols }: { children: React.ReactNode; loading?: boolean; empty?: string | false; cols: number }) {
    return (
        <div className={`${card} overflow-x-auto`}>
            <table className="w-full min-w-[720px] text-left text-[13px]">
                {children}
                {(loading || empty) && (
                    <tbody>
                        <tr>
                            <td colSpan={cols} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                {loading ? <div className="mx-auto h-6 max-w-md animate-pulse rounded bg-gray-100 dark:bg-gray-700/40" /> : empty}
                            </td>
                        </tr>
                    </tbody>
                )}
            </table>
        </div>
    );
}

/** csv-friendly number: 2dp, no currency formatting */
export const csvNum = (n: number | null | undefined) => (n == null ? '' : Math.round(n * 100) / 100);
export const csvPct = (n: number | null | undefined) => (n == null ? '' : Math.round(n * 1000) / 10);
