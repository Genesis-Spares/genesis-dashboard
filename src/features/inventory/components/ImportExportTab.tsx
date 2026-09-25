'use client';

import { useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Btn, fieldCls, labelCls } from '@/features/orders/components/OrderDialogs';
import { inventoryApi } from '../api/inventory.api';
import { useBulkStock } from '../hooks/useInventory';
import { downloadCsv, stockLinesFromCsv, toCsv } from '../csv';
import { BulkResult } from '@/types/inventory.types';

const errMsg = (e: unknown) => { const m = (e as { message?: string | string[] })?.message; return Array.isArray(m) ? m.join(', ') : m || 'Import failed.'; };
const card = 'rounded-xl border border-gray-200/80 bg-white p-5 dark:border-gray-700/70 dark:bg-gray-800';

export function ImportExportTab() {
    const fileRef = useRef<HTMLInputElement>(null);
    const bulk = useBulkStock();
    const [mode, setMode] = useState<'RECEIVE' | 'SET'>('RECEIVE');
    const [supplierName, setSupplierName] = useState('');
    const [lines, setLines] = useState<{ sku: string; quantity: number; unitCost?: number }[] | null>(null);
    const [fileName, setFileName] = useState('');
    const [preview, setPreview] = useState<BulkResult | null>(null);
    const [exporting, setExporting] = useState(false);

    const onFile = async (f?: File) => {
        if (!f) return;
        setPreview(null);
        const { lines: parsed, error } = stockLinesFromCsv(await f.text());
        if (error) { toast.error(error); return; }
        setFileName(f.name);
        setLines(parsed);
        bulk.mutate({ mode, dryRun: true, lines: parsed }, { onSuccess: setPreview, onError: (e) => toast.error(errMsg(e)) });
    };

    const rerunPreview = (m: 'RECEIVE' | 'SET') => {
        setMode(m);
        if (lines) bulk.mutate({ mode: m, dryRun: true, lines }, { onSuccess: setPreview, onError: (e) => toast.error(errMsg(e)) });
    };

    const apply = () => {
        if (!lines) return;
        bulk.mutate({ mode, lines, supplierName: mode === 'RECEIVE' && supplierName.trim() ? supplierName.trim() : undefined, note: `CSV: ${fileName}` }, {
            onSuccess: (r) => {
                toast.success(mode === 'RECEIVE' ? `Delivery ${r.grnNumber} recorded — ${r.summary.valid} products updated` : `Stock take applied — ${r.summary.valid} products updated`);
                setPreview(null); setLines(null); setFileName('');
                if (fileRef.current) fileRef.current.value = '';
            },
            onError: (e) => toast.error(errMsg(e)),
        });
    };

    const exportCsv = async () => {
        setExporting(true);
        try {
            const rows = await inventoryApi.export();
            downloadCsv(`genesis-stock-${new Date().toISOString().slice(0, 10)}.csv`, toCsv([
                ['sku', 'name', 'brand', 'quantity', 'reorder_level', 'unit_cost', 'price'],
                ...rows.map((r) => [r.sku, r.name, r.brand ?? '', r.stockQty, r.minStockQty ?? '', r.costPrice ?? '', r.price]),
            ]));
        } catch (e) { toast.error(errMsg(e)); } finally { setExporting(false); }
    };

    const template = () => downloadCsv('stock-import-template.csv', toCsv([['sku', 'quantity', 'unit_cost'], ['AW-18-SILVER-5X114', 10, 18500]]));

    return (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
            <div className={`${card} space-y-4`}>
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Import stock from CSV</h3>
                    <p className="mt-0.5 text-xs text-gray-500">Columns: <code>sku</code>, <code>quantity</code>, optional <code>unit_cost</code>. You&apos;ll see a preview before anything changes.</p>
                </div>
                <div className="inline-flex rounded-lg bg-gray-100 p-0.5 text-xs font-medium dark:bg-gray-700/60">
                    {([['RECEIVE', 'Add to stock (delivery)'], ['SET', 'Replace stock (stock take)']] as const).map(([m, l]) => (
                        <button key={m} type="button" onClick={() => rerunPreview(m)} className={`rounded-md px-3 py-1.5 transition ${mode === m ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{l}</button>
                    ))}
                </div>
                {mode === 'RECEIVE' && (
                    <div className="max-w-sm">
                        <label className={labelCls} htmlFor="imp-supplier">Supplier (optional)</label>
                        <input id="imp-supplier" className={fieldCls} value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Recorded on the GRN" />
                    </div>
                )}
                <div className="flex flex-wrap items-center gap-2">
                    <Btn onClick={() => fileRef.current?.click()}><ArrowUpTrayIcon className="h-4 w-4" /> Choose CSV file</Btn>
                    <button type="button" onClick={template} className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">Download template</button>
                    {fileName && <span className="text-xs text-gray-500">{fileName}</span>}
                    <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
                </div>

                {preview && (
                    <>
                        <div className="flex flex-wrap gap-3 text-sm">
                            <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400"><CheckCircleIcon className="h-4 w-4" /> {preview.summary.valid} ready</span>
                            {preview.summary.invalid > 0 && <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400"><ExclamationTriangleIcon className="h-4 w-4" /> {preview.summary.invalid} will be skipped</span>}
                        </div>
                        <div className="max-h-80 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
                            <table className="w-full text-left text-[13px]">
                                <thead className="sticky top-0 bg-gray-50 text-[11px] font-semibold uppercase text-gray-500 dark:bg-gray-900">
                                    <tr><th className="px-3 py-2">Row</th><th className="px-3 py-2">SKU</th><th className="px-3 py-2">Product</th><th className="px-3 py-2 text-right">Stock</th><th className="px-3 py-2" /></tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/70">
                                    {preview.preview.map((l) => (
                                        <tr key={l.row} className={l.problem ? 'bg-amber-50/60 dark:bg-amber-500/5' : ''}>
                                            <td className="px-3 py-1.5 text-gray-400">{l.row + 1}</td>
                                            <td className="px-3 py-1.5 font-mono">{l.sku || '—'}</td>
                                            <td className="px-3 py-1.5 text-gray-700 dark:text-gray-200">{l.name ?? ''}</td>
                                            <td className="px-3 py-1.5 text-right tabular-nums">{l.problem ? '' : `${l.current} → ${l.after}`}</td>
                                            <td className="px-3 py-1.5 text-xs text-amber-700 dark:text-amber-400">{l.problem}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-end">
                            <Btn tone="primary" onClick={apply} disabled={!preview.summary.valid || bulk.isPending}>
                                {bulk.isPending ? 'Applying…' : `Apply to ${preview.summary.valid} product${preview.summary.valid === 1 ? '' : 's'}`}
                            </Btn>
                        </div>
                    </>
                )}
            </div>

            <div className={`${card} h-fit space-y-3`}>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Export stock</h3>
                <p className="text-xs text-gray-500">Every active product with quantity, reorder level, cost and price — ready for a stock take or your accountant.</p>
                <Btn onClick={exportCsv} disabled={exporting}><ArrowDownTrayIcon className="h-4 w-4" /> {exporting ? 'Preparing…' : 'Download CSV'}</Btn>
                <p className="text-xs text-gray-400">Tip: export, count, edit the quantity column, then import it as a stock take.</p>
            </div>
        </div>
    );
}
