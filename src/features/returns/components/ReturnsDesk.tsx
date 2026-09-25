'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { ArrowUturnLeftIcon, CheckIcon, InboxArrowDownIcon, MagnifyingGlassIcon, BanknotesIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { formatMoney } from '@/features/orders/components/OrderTable';
import { Btn, Modal, fieldCls, labelCls } from '@/features/orders/components/OrderDialogs';
import { useReturnAction, useReturns } from '../hooks/useReturns';
import { AdminReturn, ReturnStatus } from '@/types/return.types';

const TABS: { id: ReturnStatus | ''; label: string }[] = [
    { id: 'REQUESTED', label: 'To review' },
    { id: 'APPROVED', label: 'Awaiting parts' },
    { id: 'RECEIVED', label: 'To refund' },
    { id: 'REFUNDED', label: 'Refunded' },
    { id: 'REJECTED', label: 'Declined' },
    { id: '', label: 'All' },
];

const BADGE: Record<ReturnStatus, string> = {
    REQUESTED: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400',
    APPROVED: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400',
    RECEIVED: 'bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-400',
    REFUNDED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400',
    REJECTED: 'bg-gray-100 text-gray-600 ring-gray-500/20 dark:bg-gray-700 dark:text-gray-300',
};
const LABEL: Record<ReturnStatus, string> = { REQUESTED: 'To review', APPROVED: 'Approved', RECEIVED: 'Received', REFUNDED: 'Refunded', REJECTED: 'Declined' };
const METHOD: Record<string, string> = { mpesa: 'M-Pesa', card: 'card', cod: 'M-Pesa (paid on delivery)' };

const errMsg = (e: unknown, fallback: string) => {
    const m = (e as { message?: string | string[] })?.message;
    return Array.isArray(m) ? m.join(', ') : m || fallback;
};
const card = 'rounded-xl border border-gray-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] dark:border-gray-700/70 dark:bg-gray-800';
const itemsValue = (r: AdminReturn) => r.items.reduce((n, i) => n + Number(i.unitPrice) * i.quantity, 0);
const suggested = (r: AdminReturn) => itemsValue(r) + (r.ourFault ? Number(r.order.shippingAmount) : 0);

export function ReturnsDesk() {
    const [status, setStatus] = useState<ReturnStatus | ''>('REQUESTED');
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState<string>();
    const { data, isLoading } = useReturns({ status: status || undefined, search: search.trim() || undefined, limit: 50 });
    const list = data?.data ?? [];
    const active = list.find((r) => r.id === selectedId) ?? list[0];

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">
            <section className={`${card} flex min-h-[520px] flex-col overflow-hidden`}>
                <div className="space-y-3 border-b border-gray-100 p-4 dark:border-gray-700/70">
                    <div className="relative">
                        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="RMA, order, customer, part…" className={`${fieldCls} pl-9`} />
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {TABS.map((t) => {
                            const n = t.id ? data?.byStatus?.[t.id] : undefined;
                            return (
                                <button key={t.label} onClick={() => { setStatus(t.id); setSelectedId(undefined); }}
                                    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${status === t.id ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                                    {t.label}{n ? <span className="tabular-nums opacity-70">{n}</span> : null}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <ul className="flex-1 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-700/70">
                    {isLoading && [0, 1, 2].map((i) => <li key={i} className="p-4"><div className="h-12 animate-pulse rounded bg-gray-50 dark:bg-gray-700/40" /></li>)}
                    {!isLoading && list.length === 0 && (
                        <li className="flex flex-col items-center gap-2 px-4 py-16 text-center text-sm text-gray-400"><ArrowUturnLeftIcon className="h-7 w-7" />No returns here.</li>
                    )}
                    {list.map((r) => (
                        <li key={r.id}>
                            <button onClick={() => setSelectedId(r.id)} className={`w-full px-4 py-3 text-left transition ${active?.id === r.id ? 'bg-blue-50/70 dark:bg-blue-500/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-[12.5px] font-semibold text-gray-900 dark:text-white">{r.rmaNumber}</span>
                                    <span className={`ml-auto rounded px-1.5 py-0.5 text-[10.5px] font-semibold ring-1 ring-inset ${BADGE[r.status]}`}>{LABEL[r.status]}</span>
                                </div>
                                <p className="mt-0.5 truncate text-[13px] text-gray-700 dark:text-gray-200">{r.order.customerName} · {r.reasonLabel}</p>
                                <p className="truncate text-xs text-gray-400">{r.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}</p>
                            </button>
                        </li>
                    ))}
                </ul>
            </section>

            <section className={`${card} min-h-[520px]`}>
                {active ? <ReturnDetail key={active.id} r={active} /> : (
                    <div className="flex h-full min-h-[520px] items-center justify-center text-sm text-gray-400">Select a return.</div>
                )}
            </section>
        </div>
    );
}

function ReturnDetail({ r }: { r: AdminReturn }) {
    const { can } = usePermissions();
    const canAct = can({ permission: 'order:update' });
    const [dialog, setDialog] = useState<'approve' | 'reject' | 'receive' | 'refund' | null>(null);

    const timeline = [
        ['Requested', r.createdAt], ['Approved', r.approvedAt], ['Declined', r.rejectedAt], ['Received', r.receivedAt], ['Refunded', r.refundedAt],
    ].filter(([, t]) => t) as [string, string][];

    return (
        <div className="flex h-full flex-col">
            <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-700/70">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="font-mono text-[11px] font-semibold text-gray-400">{r.rmaNumber}</p>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">{r.reasonLabel}</h2>
                        <p className="mt-0.5 text-[13px] text-gray-500 dark:text-gray-400">
                            {r.order.customerName} · <a href={`mailto:${r.order.customerEmail}`} className="hover:text-blue-600">{r.order.customerEmail}</a> ·{' '}
                            <Link href={`/orders/${r.order.id}`} className="font-mono font-medium text-blue-600 hover:underline dark:text-blue-400">{r.order.orderNumber}</Link>
                        </p>
                    </div>
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${BADGE[r.status]}`}>{LABEL[r.status]}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded bg-gray-100 px-2 py-0.5 font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">Wants {r.resolution === 'EXCHANGE' ? 'an exchange' : 'a refund'}</span>
                    {r.ourFault
                        ? <span className="rounded bg-rose-50 px-2 py-0.5 font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">Our fault — refund delivery too</span>
                        : <span className="rounded bg-gray-100 px-2 py-0.5 font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">Change of mind — customer pays return delivery</span>}
                </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
                <table className="w-full text-left text-[13px]">
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/70">
                        {r.items.map((i) => (
                            <tr key={i.id}>
                                <td className="py-2 pr-3"><p className="font-medium text-gray-900 dark:text-white">{i.name}</p><p className="font-mono text-xs text-gray-400">{i.sku}</p></td>
                                <td className="py-2 pr-3 text-gray-500 tabular-nums">{i.quantity} × {formatMoney(i.unitPrice, r.order.currency)}</td>
                                <td className="py-2 text-right font-semibold text-gray-900 tabular-nums dark:text-white">{formatMoney(Number(i.unitPrice) * i.quantity, r.order.currency)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {r.details && (
                    <div>
                        <p className={labelCls}>Customer says</p>
                        <p className="whitespace-pre-line rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-gray-900/40 dark:text-gray-200">{r.details}</p>
                    </div>
                )}
                {r.photos.length > 0 && (
                    <div>
                        <p className={labelCls}>Photos</p>
                        <div className="flex flex-wrap gap-2">
                            {r.photos.map((p) => (
                                // eslint-disable-next-line @next/next/no-img-element
                                <a key={p} href={p} target="_blank" rel="noopener noreferrer"><img src={p} alt="Return photo" className="h-24 w-24 rounded-lg border border-gray-200 object-cover dark:border-gray-700" /></a>
                            ))}
                        </div>
                    </div>
                )}
                {r.instructions && r.status !== 'REQUESTED' && <p className="text-[13px] text-gray-600 dark:text-gray-300"><span className="font-medium">Instructions sent:</span> {r.instructions}</p>}
                {r.rejectReason && <p className="text-[13px] text-rose-600 dark:text-rose-400"><span className="font-medium">Declined:</span> {r.rejectReason}</p>}
                {r.refundAmount != null && <p className="text-[13px] text-emerald-700 dark:text-emerald-400"><span className="font-medium">Refunded:</span> {formatMoney(r.refundAmount, r.order.currency)}</p>}
                {r.adminNote && <p className="text-[13px] text-gray-500"><span className="font-medium">Internal note:</span> {r.adminNote}</p>}

                <ol className="space-y-1 text-xs text-gray-500">
                    {timeline.map(([l, t]) => <li key={l}><span className="font-medium text-gray-700 dark:text-gray-200">{l}</span> · {new Date(t).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</li>)}
                </ol>
            </div>

            {canAct && (
                <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 px-5 py-3.5 dark:border-gray-700/70">
                    {(r.status === 'REQUESTED' || r.status === 'APPROVED') && <Btn onClick={() => setDialog('reject')}><XMarkIcon className="h-4 w-4" /> Decline</Btn>}
                    {r.status === 'REQUESTED' && <Btn tone="primary" onClick={() => setDialog('approve')}><CheckIcon className="h-4 w-4" /> Approve return</Btn>}
                    {r.status === 'APPROVED' && <Btn tone="primary" onClick={() => setDialog('receive')}><InboxArrowDownIcon className="h-4 w-4" /> Mark parts received</Btn>}
                    {r.status === 'RECEIVED' && <Btn tone="primary" onClick={() => setDialog('refund')}><BanknotesIcon className="h-4 w-4" /> Record refund</Btn>}
                </div>
            )}

            {dialog && <ActionDialog r={r} kind={dialog} onClose={() => setDialog(null)} />}
        </div>
    );
}

function ActionDialog({ r, kind, onClose }: { r: AdminReturn; kind: 'approve' | 'reject' | 'receive' | 'refund'; onClose: () => void }) {
    const act = useReturnAction();
    const [text, setText] = useState(
        kind === 'approve'
            ? `Please bring the part(s) in the original packaging to our Industrial Area counter (Mon–Sat, 8am–6pm), or reply to this email to arrange collection. Quote ${r.rmaNumber}.`
            : '',
    );
    // damaged / faulty parts usually can't go back on the shelf
    const [restock, setRestock] = useState(!['DAMAGED', 'FAULTY'].includes(r.reason));
    const [amount, setAmount] = useState(String(suggested(r)));

    const cfg = {
        approve: { title: 'Approve return', verb: 'Approve & email customer', label: 'Instructions for the customer', required: false, tone: 'primary' as const },
        reject: { title: 'Decline return', verb: 'Decline & email customer', label: 'Reason (sent to the customer)', required: true, tone: 'danger' as const },
        receive: { title: 'Parts received', verb: 'Mark received', label: 'Internal note (condition, etc.)', required: false, tone: 'primary' as const },
        refund: { title: 'Record refund', verb: 'Record refund & email customer', label: 'Internal note (e.g. M-Pesa reference)', required: false, tone: 'primary' as const },
    }[kind];

    const submit = () => {
        const payload =
            kind === 'approve' ? { kind, id: r.id, instructions: text } as const
                : kind === 'reject' ? { kind, id: r.id, reason: text } as const
                    : kind === 'receive' ? { kind, id: r.id, restock, note: text || undefined } as const
                        : { kind, id: r.id, amount: Number(amount), note: text || undefined } as const;
        act.mutate(payload, {
            onSuccess: () => { toast.success(`${r.rmaNumber}: ${cfg.title.toLowerCase()} ✓`); onClose(); },
            onError: (e) => toast.error(errMsg(e, 'Could not update the return.')),
        });
    };

    return (
        <Modal open onClose={onClose} title={`${cfg.title} · ${r.rmaNumber}`}
            footer={<><Btn onClick={onClose}>Back</Btn><Btn tone={cfg.tone} onClick={submit} disabled={act.isPending || (cfg.required && !text.trim()) || (kind === 'refund' && !(Number(amount) > 0))}>{act.isPending ? 'Saving…' : cfg.verb}</Btn></>}>
            {kind === 'receive' && (
                <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700">
                    <input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600" />
                    <span>
                        <span className="font-medium text-gray-900 dark:text-white">Put back into stock</span>
                        <span className="block text-xs text-gray-500">Only if the part is unused and resaleable. Adds {r.items.reduce((n, i) => n + i.quantity, 0)} unit(s) back.</span>
                    </span>
                </label>
            )}
            {kind === 'refund' && (
                <div>
                    <label className={labelCls} htmlFor="rf-amount">Refund amount ({r.order.currency})</label>
                    <input id="rf-amount" type="number" min={0} step="0.01" className={fieldCls} value={amount} onChange={(e) => setAmount(e.target.value)} />
                    <p className="mt-1 text-xs text-gray-500">
                        Items {formatMoney(itemsValue(r), r.order.currency)}{r.ourFault ? ` + delivery ${formatMoney(r.order.shippingAmount, r.order.currency)} (our fault)` : ''}.
                        Send it via {METHOD[r.order.paymentMethod ?? ''] ?? 'the original payment method'} first — this records it.
                    </p>
                </div>
            )}
            <div>
                <label className={labelCls} htmlFor="rt-text">{cfg.label}{cfg.required && <span className="text-rose-500"> *</span>}</label>
                <textarea id="rt-text" rows={3} className={fieldCls} value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} autoFocus={kind === 'reject'} />
            </div>
        </Modal>
    );
}
