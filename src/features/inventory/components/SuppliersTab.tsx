'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { PencilSquareIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Btn, Modal, fieldCls, labelCls } from '@/features/orders/components/OrderDialogs';
import { useSaveSupplier, useSuppliers } from '../hooks/useInventory';
import { Supplier } from '@/types/inventory.types';

const errMsg = (e: unknown) => { const m = (e as { message?: string | string[] })?.message; return Array.isArray(m) ? m.join(', ') : m || 'Could not save the supplier.'; };

export function SuppliersTab() {
    const { data, isLoading } = useSuppliers();
    const [editing, setEditing] = useState<Partial<Supplier> | null>(null);

    return (
        <div className="space-y-3">
            <div className="flex justify-end"><Btn tone="primary" onClick={() => setEditing({ name: '' })}><PlusIcon className="h-4 w-4" /> Add supplier</Btn></div>
            <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white dark:border-gray-700/70 dark:bg-gray-800">
                <table className="w-full text-left text-[13px]">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/60 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-700/70 dark:bg-gray-900/30 dark:text-gray-400">
                            <th className="px-4 py-2.5">Supplier</th><th className="px-3 py-2.5">Contact</th><th className="px-3 py-2.5 text-right">Deliveries</th><th className="px-4 py-2.5" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/70">
                        {isLoading && <tr><td colSpan={4} className="px-4 py-8"><div className="h-6 animate-pulse rounded bg-gray-50 dark:bg-gray-700/40" /></td></tr>}
                        {!isLoading && !data?.length && <tr><td colSpan={4} className="px-4 py-12 text-center text-gray-500">No suppliers yet — add one here or when receiving a delivery.</td></tr>}
                        {data?.map((s) => (
                            <tr key={s.id} className={s.isActive ? '' : 'opacity-50'}>
                                <td className="px-4 py-2.5"><p className="font-medium text-gray-900 dark:text-white">{s.name}</p>{s.notes && <p className="text-xs text-gray-400">{s.notes}</p>}</td>
                                <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">{[s.contactName, s.phone, s.email].filter(Boolean).join(' · ') || '—'}</td>
                                <td className="px-3 py-2.5 text-right tabular-nums">{s._count?.receipts ?? 0}</td>
                                <td className="px-4 py-2.5 text-right"><button onClick={() => setEditing(s)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"><PencilSquareIcon className="h-4 w-4" /> Edit</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {editing && <SupplierDialog supplier={editing} onClose={() => setEditing(null)} />}
        </div>
    );
}

function SupplierDialog({ supplier, onClose }: { supplier: Partial<Supplier>; onClose: () => void }) {
    const save = useSaveSupplier();
    const [s, setS] = useState<Partial<Supplier>>(supplier);
    const f = (k: keyof Supplier) => (e: React.ChangeEvent<HTMLInputElement>) => setS((x) => ({ ...x, [k]: e.target.value }));
    const submit = () => save.mutate({ ...s, name: (s.name ?? '').trim() } as Supplier, {
        onSuccess: () => { toast.success('Supplier saved'); onClose(); },
        onError: (e) => toast.error(errMsg(e)),
    });
    return (
        <Modal open onClose={onClose} title={supplier.id ? 'Edit supplier' : 'Add supplier'}
            footer={<><Btn onClick={onClose}>Back</Btn><Btn tone="primary" onClick={submit} disabled={!s.name?.trim() || save.isPending}>{save.isPending ? 'Saving…' : 'Save'}</Btn></>}>
            <div><label className={labelCls} htmlFor="sp-name">Name *</label><input id="sp-name" className={fieldCls} value={s.name ?? ''} onChange={f('name')} autoFocus /></div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><label className={labelCls} htmlFor="sp-contact">Contact person</label><input id="sp-contact" className={fieldCls} value={s.contactName ?? ''} onChange={f('contactName')} /></div>
                <div><label className={labelCls} htmlFor="sp-phone">Phone</label><input id="sp-phone" className={fieldCls} value={s.phone ?? ''} onChange={f('phone')} /></div>
            </div>
            <div><label className={labelCls} htmlFor="sp-email">Email</label><input id="sp-email" type="email" className={fieldCls} value={s.email ?? ''} onChange={f('email')} /></div>
            <div><label className={labelCls} htmlFor="sp-notes">Notes</label><input id="sp-notes" className={fieldCls} value={s.notes ?? ''} onChange={f('notes')} placeholder="e.g. Delivers Tuesdays, 30-day terms" /></div>
            {supplier.id && (
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                    <input type="checkbox" checked={s.isActive ?? true} onChange={(e) => setS((x) => ({ ...x, isActive: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-blue-600" /> Active
                </label>
            )}
        </Modal>
    );
}
