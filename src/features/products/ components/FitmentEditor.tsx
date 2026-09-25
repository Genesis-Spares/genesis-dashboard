'use client';

import { useEffect, useState } from 'react';
import { PlusIcon, TrashIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api/client';
import { ProductFitment } from '@/types/product.types';

const cell = 'h-9 w-full rounded-md border border-gray-200 bg-white px-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100';

/** Kenyan-market makes offered as suggestions even before any product uses them. */
const COMMON_MAKES = ['Toyota', 'Nissan', 'Subaru', 'Mazda', 'Mitsubishi', 'Isuzu', 'Honda', 'Suzuki', 'Volkswagen', 'Mercedes-Benz', 'BMW', 'Ford', 'Land Rover', 'Hyundai', 'Kia', 'Audi', 'Lexus', 'Peugeot'];

/** "Toyota Axio 2010-2015, Nissan Note 2013" → rows (same format the backend backfill understood). */
export function parseFitmentText(text: string): ProductFitment[] {
    return text
        .split(/[,\n;]/)
        .map((part) => part.trim())
        .map((part) => part.match(/^([A-Za-z-]+)\s+(.+?)(?:\s+(\d{4})(?:\s*[-–]\s*(\d{4}|on|\+))?)?$/))
        .filter((m): m is RegExpMatchArray => Boolean(m))
        .map((m) => ({
            make: m[1],
            model: m[2],
            yearFrom: m[3] ? Number(m[3]) : null,
            yearTo: m[4] && /^\d{4}$/.test(m[4]) ? Number(m[4]) : m[4] ? null : m[3] ? Number(m[3]) : null,
        }));
}

export function FitmentEditor({
    fitments,
    isUniversal,
    onChange,
    onUniversalChange,
}: {
    fitments: ProductFitment[];
    isUniversal: boolean;
    onChange: (rows: ProductFitment[]) => void;
    onUniversalChange: (v: boolean) => void;
}) {
    const [makes, setMakes] = useState<string[]>(COMMON_MAKES);
    const [importing, setImporting] = useState(false);
    const [importText, setImportText] = useState('');

    // suggest makes already used in the catalogue too
    useEffect(() => {
        let live = true;
        apiClient.get<{ make: string }[]>('/storefront/vehicles/makes')
            .then((rows: { make: string }[]) => live && setMakes((cur) => [...new Set([...cur, ...rows.map((r) => r.make)])].sort()))
            .catch(() => undefined);
        return () => { live = false; };
    }, []);

    const set = (i: number, patch: Partial<ProductFitment>) => onChange(fitments.map((f, j) => (j === i ? { ...f, ...patch } : f)));
    const year = (v: string) => (v ? Math.max(1950, Math.min(2100, Number(v))) : null);
    const parsed = importText ? parseFitmentText(importText) : [];

    return (
        <div className="space-y-4">
            <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700">
                <input type="checkbox" checked={isUniversal} onChange={(e) => onUniversalChange(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600" />
                <span>
                    <span className="font-medium text-gray-900 dark:text-white">Universal part</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">Fits any vehicle (oils, bulbs, wipers, tools…). Always shown when shoppers filter by vehicle.</span>
                </span>
            </label>

            {fitments.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-sm">
                        <thead>
                            <tr className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                <th className="pb-1.5 pr-2">Make *</th><th className="pb-1.5 pr-2">Model *</th><th className="w-24 pb-1.5 pr-2">From</th>
                                <th className="w-24 pb-1.5 pr-2">To</th><th className="pb-1.5 pr-2">Engine / notes</th><th className="w-9" />
                            </tr>
                        </thead>
                        <tbody>
                            {fitments.map((f, i) => (
                                <tr key={i}>
                                    <td className="py-1 pr-2"><input list="fitment-makes" className={cell} value={f.make} onChange={(e) => set(i, { make: e.target.value })} placeholder="Toyota" /></td>
                                    <td className="py-1 pr-2"><input className={cell} value={f.model} onChange={(e) => set(i, { model: e.target.value })} placeholder="Axio" /></td>
                                    <td className="py-1 pr-2"><input type="number" className={cell} value={f.yearFrom ?? ''} onChange={(e) => set(i, { yearFrom: year(e.target.value) })} placeholder="2010" /></td>
                                    <td className="py-1 pr-2"><input type="number" className={cell} value={f.yearTo ?? ''} onChange={(e) => set(i, { yearTo: year(e.target.value) })} placeholder="2015" /></td>
                                    <td className="py-1 pr-2"><input className={cell} value={f.engine ?? ''} onChange={(e) => set(i, { engine: e.target.value })} placeholder="1.5L 1NZ-FE" /></td>
                                    <td className="py-1">
                                        <button type="button" onClick={() => onChange(fitments.filter((_, j) => j !== i))} aria-label="Remove vehicle" className="rounded-md p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10">
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <datalist id="fitment-makes">{makes.map((m) => <option key={m} value={m} />)}</datalist>
                    <p className="mt-1 text-xs text-gray-400">Leave a year empty for open-ended ranges (e.g. only &ldquo;From 2018&rdquo;).</p>
                </div>
            )}

            <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => onChange([...fitments, { make: '', model: '', yearFrom: null, yearTo: null }])}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
                    <PlusIcon className="h-4 w-4" /> Add vehicle
                </button>
                <button type="button" onClick={() => setImporting((v) => !v)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700">
                    <ClipboardDocumentListIcon className="h-4 w-4" /> Import from text
                </button>
            </div>

            {importing && (
                <div className="rounded-lg border border-dashed border-gray-300 p-3 dark:border-gray-600">
                    <textarea rows={3} value={importText} onChange={(e) => setImportText(e.target.value)} className={`${cell} h-auto py-2`}
                        placeholder="Toyota Axio 2010-2015, Toyota Fielder 2012-2018, Nissan Note 2013" />
                    <div className="mt-2 flex items-center gap-3">
                        <button type="button" disabled={!parsed.length}
                            onClick={() => { onChange([...fitments, ...parsed]); setImportText(''); setImporting(false); }}
                            className="h-8 rounded-md bg-blue-600 px-3 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                            Add {parsed.length || ''} vehicle{parsed.length === 1 ? '' : 's'}
                        </button>
                        <span className="text-xs text-gray-500">One per comma or line: &ldquo;Make Model Year&rdquo; or &ldquo;Make Model YearFrom-YearTo&rdquo;.</span>
                    </div>
                </div>
            )}
        </div>
    );
}
