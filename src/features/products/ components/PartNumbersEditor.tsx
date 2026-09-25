'use client';

import { useState } from 'react';
import { ClipboardDocumentListIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { PartNumberType, ProductPartNumber } from '@/types/product.types';

const cell = 'h-9 w-full rounded-md border border-gray-200 bg-white px-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100';

const TYPES: { value: PartNumberType; label: string }[] = [
    { value: 'OE', label: 'OE (vehicle maker)' },
    { value: 'MANUFACTURER', label: 'Manufacturer' },
    { value: 'AFTERMARKET', label: 'Aftermarket equivalent' },
];

/** Known vehicle makers — a pasted number from one of these is marked OE, others aftermarket. */
const VEHICLE_MAKERS = new Set(['toyota', 'nissan', 'subaru', 'mazda', 'mitsubishi', 'isuzu', 'honda', 'suzuki', 'volkswagen', 'vw', 'mercedes', 'mercedes-benz', 'bmw', 'ford', 'land rover', 'hyundai', 'kia', 'audi', 'lexus', 'peugeot']);

/**
 * "Toyota 04465-12592, Bosch 0 986 494 191, DB1765" → rows. A leading word
 * without digits is taken as the brand; the rest is the number.
 */
export function parsePartNumbers(text: string, fallbackType: PartNumberType): ProductPartNumber[] {
    return text
        .split(/[,\n;]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => {
            const m = s.match(/^([A-Za-z][A-Za-z -]*?)\s+([A-Za-z]*\d[\w .\-/]*)$/);
            const brand = m ? m[1].trim() : '';
            const number = (m ? m[2] : s).trim();
            const type: PartNumberType = brand && VEHICLE_MAKERS.has(brand.toLowerCase()) ? 'OE' : brand ? 'AFTERMARKET' : fallbackType;
            return { number, brand: brand || null, type };
        })
        .filter((r) => r.number.replace(/[^A-Za-z0-9]/g, '').length >= 2);
}

export function PartNumbersEditor({ rows, onChange }: { rows: ProductPartNumber[]; onChange: (rows: ProductPartNumber[]) => void }) {
    const [importing, setImporting] = useState(false);
    const [text, setText] = useState('');
    const parsed = text ? parsePartNumbers(text, 'AFTERMARKET') : [];
    const set = (i: number, patch: Partial<ProductPartNumber>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

    return (
        <div className="space-y-3">
            {rows.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left text-sm">
                        <thead>
                            <tr className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                <th className="w-52 pb-1.5 pr-2">Type</th><th className="w-40 pb-1.5 pr-2">Brand</th><th className="pb-1.5 pr-2">Part number *</th><th className="w-9" />
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r, i) => (
                                <tr key={i}>
                                    <td className="py-1 pr-2">
                                        <select className={cell} value={r.type} onChange={(e) => set(i, { type: e.target.value as PartNumberType })}>
                                            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </select>
                                    </td>
                                    <td className="py-1 pr-2"><input className={cell} value={r.brand ?? ''} onChange={(e) => set(i, { brand: e.target.value })} placeholder="Toyota / Bosch" /></td>
                                    <td className="py-1 pr-2"><input className={`${cell} font-mono`} value={r.number} onChange={(e) => set(i, { number: e.target.value })} placeholder="04465-12592" /></td>
                                    <td className="py-1">
                                        <button type="button" onClick={() => onChange(rows.filter((_, j) => j !== i))} aria-label="Remove number" className="rounded-md p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10">
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p className="mt-1 text-xs text-gray-400">Type numbers exactly as printed — shoppers can search them with or without dashes and spaces.</p>
                </div>
            )}

            <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => onChange([...rows, { number: '', brand: '', type: rows.length ? 'AFTERMARKET' : 'OE' }])}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
                    <PlusIcon className="h-4 w-4" /> Add number
                </button>
                <button type="button" onClick={() => setImporting((v) => !v)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700">
                    <ClipboardDocumentListIcon className="h-4 w-4" /> Paste a list
                </button>
            </div>

            {importing && (
                <div className="rounded-lg border border-dashed border-gray-300 p-3 dark:border-gray-600">
                    <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} className={`${cell} h-auto py-2 font-mono`}
                        placeholder="Toyota 04465-12592, Bosch 0 986 494 191, Bendix DB1765" />
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                        <button type="button" disabled={!parsed.length}
                            onClick={() => { onChange([...rows, ...parsed]); setText(''); setImporting(false); }}
                            className="h-8 rounded-md bg-blue-600 px-3 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                            Add {parsed.length || ''} number{parsed.length === 1 ? '' : 's'}
                        </button>
                        <span className="text-xs text-gray-500">&ldquo;Brand Number&rdquo; per comma or line. Car-maker brands become OE, others aftermarket — adjust after adding.</span>
                    </div>
                </div>
            )}
        </div>
    );
}
