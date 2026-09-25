'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
    ArrowLeftIcon,
    CheckIcon,
    EllipsisHorizontalIcon,
    MapPinIcon,
    PhoneIcon,
    EnvelopeIcon,
    TruckIcon,
    PencilSquareIcon,
} from '@heroicons/react/24/outline';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { useCustomerByUserId } from '@/features/customers/hooks/useCustomers';
import {
    useOrderHistory,
    useOrderNotes,
    useAddOrderNote,
    useUpdateOrderNote,
    useDeleteOrderNote,
} from '@/features/orders/hooks/useOrders';
import { Order, OrderStatus, OrderStatusHistoryEntry } from '@/types/order.types';
import { formatMoney } from './OrderTable';
import { NotesTab } from './tabs/NotesTab';
import { OrderActivity } from './OrderActivity';
import { Btn, PaymentDialog, STATUS_ACTION, StatusDialog, TrackingDialog } from './OrderDialogs';

interface OrderViewProps {
    order: Order;
    onBack: () => void;
}

const STEPS: { status: OrderStatus; label: string }[] = [
    { status: 'PENDING', label: 'Placed' },
    { status: 'CONFIRMED', label: 'Confirmed' },
    { status: 'PROCESSING', label: 'Processing' },
    { status: 'SHIPPED', label: 'Shipped' },
    { status: 'DELIVERED', label: 'Delivered' },
];

const STATUS_BADGE: Record<OrderStatus, string> = {
    PENDING: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400',
    CONFIRMED: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400',
    PROCESSING: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-400',
    SHIPPED: 'bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-400',
    DELIVERED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400',
    CANCELLED: 'bg-gray-100 text-gray-600 ring-gray-500/20 dark:bg-gray-700 dark:text-gray-300',
    REFUNDED: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400',
};

const PAYMENT_BADGE: Record<string, string> = {
    PAID: 'text-emerald-700 dark:text-emerald-400',
    PENDING: 'text-amber-700 dark:text-amber-400',
    FAILED: 'text-rose-700 dark:text-rose-400',
};

const PAYMENT_METHOD: Record<string, string> = { mpesa: 'M-Pesa', card: 'Card', cod: 'Pay on delivery' };

const title = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ');
const dt = (iso?: string, time = true) =>
    iso ? new Date(iso).toLocaleString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', ...(time ? { hour: '2-digit', minute: '2-digit' } : {}) }) : '—';

const card = 'rounded-xl border border-gray-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] dark:border-gray-700/70 dark:bg-gray-800';

export function OrderView({ order, onBack }: OrderViewProps) {
    const { can } = usePermissions();
    const canUpdate = can({ permission: 'order:update' });
    // order.customerId is the shopper's auth user id; the customer page is keyed by the customer record id
    const { data: customerRecord } = useCustomerByUserId(order.customerId, { enabled: can({ permission: 'customer:read' }) });

    const { data: history, isLoading: historyLoading } = useOrderHistory(order.id);
    const { data: notes } = useOrderNotes(order.id);
    const addNote = useAddOrderNote(order.id);
    const updateNote = useUpdateOrderNote(order.id);
    const deleteNote = useDeleteOrderNote(order.id);

    const [target, setTarget] = useState<OrderStatus | null>(null);
    const [trackingOpen, setTrackingOpen] = useState(false);
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const close = (e: MouseEvent) => menuRef.current && !menuRef.current.contains(e.target as Node) && setMenuOpen(false);
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    const allowed = order.allowedTransitions ?? [];
    const forward = allowed.find((s) => s !== 'CANCELLED' && s !== 'REFUNDED');
    const closed = order.status === 'CANCELLED' || order.status === 'REFUNDED';
    const shipped = ['SHIPPED', 'DELIVERED'].includes(order.status);

    const menu: { label: string; onClick: () => void; danger?: boolean }[] = [];
    if (shipped || order.trackingCarrier) menu.push({ label: 'Edit dispatch details', onClick: () => setTrackingOpen(true) });
    menu.push({ label: 'Update payment status', onClick: () => setPaymentOpen(true) });
    if (allowed.includes('CANCELLED')) menu.push({ label: 'Cancel order', onClick: () => setTarget('CANCELLED'), danger: true });
    if (allowed.includes('REFUNDED')) menu.push({ label: 'Refund order', onClick: () => setTarget('REFUNDED'), danger: true });

    return (
        <div className="space-y-5 pb-8">
            {/* ── header ─────────────────────────────── */}
            <div>
                <button onClick={onBack} className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                    <ArrowLeftIcon className="h-4 w-4" /> Orders
                </button>
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="font-mono text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{order.orderNumber}</h1>
                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_BADGE[order.status]}`}>{title(order.status)}</span>
                            <span className={`text-xs font-semibold ${PAYMENT_BADGE[order.paymentStatus] ?? 'text-gray-500'}`}>
                                · {order.paymentStatus === 'PENDING' ? 'Unpaid' : title(order.paymentStatus)}
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Placed {dt(order.createdAt)} · {order.customerName} · <span className="font-medium text-gray-700 tabular-nums dark:text-gray-200">{formatMoney(order.total, order.currency)}</span>
                        </p>
                    </div>

                    {canUpdate && (
                        <div className="flex items-center gap-2">
                            {forward && (
                                <Btn tone="primary" onClick={() => setTarget(forward)}>
                                    {forward === 'SHIPPED' && <TruckIcon className="h-4 w-4" />}
                                    {forward === 'DELIVERED' && <CheckIcon className="h-4 w-4" />}
                                    {STATUS_ACTION[forward].verb}
                                </Btn>
                            )}
                            <div className="relative" ref={menuRef}>
                                <Btn onClick={() => setMenuOpen((v) => !v)} aria-label="More actions" aria-expanded={menuOpen} className="px-2.5">
                                    <EllipsisHorizontalIcon className="h-5 w-5" />
                                </Btn>
                                {menuOpen && (
                                    <div className="absolute right-0 z-20 mt-1.5 w-52 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                                        {menu.map((m) => (
                                            <button key={m.label} onClick={() => { setMenuOpen(false); m.onClick(); }}
                                                className={`block w-full px-3.5 py-2 text-left text-sm transition ${m.danger
                                                    ? 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10'
                                                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700'}`}>
                                                {m.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── progress ───────────────────────────── */}
            <Progress order={order} history={history ?? []} />

            {/* ── body ───────────────────────────────── */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                <div className="min-w-0 space-y-5 lg:col-span-2">
                    <OrderActivity orderId={order.id} history={history ?? []} isLoading={historyLoading} canUpdate={canUpdate} closed={closed} />

                    <section className={`${card} overflow-hidden`}>
                        <div className="flex items-center justify-between px-5 py-4">
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Items</h2>
                            <span className="text-xs text-gray-500">{order.items?.length ?? 0} line{order.items?.length === 1 ? '' : 's'}</span>
                        </div>
                        <ul className="divide-y divide-gray-100 border-t border-gray-100 dark:divide-gray-700/70 dark:border-gray-700/70">
                            {(order.items ?? []).map((i) => (
                                <li key={i.id} className="flex items-center gap-3 px-5 py-3">
                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                        {i.image ? <img src={i.image} alt="" className="h-full w-full object-contain p-1" /> : <span className="text-xs text-gray-400">—</span>}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <Link href={`/products/${i.productId}`} className="block truncate text-[13px] font-medium text-gray-900 hover:text-blue-600 dark:text-white">{i.name}</Link>
                                        <p className="font-mono text-xs text-gray-400">{i.sku}</p>
                                    </div>
                                    <span className="text-xs text-gray-500 tabular-nums">{i.quantity} × {formatMoney(i.unitPrice, order.currency)}</span>
                                    <span className="w-28 text-right text-[13px] font-semibold text-gray-900 tabular-nums dark:text-white">{formatMoney(i.subtotal, order.currency)}</span>
                                </li>
                            ))}
                        </ul>
                        <dl className="space-y-1.5 border-t border-gray-100 bg-gray-50/60 px-5 py-4 text-[13px] dark:border-gray-700/70 dark:bg-gray-900/20">
                            <Row label="Subtotal" value={formatMoney(order.subtotal, order.currency)} />
                            <Row label="Delivery" value={Number(order.shippingAmount) ? formatMoney(order.shippingAmount, order.currency) : 'Free'} />
                            {Number(order.taxAmount) > 0 && <Row label={`VAT${order.taxRate != null ? ` (${Number(order.taxRate)}%)` : ''}`} value={formatMoney(order.taxAmount, order.currency)} />}
                            {Number(order.discountAmount) > 0 && <Row label={`Discount${order.couponCode ? ` (${order.couponCode})` : ''}`} value={`−${formatMoney(order.discountAmount, order.currency)}`} />}
                            <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-semibold text-gray-900 dark:border-gray-700 dark:text-white">
                                <dt>Total</dt><dd className="tabular-nums">{formatMoney(order.total, order.currency)}</dd>
                            </div>
                        </dl>
                    </section>

                    <NotesTab
                        notes={notes ?? []}
                        canManage={canUpdate}
                        onAddNote={addNote.mutate}
                        onUpdateNote={updateNote.mutate}
                        onDeleteNote={deleteNote.mutate}
                        isAdding={addNote.isPending}
                        isUpdating={updateNote.isPending}
                        isDeleting={deleteNote.isPending}
                    />
                </div>

                {/* sidebar */}
                <div className="space-y-5">
                    <section className={card}>
                        <CardHead title="Delivery" action={canUpdate && (shipped || order.trackingCarrier) ? { label: 'Edit', onClick: () => setTrackingOpen(true) } : undefined} />
                        <div className="space-y-3 px-5 pb-5 text-[13px]">
                            {order.trackingCarrier ? (
                                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900/30">
                                    <p className="flex items-center gap-1.5 font-medium text-gray-900 dark:text-white"><TruckIcon className="h-4 w-4 text-gray-400" />{order.trackingCarrier}</p>
                                    {order.trackingNumber && <p className="mt-0.5 font-mono text-xs text-gray-500">{order.trackingNumber}</p>}
                                    {order.estimatedDeliveryAt && order.status !== 'DELIVERED' && (
                                        <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-300">ETA <span className="font-semibold">{dt(order.estimatedDeliveryAt, false)}</span></p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-gray-400">Not dispatched yet.</p>
                            )}
                            {order.deliveryZoneName && (
                                <p className="text-xs text-gray-500">Zone <span className="font-medium text-gray-900 dark:text-white">{order.deliveryZoneName}</span></p>
                            )}
                            <div className="text-gray-600 dark:text-gray-300">
                                <p className="font-medium text-gray-900 dark:text-white">{order.shippingAddress?.fullName}</p>
                                <p className="flex gap-1.5"><MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                                    <span>{order.shippingAddress?.line1}{order.shippingAddress?.line2 ? `, near ${order.shippingAddress.line2}` : ''}<br />{order.shippingAddress?.city}, {order.shippingAddress?.country}</span>
                                </p>
                            </div>
                            {order.customerNote && <p className="rounded-lg border border-dashed border-gray-200 px-3 py-2 text-xs text-gray-600 dark:border-gray-700 dark:text-gray-300">{order.customerNote}</p>}
                        </div>
                    </section>

                    <section className={card}>
                        <CardHead title="Payment" action={canUpdate ? { label: 'Update', onClick: () => setPaymentOpen(true) } : undefined} />
                        <dl className="space-y-2 px-5 pb-5 text-[13px]">
                            <Row label="Method" value={PAYMENT_METHOD[order.paymentMethod ?? ''] ?? order.paymentMethod ?? '—'} />
                            <Row label="Status" value={<span className={`font-semibold ${PAYMENT_BADGE[order.paymentStatus] ?? ''}`}>{order.paymentStatus === 'PENDING' ? 'Unpaid' : title(order.paymentStatus)}</span>} />
                            <Row label="Amount" value={formatMoney(order.total, order.currency)} />
                            {order.paymentMethod === 'mpesa' && order.status === 'PENDING' && order.paymentStatus !== 'PAID' && order.paymentDueAt && (
                                <Row label="Auto-cancels" value={dt(order.paymentDueAt)} />
                            )}
                        </dl>
                        {!!order.payments?.length && (
                            <div className="border-t border-gray-100 px-5 py-4 dark:border-gray-700/70">
                                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">M-Pesa attempts</p>
                                <ul className="space-y-2.5">
                                    {order.payments.map((p) => (
                                        <li key={p.id} className="text-[12.5px]">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className={`font-semibold ${p.status === 'SUCCESS' ? 'text-emerald-600' : p.status === 'FAILED' ? 'text-rose-600' : 'text-amber-600'}`}>
                                                    {p.status === 'SUCCESS' ? 'Paid' : p.status === 'FAILED' ? 'Failed' : 'Waiting for PIN'}
                                                </span>
                                                <span className="text-gray-400">{dt(p.createdAt)}</span>
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-300">
                                                {formatMoney(p.amount, order.currency)} from <span className="font-mono">{p.phone}</span>
                                                {p.receiptNumber && <> · <span className="font-mono font-semibold text-gray-900 dark:text-white">{p.receiptNumber}</span></>}
                                            </p>
                                            {p.status === 'FAILED' && p.resultDesc && <p className="text-gray-400">{p.resultDesc}</p>}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </section>

                    <section className={card}>
                        <CardHead title="Customer" action={customerRecord?.id ? { label: 'Profile', href: `/customers/${customerRecord.id}` } : undefined} />
                        <div className="space-y-1.5 px-5 pb-5 text-[13px] text-gray-600 dark:text-gray-300">
                            <p className="font-medium text-gray-900 dark:text-white">{order.customerName}</p>
                            <a href={`mailto:${order.customerEmail}`} className="flex items-center gap-1.5 hover:text-blue-600"><EnvelopeIcon className="h-4 w-4 text-gray-400" />{order.customerEmail}</a>
                            {order.customerPhone && <a href={`tel:${order.customerPhone}`} className="flex items-center gap-1.5 hover:text-blue-600"><PhoneIcon className="h-4 w-4 text-gray-400" />{order.customerPhone}</a>}
                        </div>
                    </section>

                    {closed && order.cancelReason && (
                        <section className={`${card} px-5 py-4 text-[13px]`}>
                            <p className="font-semibold text-gray-900 dark:text-white">Cancellation reason</p>
                            <p className="mt-1 text-gray-600 dark:text-gray-300">{order.cancelReason}</p>
                        </section>
                    )}
                </div>
            </div>

            <StatusDialog order={order} target={target} onClose={() => setTarget(null)} />
            <TrackingDialog order={order} open={trackingOpen} onClose={() => setTrackingOpen(false)} />
            <PaymentDialog order={order} open={paymentOpen} onClose={() => setPaymentOpen(false)} />
        </div>
    );
}

function Progress({ order, history }: { order: Order; history: OrderStatusHistoryEntry[] }) {
    // first time each status was reached (history is newest-first)
    const reachedAt = (s: OrderStatus) =>
        s === 'PENDING' ? order.createdAt : [...history].reverse().find((h) => (h.type ?? 'STATUS') === 'STATUS' && h.status === s)?.createdAt;
    const current = STEPS.findIndex((s) => s.status === order.status);
    const closed = order.status === 'CANCELLED' || order.status === 'REFUNDED';

    if (closed) {
        return (
            <div className={`${card} flex items-center gap-3 px-5 py-4 text-sm`}>
                <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_BADGE[order.status]}`}>{title(order.status)}</span>
                <span className="text-gray-600 dark:text-gray-300">
                    {order.status === 'CANCELLED' ? `Cancelled ${dt(order.cancelledAt)}` : 'Refund recorded'}
                    {order.cancelReason ? ` — ${order.cancelReason}` : ''}
                </span>
            </div>
        );
    }

    return (
        <div className={`${card} px-5 py-5`}>
            <ol className="grid grid-cols-5">
                {STEPS.map((s, i) => {
                    const done = i <= current;
                    const at = done ? reachedAt(s.status) : undefined;
                    return (
                        <li key={s.status} className="relative flex flex-col items-center text-center">
                            {i > 0 && <span className={`absolute right-1/2 top-3.5 h-0.5 w-full ${i <= current ? 'bg-blue-600 dark:bg-blue-400' : 'bg-gray-200 dark:bg-gray-700'}`} />}
                            <span className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${done
                                ? 'bg-blue-600 text-white dark:bg-blue-500'
                                : 'border-2 border-gray-200 bg-white text-gray-400 dark:border-gray-600 dark:bg-gray-800'} ${i === current ? 'ring-4 ring-blue-600/15' : ''}`}>
                                {done ? <CheckIcon className="h-4 w-4" strokeWidth={2.5} /> : i + 1}
                            </span>
                            <span className={`mt-2 text-xs font-semibold sm:text-[13px] ${done ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{s.label}</span>
                            <span className="hidden text-[11px] text-gray-400 tabular-nums sm:block">{at ? new Date(at).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ' '}</span>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

function CardHead({ title: t, action }: { title: string; action?: { label: string; onClick?: () => void; href?: string } }) {
    const cls = 'inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400';
    return (
        <div className="flex items-center justify-between px-5 pb-3 pt-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t}</h2>
            {action && (action.href
                ? <Link href={action.href} className={cls}>{action.label}</Link>
                : <button onClick={action.onClick} className={cls}><PencilSquareIcon className="h-3.5 w-3.5" />{action.label}</button>)}
        </div>
    );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex justify-between gap-4 text-gray-600 dark:text-gray-300">
            <dt>{label}</dt>
            <dd className="text-right font-medium text-gray-900 tabular-nums dark:text-white">{value}</dd>
        </div>
    );
}
