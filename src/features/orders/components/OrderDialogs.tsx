'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useUpdateOrderStatus, useUpdatePaymentStatus, useUpdateTracking } from '../hooks/useOrders';
import { Order, OrderStatus, PaymentStatus } from '@/types/order.types';
import { formatMoney } from './OrderTable';

// ─── shared bits ────────────────────────────────────────────────

export const fieldCls =
    'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100';
export const labelCls = 'mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300';

export const CARRIERS = ['Genesis Rider', 'G4S', 'Wells Fargo', 'Fargo Courier', 'Sendy', 'Posta Kenya'];

export const errMsg = (e: unknown, fallback: string) => {
    const m = (e as { message?: string | string[] })?.message;
    return Array.isArray(m) ? m.join(', ') : m || fallback;
};

/** Per-target copy for the status dialog and the primary action button. */
export const STATUS_ACTION: Record<OrderStatus, { verb: string; title: string; hint: string; tone: 'primary' | 'danger' }> = {
    PENDING: { verb: 'Reopen', title: 'Reopen order', hint: '', tone: 'primary' },
    CONFIRMED: { verb: 'Confirm order', title: 'Confirm order', hint: 'Stock checked and the order is accepted.', tone: 'primary' },
    PROCESSING: { verb: 'Start processing', title: 'Start processing', hint: 'Parts are being picked, checked and packed.', tone: 'primary' },
    SHIPPED: { verb: 'Mark as shipped', title: 'Dispatch order', hint: 'Handed to a rider or courier. The customer sees the courier and tracking number.', tone: 'primary' },
    DELIVERED: { verb: 'Mark as delivered', title: 'Confirm delivery', hint: 'The customer has received the parts.', tone: 'primary' },
    CANCELLED: { verb: 'Cancel order', title: 'Cancel order', hint: "Can't be undone. Paid orders can be refunded afterwards.", tone: 'danger' },
    REFUNDED: { verb: 'Refund', title: 'Refund order', hint: 'Marks the order and payment as refunded. Send the money through your payment provider first.', tone: 'danger' },
};

// local date input value (YYYY-MM-DD) → ISO at 18:00 local, the usual end-of-day delivery window
const dateToIso = (d: string) => (d ? new Date(`${d}T18:00:00`).toISOString() : undefined);
const isoToDate = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const todayInput = () => isoToDate(new Date().toISOString());

export function Modal({ open, onClose, title, subtitle, children, footer }: {
    open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode; footer: React.ReactNode;
}) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={onClose}>
            <div role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}
                className="w-full max-w-lg rounded-t-2xl bg-white text-left shadow-xl dark:bg-gray-800 sm:rounded-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4 dark:border-gray-700">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
                        {subtitle && <p className="mt-0.5 text-[13px] text-gray-500 dark:text-gray-400">{subtitle}</p>}
                    </div>
                    <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700">
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>
                <div className="max-h-[65vh] space-y-4 overflow-y-auto px-6 py-5">{children}</div>
                <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50/60 px-6 py-3.5 dark:border-gray-700 dark:bg-gray-900/30 sm:rounded-b-2xl">{footer}</div>
            </div>
        </div>
    );
}

export function Btn({ tone = 'secondary', className = '', ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'primary' | 'secondary' | 'danger' }) {
    const tones = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
        danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
        secondary: 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700',
    };
    return <button {...p} className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone]} ${className}`} />;
}

function Visibility({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
    return (
        <div>
            <span className={labelCls}>Show on customer&apos;s tracker</span>
            <div className="inline-flex rounded-lg bg-gray-100 p-0.5 text-xs font-medium dark:bg-gray-700/60">
                {[{ v: true, l: 'Customer-visible' }, { v: false, l: 'Internal only' }].map((o) => (
                    <button key={String(o.v)} type="button" onClick={() => onChange(o.v)}
                        className={`rounded-md px-3 py-1.5 transition ${value === o.v ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                        {o.l}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ─── status change ──────────────────────────────────────────────

export function StatusDialog({ order, target, onClose }: { order: Order; target: OrderStatus | null; onClose: () => void }) {
    // keyed so every open starts with a fresh form
    return target ? <StatusDialogBody key={target} order={order} target={target} onClose={onClose} /> : null;
}

function StatusDialogBody({ order, target, onClose }: { order: Order; target: OrderStatus; onClose: () => void }) {
    const update = useUpdateOrderStatus(order.id);
    const [note, setNote] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [location, setLocation] = useState('');
    const [carrier, setCarrier] = useState(order.trackingCarrier ?? '');
    const [tracking, setTracking] = useState(order.trackingNumber ?? '');
    const [eta, setEta] = useState(isoToDate(order.estimatedDeliveryAt));
    const [collected, setCollected] = useState(true);

    const a = STATUS_ACTION[target];
    const needsReason = target === 'CANCELLED' || target === 'REFUNDED';
    const codUnpaid = target === 'DELIVERED' && order.paymentStatus === 'PENDING';
    const invalid = (target === 'SHIPPED' && !carrier.trim()) || (needsReason && !note.trim());

    const submit = () => {
        update.mutate(
            {
                status: target,
                note: note.trim() || undefined,
                isPublic,
                location: location.trim() || undefined,
                ...(target === 'SHIPPED' ? { trackingCarrier: carrier.trim(), trackingNumber: tracking.trim() || undefined, estimatedDeliveryAt: dateToIso(eta) } : {}),
                ...(codUnpaid ? { paymentCollected: collected } : {}),
            },
            {
                onSuccess: () => { toast.success(`${order.orderNumber}: ${a.verb.toLowerCase()} ✓`); onClose(); },
                onError: (e) => toast.error(errMsg(e, 'Could not update the order.')),
            },
        );
    };

    return (
        <Modal open onClose={onClose} title={`${a.title} · ${order.orderNumber}`} subtitle={a.hint}
            footer={<>
                <Btn onClick={onClose}>Back</Btn>
                <Btn tone={a.tone} onClick={submit} disabled={invalid || update.isPending}>{update.isPending ? 'Saving…' : a.verb}</Btn>
            </>}>
            {target === 'SHIPPED' && (
                <>
                    <div>
                        <label className={labelCls} htmlFor="carrier">Courier / rider <span className="text-rose-500">*</span></label>
                        <input id="carrier" list="carriers" className={fieldCls} value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="e.g. Genesis Rider or G4S" autoFocus />
                        <datalist id="carriers">{CARRIERS.map((c) => <option key={c} value={c} />)}</datalist>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className={labelCls} htmlFor="trk">Tracking / waybill no.</label>
                            <input id="trk" className={fieldCls} value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Optional" />
                        </div>
                        <div>
                            <label className={labelCls} htmlFor="eta">Estimated delivery</label>
                            <input id="eta" type="date" min={todayInput()} className={fieldCls} value={eta} onChange={(e) => setEta(e.target.value)} />
                        </div>
                    </div>
                </>
            )}

            {codUnpaid && (
                <label className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-500/30 dark:bg-amber-500/10">
                    <input type="checkbox" checked={collected} onChange={(e) => setCollected(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600" />
                    <span>
                        <span className="font-medium text-gray-900 dark:text-white">Payment of {formatMoney(order.total, order.currency)} collected</span>
                        <span className="block text-xs text-gray-600 dark:text-gray-300">Pay-on-delivery order. Ticking this marks the payment as paid.</span>
                    </span>
                </label>
            )}

            {target === 'REFUNDED' && (
                <div className="flex gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-[13px] text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                    <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
                    Refund {formatMoney(order.total, order.currency)} to the customer via {order.paymentMethod ?? 'the original method'} first — this only records it.
                </div>
            )}

            <div>
                <label className={labelCls} htmlFor="note">
                    {needsReason ? <>Reason <span className="text-rose-500">*</span></> : 'Message'}
                </label>
                <textarea id="note" rows={2} className={fieldCls} value={note} onChange={(e) => setNote(e.target.value)}
                    placeholder={needsReason ? 'e.g. Out of stock at supplier' : 'Optional. Leave blank for the standard customer message.'} />
            </div>

            {target !== 'CANCELLED' && target !== 'REFUNDED' && (
                <div>
                    <label className={labelCls} htmlFor="loc">Location</label>
                    <input id="loc" className={fieldCls} value={location} onChange={(e) => setLocation(e.target.value)}
                        placeholder={target === 'SHIPPED' ? 'e.g. Industrial Area dispatch' : 'Optional'} />
                </div>
            )}

            <Visibility value={isPublic} onChange={setIsPublic} />
        </Modal>
    );
}

// ─── dispatch details (edit after shipping) ─────────────────────

export function TrackingDialog({ order, open, onClose }: { order: Order; open: boolean; onClose: () => void }) {
    return open ? <TrackingDialogBody order={order} onClose={onClose} /> : null;
}

function TrackingDialogBody({ order, onClose }: { order: Order; onClose: () => void }) {
    const update = useUpdateTracking(order.id);
    const [carrier, setCarrier] = useState(order.trackingCarrier ?? '');
    const [tracking, setTracking] = useState(order.trackingNumber ?? '');
    const [eta, setEta] = useState(isoToDate(order.estimatedDeliveryAt));

    const changed =
        carrier.trim() !== (order.trackingCarrier ?? '') ||
        tracking.trim() !== (order.trackingNumber ?? '') ||
        eta !== isoToDate(order.estimatedDeliveryAt);

    const submit = () =>
        update.mutate(
            {
                trackingCarrier: carrier.trim() || undefined,
                trackingNumber: tracking.trim() || undefined,
                estimatedDeliveryAt: eta !== isoToDate(order.estimatedDeliveryAt) ? dateToIso(eta) : undefined,
            },
            {
                onSuccess: () => { toast.success('Dispatch details updated'); onClose(); },
                onError: (e) => toast.error(errMsg(e, 'Could not update dispatch details.')),
            },
        );

    return (
        <Modal open onClose={onClose} title="Dispatch details" subtitle="Shown to the customer on their order tracker."
            footer={<><Btn onClick={onClose}>Back</Btn><Btn tone="primary" onClick={submit} disabled={!changed || update.isPending}>{update.isPending ? 'Saving…' : 'Save'}</Btn></>}>
            <div>
                <label className={labelCls} htmlFor="t-carrier">Courier / rider</label>
                <input id="t-carrier" list="carriers2" className={fieldCls} value={carrier} onChange={(e) => setCarrier(e.target.value)} />
                <datalist id="carriers2">{CARRIERS.map((c) => <option key={c} value={c} />)}</datalist>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label className={labelCls} htmlFor="t-num">Tracking / waybill no.</label>
                    <input id="t-num" className={fieldCls} value={tracking} onChange={(e) => setTracking(e.target.value)} />
                </div>
                <div>
                    <label className={labelCls} htmlFor="t-eta">Estimated delivery</label>
                    <input id="t-eta" type="date" className={fieldCls} value={eta} onChange={(e) => setEta(e.target.value)} />
                </div>
            </div>
        </Modal>
    );
}

// ─── payment status (manual reconciliation) ─────────────────────

const PAYMENT_OPTIONS: { value: PaymentStatus; label: string }[] = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'PAID', label: 'Paid' },
    { value: 'FAILED', label: 'Failed' },
    { value: 'PARTIALLY_REFUNDED', label: 'Partially refunded' },
    { value: 'REFUNDED', label: 'Refunded' },
];

export function PaymentDialog({ order, open, onClose }: { order: Order; open: boolean; onClose: () => void }) {
    return open ? <PaymentDialogBody order={order} onClose={onClose} /> : null;
}

function PaymentDialogBody({ order, onClose }: { order: Order; onClose: () => void }) {
    const update = useUpdatePaymentStatus(order.id);
    const [status, setStatus] = useState<PaymentStatus>(order.paymentStatus);
    const [note, setNote] = useState('');

    const submit = () =>
        update.mutate(
            { paymentStatus: status, note: note.trim() || undefined },
            {
                onSuccess: () => { toast.success('Payment status updated'); onClose(); },
                onError: (e) => toast.error(errMsg(e, 'Could not update payment.')),
            },
        );

    return (
        <Modal open onClose={onClose} title="Update payment" subtitle="For reconciling with M-Pesa / bank statements. Logged as an internal entry."
            footer={<><Btn onClick={onClose}>Back</Btn><Btn tone="primary" onClick={submit} disabled={status === order.paymentStatus || !note.trim() || update.isPending}>{update.isPending ? 'Saving…' : 'Save'}</Btn></>}>
            <div>
                <label className={labelCls} htmlFor="p-status">Payment status</label>
                <select id="p-status" className={fieldCls} value={status} onChange={(e) => setStatus(e.target.value as PaymentStatus)}>
                    {PAYMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            </div>
            <div>
                <label className={labelCls} htmlFor="p-note">Reference / reason <span className="text-rose-500">*</span></label>
                <input id="p-note" className={fieldCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. M-Pesa ref QJK4XY12AB" />
            </div>
        </Modal>
    );
}
