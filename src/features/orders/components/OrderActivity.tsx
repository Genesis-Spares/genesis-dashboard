'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
    ArrowPathIcon,
    BanknotesIcon,
    CheckCircleIcon,
    ClockIcon,
    CubeIcon,
    EyeSlashIcon,
    LockClosedIcon,
    MapPinIcon,
    PencilSquareIcon,
    TruckIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';
import { useAddTrackingEvent } from '../hooks/useOrders';
import { OrderStatusHistoryEntry } from '@/types/order.types';
import { Btn, errMsg, fieldCls } from './OrderDialogs';

const statusLabel = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

function iconFor(e: OrderStatusHistoryEntry) {
    if (e.type === 'PAYMENT') return { Icon: BanknotesIcon, cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' };
    if (e.type === 'TRACKING') return { Icon: MapPinIcon, cls: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400' };
    if (e.type === 'UPDATE') return { Icon: PencilSquareIcon, cls: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300' };
    switch (e.status) {
        case 'DELIVERED': return { Icon: CheckCircleIcon, cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' };
        case 'SHIPPED': return { Icon: TruckIcon, cls: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' };
        case 'PROCESSING': return { Icon: CubeIcon, cls: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' };
        case 'CANCELLED': return { Icon: XCircleIcon, cls: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' };
        case 'REFUNDED': return { Icon: ArrowPathIcon, cls: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' };
        default: return { Icon: ClockIcon, cls: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' };
    }
}

const when = (iso: string) =>
    new Date(iso).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const who = (actor?: string) => (!actor ? null : actor === 'customer' ? 'Customer' : actor === 'system' ? 'System' : actor.split('@')[0]);

type Filter = 'all' | 'customer' | 'internal';

export function OrderActivity({ orderId, history, isLoading, canUpdate, closed }: {
    orderId: string;
    history: OrderStatusHistoryEntry[];
    isLoading?: boolean;
    canUpdate: boolean;
    /** cancelled / refunded — updates are internal-only */
    closed: boolean;
}) {
    const [filter, setFilter] = useState<Filter>('all');
    const shown = history.filter((h) => filter === 'all' || (filter === 'customer' ? h.isPublic !== false : h.isPublic === false));

    return (
        <section className="rounded-xl border border-gray-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] dark:border-gray-700/70 dark:bg-gray-800">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-700/70">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Tracking &amp; activity</h2>
                <div className="inline-flex rounded-lg bg-gray-100 p-0.5 text-xs font-medium dark:bg-gray-700/60">
                    {(['all', 'customer', 'internal'] as const).map((f) => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`rounded-md px-2.5 py-1 capitalize transition ${filter === f ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                            {f === 'customer' ? 'Customer sees' : f}
                        </button>
                    ))}
                </div>
            </div>

            {canUpdate && <Composer orderId={orderId} internalOnly={closed} />}

            <div className="px-5 py-4">
                {isLoading ? (
                    <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-gray-50 dark:bg-gray-700/40" />)}</div>
                ) : shown.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-400">Nothing here yet.</p>
                ) : (
                    <ol>
                        {shown.map((e, i) => {
                            const { Icon, cls } = iconFor(e);
                            const internal = e.isPublic === false;
                            const by = who(e.actor);
                            return (
                                <li key={e.id} className="relative flex gap-3 pb-5 last:pb-0">
                                    {i < shown.length - 1 && <span className="absolute left-4 top-9 h-[calc(100%-2.25rem)] w-px bg-gray-100 dark:bg-gray-700" />}
                                    <span className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cls}`}>
                                        <Icon className="h-4 w-4" />
                                    </span>
                                    <div className="min-w-0 flex-1 pt-0.5">
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                            <span className="text-[13px] font-semibold text-gray-900 dark:text-white">
                                                {e.type === 'STATUS' || !e.type ? statusLabel(e.status) : e.type === 'PAYMENT' ? 'Payment' : e.type === 'TRACKING' ? 'Tracking update' : 'Note'}
                                            </span>
                                            {internal && (
                                                <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                                                    <EyeSlashIcon className="h-3 w-3" /> Internal
                                                </span>
                                            )}
                                            <span className="ml-auto text-xs text-gray-400 tabular-nums">{when(e.createdAt)}</span>
                                        </div>
                                        {e.note && <p className="mt-0.5 text-[13px] text-gray-600 dark:text-gray-300">{e.note}</p>}
                                        <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-gray-400">
                                            {e.location && <span className="inline-flex items-center gap-1"><MapPinIcon className="h-3.5 w-3.5" />{e.location}</span>}
                                            {by && <span>by {by}</span>}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                )}
            </div>
        </section>
    );
}

function Composer({ orderId, internalOnly }: { orderId: string; internalOnly: boolean }) {
    const add = useAddTrackingEvent(orderId);
    const [note, setNote] = useState('');
    const [location, setLocation] = useState('');
    const [isPublic, setIsPublic] = useState(!internalOnly);
    const publicUpdate = isPublic && !internalOnly;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!note.trim()) return;
        add.mutate(
            { note: note.trim(), location: location.trim() || undefined, isPublic: publicUpdate },
            {
                onSuccess: () => { setNote(''); setLocation(''); toast.success(publicUpdate ? 'Update posted to customer tracker' : 'Internal note added'); },
                onError: (err) => toast.error(errMsg(err, 'Could not post the update.')),
            },
        );
    };

    return (
        <form onSubmit={submit} className="border-b border-gray-100 bg-gray-50/50 px-5 py-4 dark:border-gray-700/70 dark:bg-gray-900/20">
            <textarea rows={2} className={fieldCls} value={note} onChange={(e) => setNote(e.target.value)}
                placeholder={publicUpdate ? 'Post a tracking update, e.g. "Arrived at Nakuru depot"' : 'Add an internal note for the team'} />
            <div className="mt-2 flex flex-wrap items-center gap-2">
                <div className="relative min-w-[180px] flex-1">
                    <MapPinIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input className={`${fieldCls} pl-8`} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location (optional)" />
                </div>
                {!internalOnly && (
                    <button type="button" onClick={() => setIsPublic((v) => !v)}
                        className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition ${isPublic
                            ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300'
                            : 'border-gray-200 bg-white text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}
                        title="Toggle whether the customer sees this update">
                        {isPublic ? <><MapPinIcon className="h-3.5 w-3.5" /> Customer-visible</> : <><LockClosedIcon className="h-3.5 w-3.5" /> Internal only</>}
                    </button>
                )}
                <Btn tone="primary" type="submit" disabled={!note.trim() || add.isPending}>{add.isPending ? 'Posting…' : 'Post'}</Btn>
            </div>
        </form>
    );
}
