'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Btn, Modal, fieldCls, labelCls } from '@/features/orders/components/OrderDialogs';
import { useAdjustStock } from '../hooks/useInventory';
import { AdjustReason } from '@/types/inventory.types';

const REASONS: { value: AdjustReason; label: string }[] = [
    { value: 'COUNT', label: 'Stock count correction' },
    { value: 'DAMAGED', label: 'Damaged / written off' },
    { value: 'LOST', label: 'Lost / missing' },
    { value: 'FOUND', label: 'Found' },
    { value: 'OTHER', label: 'Other' },
];

const errMsg = (e: unknown) => { const m = (e as { message?: string | string[] })?.message; return Array.isArray(m) ? m.join(', ') : m || 'Could not adjust stock.'; };

/** Correct a product's stock: set to a counted number, or add/remove units — with a reason. */
export function AdjustDialog({ product, onClose }: { product: { id: string; sku: string; name: string; stockQty: number }; onClose: () => void }) {
    const adjust = useAdjustStock();
    const [mode, setMode] = useState<'SET' | 'CHANGE'>('SET');
    const [qty, setQty] = useState(String(product.stockQty));
    const [reason, setReason] = useState<AdjustReason>('COUNT');
    const [note, setNote] = useState('');
    const n = Math.trunc(Number(qty));
    const after = mode === 'SET' ? n : product.stockQty + n;
    const valid = qty.trim() !== '' && Number.isFinite(n) && after >= 0 && (mode === 'SET' ? n !== product.stockQty : n !== 0);

    const submit = () => adjust.mutate({ productId: product.id, mode, quantity: n, reason, note: note.trim() || undefined }, {
        onSuccess: () => { toast.success(`${product.sku}: stock now ${after}`); onClose(); },
        onError: (e) => toast.error(errMsg(e)),
    });

    return (
        <Modal open onClose={onClose} title={`Adjust stock · ${product.sku}`} subtitle={`${product.name} — currently ${product.stockQty} in stock`}
            footer={<><Btn onClick={onClose}>Back</Btn><Btn tone="primary" onClick={submit} disabled={!valid || adjust.isPending}>{adjust.isPending ? 'Saving…' : 'Save adjustment'}</Btn></>}>
            <div className="inline-flex rounded-lg bg-gray-100 p-0.5 text-xs font-medium dark:bg-gray-700/60">
                {([['SET', 'Set counted quantity'], ['CHANGE', 'Add / remove units']] as const).map(([m, l]) => (
                    <button key={m} type="button" onClick={() => { setMode(m); setQty(m === 'SET' ? String(product.stockQty) : ''); }}
                        className={`rounded-md px-3 py-1.5 transition ${mode === m ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{l}</button>
                ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelCls} htmlFor="adj-qty">{mode === 'SET' ? 'Counted quantity' : 'Change (use − to remove)'}</label>
                    <input id="adj-qty" type="number" className={fieldCls} value={qty} onChange={(e) => setQty(e.target.value)} autoFocus placeholder={mode === 'CHANGE' ? 'e.g. -2' : ''} />
                </div>
                <div>
                    <span className={labelCls}>Result</span>
                    <p className={`h-9 rounded-lg px-3 py-2 text-sm font-semibold tabular-nums ${after < 0 ? 'bg-rose-50 text-rose-700' : 'bg-gray-50 text-gray-900 dark:bg-gray-900/40 dark:text-white'}`}>
                        {product.stockQty} → {Number.isFinite(after) ? after : '—'}
                    </p>
                </div>
            </div>
            <div>
                <label className={labelCls} htmlFor="adj-reason">Reason</label>
                <select id="adj-reason" className={fieldCls} value={reason} onChange={(e) => setReason(e.target.value as AdjustReason)}>
                    {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
            </div>
            <div>
                <label className={labelCls} htmlFor="adj-note">Note</label>
                <input id="adj-note" className={fieldCls} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Optional — e.g. which shelf" />
            </div>
            <p className="text-xs text-gray-500">To add stock from a supplier delivery, use <strong>Receive delivery</strong> instead so the cost and supplier are recorded.</p>
        </Modal>
    );
}
