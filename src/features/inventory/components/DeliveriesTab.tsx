'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { PlusIcon, TrashIcon, TruckIcon } from '@heroicons/react/24/outline';
import { formatMoney } from '@/features/orders/components/OrderTable';
import { Btn, Modal, fieldCls, labelCls } from '@/features/orders/components/OrderDialogs';
import { useProducts } from '@/features/products/hooks/useProducts';
import { useReceipts, useReceiveStock, useSuppliers } from '../hooks/useInventory';

const errMsg = (e: unknown) => { const m = (e as { message?: string | string[] })?.message; return Array.isArray(m) ? m.join(', ') : m || 'Could not save the delivery.'; };
const card = 'rounded-xl border border-gray-200/80 bg-white dark:border-gray-700/70 dark:bg-gray-800';

export function DeliveriesTab() {
    const [page, setPage] = useState(1);
    const [receiving, setReceiving] = useState(false);
    const { data, isLoading } = useReceipts({ page, limit: 20 });

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">Each delivery raises stock, records the supplier and cost, and gets a GRN number.</p>
                <Btn tone="primary" onClick={() => setReceiving(true)}><TruckIcon className="h-4 w-4" /> Receive delivery</Btn>
            </div>
            <div className={`${card} overflow-hidden`}>
                <table className="w-full text-left text-[13px]">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-700/70 dark:bg-gray-900/30 dark:text-gray-400">
                            <th className="px-4 py-2.5">GRN</th><th className="px-3 py-2.5">Supplier</th><th className="px-3 py-2.5">Items</th><th className="px-3 py-2.5 text-right">Units</th><th className="px-4 py-2.5 text-right">Cost</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/70">
                        {isLoading && <tr><td colSpan={5} className="px-4 py-8"><div className="h-6 animate-pulse rounded bg-gray-50 dark:bg-gray-700/40" /></td></tr>}
                        {!isLoading && !data?.data.length && <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">No deliveries recorded yet.</td></tr>}
                        {data?.data.map((r) => (
                            <tr key={r.id}>
                                <td className="px-4 py-2.5">
                                    <p className="font-mono font-semibold text-gray-900 dark:text-white">{r.grnNumber}</p>
                                    <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}{r.actor ? ` · ${r.actor}` : ''}</p>
                                </td>
                                <td className="px-3 py-2.5 text-gray-700 dark:text-gray-200">{r.supplier?.name ?? '—'}{r.supplierRef && <span className="block text-xs text-gray-400">Ref {r.supplierRef}</span>}</td>
                                <td className="max-w-[280px] px-3 py-2.5 text-xs text-gray-500">{r.lines.map((l) => `${l.quantity}× ${l.sku}`).join(', ')}</td>
                                <td className="px-3 py-2.5 text-right tabular-nums">{r.lines.reduce((n, l) => n + l.quantity, 0)}</td>
                                <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-gray-900 dark:text-white">{Number(r.totalCost) ? formatMoney(r.totalCost) : '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {data && data.meta.totalPages > 1 && (
                <div className="flex items-center justify-end gap-2 text-sm">
                    <Btn onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Btn>
                    <span className="tabular-nums text-gray-500">{page} / {data.meta.totalPages}</span>
                    <Btn onClick={() => setPage((p) => p + 1)} disabled={page >= data.meta.totalPages}>Next</Btn>
                </div>
            )}
            {receiving && <ReceiveDialog onClose={() => setReceiving(false)} />}
        </div>
    );
}

type Line = { productId: string; sku: string; name: string; quantity: string; unitCost: string };

function ReceiveDialog({ onClose }: { onClose: () => void }) {
    const receive = useReceiveStock();
    const { data: suppliers } = useSuppliers();
    const [supplierId, setSupplierId] = useState('');
    const [newSupplier, setNewSupplier] = useState('');
    const [ref, setRef] = useState('');
    const [note, setNote] = useState('');
    const [updateCost, setUpdateCost] = useState(true);
    const [lines, setLines] = useState<Line[]>([]);
    const [q, setQ] = useState('');
    const { data: found } = useProducts({ search: q.trim() || undefined, limit: 8 }, { enabled: q.trim().length >= 2 });

    const add = (p: { id: string; sku: string; name: string; costPrice?: number | string | null }) => {
        if (lines.some((l) => l.productId === p.id)) return;
        setLines((ls) => [...ls, { productId: p.id, sku: p.sku, name: p.name, quantity: '', unitCost: p.costPrice != null ? String(p.costPrice) : '' }]);
        setQ('');
    };
    const set = (i: number, patch: Partial<Line>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
    const valid = lines.length > 0 && lines.every((l) => Number(l.quantity) > 0) && (supplierId !== 'new' || newSupplier.trim());
    const total = lines.reduce((n, l) => n + (Number(l.quantity) || 0) * (Number(l.unitCost) || 0), 0);

    const submit = () => receive.mutate({
        supplierId: supplierId && supplierId !== 'new' ? supplierId : undefined,
        supplierName: supplierId === 'new' ? newSupplier.trim() : undefined,
        supplierRef: ref.trim() || undefined, note: note.trim() || undefined, updateCost,
        lines: lines.map((l) => ({ productId: l.productId, quantity: Math.trunc(Number(l.quantity)), ...(l.unitCost !== '' ? { unitCost: Number(l.unitCost) } : {}) })),
    }, {
        onSuccess: (r) => { toast.success(`${r.grnNumber} received — stock updated`); onClose(); },
        onError: (e) => toast.error(errMsg(e)),
    });

    return (
        <Modal open onClose={onClose} title="Receive delivery" subtitle="Adds the quantities to stock and records the supplier and cost."
            footer={<><span className="mr-auto self-center text-sm text-gray-500">Total cost <strong className="tabular-nums text-gray-900 dark:text-white">{formatMoney(total)}</strong></span><Btn onClick={onClose}>Back</Btn><Btn tone="primary" onClick={submit} disabled={!valid || receive.isPending}>{receive.isPending ? 'Saving…' : 'Receive stock'}</Btn></>}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label className={labelCls} htmlFor="rc-supplier">Supplier</label>
                    <select id="rc-supplier" className={fieldCls} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                        <option value="">— None —</option>
                        {suppliers?.filter((s) => s.isActive).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        <option value="new">+ New supplier…</option>
                    </select>
                    {supplierId === 'new' && <input className={`${fieldCls} mt-2`} value={newSupplier} onChange={(e) => setNewSupplier(e.target.value)} placeholder="Supplier name" autoFocus />}
                </div>
                <div>
                    <label className={labelCls} htmlFor="rc-ref">Supplier invoice / delivery note</label>
                    <input id="rc-ref" className={fieldCls} value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. INV-7781" />
                </div>
            </div>

            <div>
                <label className={labelCls} htmlFor="rc-search">Add products</label>
                <div className="relative">
                    <input id="rc-search" className={fieldCls} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by SKU or name…" autoComplete="off" />
                    {q.trim().length >= 2 && !!found?.data?.length && (
                        <ul className="absolute left-0 right-0 z-10 mt-1 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                            {found.data.map((p) => (
                                <li key={p.id}>
                                    <button type="button" onClick={() => add(p)} className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <span className="min-w-0"><span className="block truncate font-medium text-gray-900 dark:text-white">{p.name}</span><span className="font-mono text-xs text-gray-400">{p.sku}</span></span>
                                        <span className="shrink-0 text-xs text-gray-500">{p.stockQty} in stock</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {lines.length > 0 && (
                <table className="w-full text-left text-sm">
                    <thead><tr className="text-xs text-gray-500"><th className="pb-1">Product</th><th className="w-24 pb-1">Qty</th><th className="w-28 pb-1">Unit cost</th><th className="w-8" /></tr></thead>
                    <tbody>
                        {lines.map((l, i) => (
                            <tr key={l.productId}>
                                <td className="py-1 pr-2"><p className="truncate font-medium text-gray-900 dark:text-white">{l.name}</p><p className="font-mono text-xs text-gray-400">{l.sku}</p></td>
                                <td className="py-1 pr-2"><input type="number" min={1} className={fieldCls} value={l.quantity} onChange={(e) => set(i, { quantity: e.target.value })} /></td>
                                <td className="py-1 pr-2"><input type="number" min={0} step="0.01" className={fieldCls} value={l.unitCost} onChange={(e) => set(i, { unitCost: e.target.value })} placeholder="—" /></td>
                                <td className="py-1"><button type="button" onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} aria-label="Remove" className="rounded p-1 text-gray-400 hover:text-rose-600"><TrashIcon className="h-4 w-4" /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            {!lines.length && <p className="flex items-center gap-1.5 text-xs text-gray-400"><PlusIcon className="h-3.5 w-3.5" /> Search above to add the products in this delivery.</p>}

            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                <input type="checkbox" checked={updateCost} onChange={(e) => setUpdateCost(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                Update each product&apos;s cost price to this delivery&apos;s unit cost
            </label>
            <div>
                <label className={labelCls} htmlFor="rc-note">Note</label>
                <input id="rc-note" className={fieldCls} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Optional" />
            </div>
        </Modal>
    );
}
