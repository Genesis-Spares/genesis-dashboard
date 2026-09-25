// src/features/messages/components/MessagesPanel.tsx
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
    ChatBubbleLeftRightIcon,
    CheckCircleIcon,
    EnvelopeIcon,
    LinkIcon,
    LockClosedIcon,
    MagnifyingGlassIcon,
    PaperAirplaneIcon,
    PhoneIcon,
    ShoppingBagIcon,
    UserCircleIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/lib/stores/authStore';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { useMessages, useMessage, useMessageStats, useReplyToMessage, useUpdateMessage } from '../hooks/useMessages';
import { useUsers } from '@/features/users/hooks/useUsers';
import { useCustomerByUserId } from '@/features/customers/hooks/useCustomers';
import { ordersApi } from '@/features/orders/api/orders.api';
import { MessagePriority, MessageStatus } from '@/types/message.types';

const STATUS_TABS: { id: MessageStatus | 'ALL'; label: string }[] = [
    { id: 'OPEN', label: 'Open' },
    { id: 'IN_PROGRESS', label: 'In progress' },
    { id: 'RESOLVED', label: 'Resolved' },
    { id: 'CLOSED', label: 'Closed' },
    { id: 'ALL', label: 'All' },
];

const STATUS_BADGE: Record<MessageStatus, string> = {
    OPEN: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400',
    IN_PROGRESS: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400',
    RESOLVED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400',
    CLOSED: 'bg-gray-100 text-gray-600 ring-gray-500/20 dark:bg-gray-700 dark:text-gray-300',
};

const PRIORITY_DOT: Record<MessagePriority, string> = {
    LOW: 'bg-gray-300',
    NORMAL: 'bg-blue-400',
    HIGH: 'bg-orange-500',
    URGENT: 'bg-rose-600',
};

const label = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace('_', ' ');
const ref = (id: string) => `MSG-${id.slice(0, 8).toUpperCase()}`;
const shortName = (email?: string | null) => {
    const local = (email || '').split('@')[0].split(/[._-]/)[0];
    return local ? local.charAt(0).toUpperCase() + local.slice(1) : 'Staff';
};
const initials = (s?: string | null) => (s || '?').split(/[\s@._-]/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');

function timeAgo(iso: string) {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return days < 7 ? `${days}d ago` : new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
}

const errMsg = (e: unknown, fallback: string) => {
    const m = (e as { message?: string | string[] })?.message;
    return Array.isArray(m) ? m.join(', ') : m || fallback;
};

const card = 'rounded-xl border border-gray-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] dark:border-gray-700/70 dark:bg-gray-800';

export function MessagesPanel() {
    const { user } = useAuthStore();
    const me = user?.id || user?.sub || '';
    const { can } = usePermissions();
    const canUpdate = can({ permission: 'message:update' });

    const [status, setStatus] = useState<MessageStatus | 'ALL'>('OPEN');
    const [assignee, setAssignee] = useState<'all' | 'me' | 'none'>('all');
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState<string>();

    const params = {
        status: status === 'ALL' ? undefined : status,
        assignedTo: assignee === 'me' ? me : assignee === 'none' ? 'none' : undefined,
        search: search.trim() || undefined,
        sortBy: 'createdAt' as const,
        sortOrder: 'desc' as const,
        limit: 30,
    };
    const { data: list, isLoading } = useMessages(params);
    const { data: stats } = useMessageStats();
    const messages = list?.data ?? [];
    const activeId = selectedId ?? messages[0]?.id; // an opened thread stays open when filters change

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr]">
            {/* ── inbox list ─────────────────────────── */}
            <section className={`${card} flex min-h-[560px] flex-col overflow-hidden`}>
                <div className="space-y-3 border-b border-gray-100 p-4 dark:border-gray-700/70">
                    <div className="relative">
                        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search name, email, order, text…"
                            className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        />
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {STATUS_TABS.map((t) => {
                            const n = t.id === 'ALL' ? stats?.total : stats?.byStatus?.[t.id];
                            return (
                                <button key={t.id} onClick={() => setStatus(t.id)}
                                    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${status === t.id
                                        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
                                    {t.label}
                                    {n !== undefined && <span className={`tabular-nums ${status === t.id ? 'opacity-70' : 'text-gray-400'}`}>{n}</span>}
                                </button>
                            );
                        })}
                    </div>
                    <div className="inline-flex rounded-lg bg-gray-100 p-0.5 text-xs font-medium dark:bg-gray-700/60">
                        {(['all', 'me', 'none'] as const).map((a) => (
                            <button key={a} onClick={() => setAssignee(a)}
                                className={`rounded-md px-2.5 py-1 transition ${assignee === a ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                {a === 'all' ? 'Everyone' : a === 'me' ? 'Mine' : 'Unassigned'}
                            </button>
                        ))}
                    </div>
                </div>

                <ul className="flex-1 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-700/70 lg:max-h-[640px]">
                    {isLoading && [0, 1, 2, 3].map((i) => <li key={i} className="p-4"><div className="h-12 animate-pulse rounded bg-gray-50 dark:bg-gray-700/40" /></li>)}
                    {!isLoading && messages.length === 0 && (
                        <li className="flex flex-col items-center gap-2 px-4 py-16 text-center text-sm text-gray-400">
                            <ChatBubbleLeftRightIcon className="h-7 w-7" /> No messages here.
                        </li>
                    )}
                    {messages.map((m) => (
                        <li key={m.id}>
                            <button onClick={() => setSelectedId(m.id)}
                                className={`w-full px-4 py-3 text-left transition ${activeId === m.id ? 'bg-blue-50/70 dark:bg-blue-500/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}>
                                <div className="flex items-center gap-2">
                                    <span className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[m.priority]}`} title={`${label(m.priority)} priority`} />
                                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-gray-900 dark:text-white">{m.customerName}</span>
                                    <span className="shrink-0 text-[11px] text-gray-400">{timeAgo(m.createdAt)}</span>
                                </div>
                                <p className="mt-0.5 truncate pl-4 text-[13px] text-gray-700 dark:text-gray-200">{m.subject}</p>
                                <p className="mt-0.5 line-clamp-1 pl-4 text-xs text-gray-400">{m.body}</p>
                                <div className="mt-1.5 flex items-center gap-2 pl-4">
                                    {status === 'ALL' && (
                                        <span className={`rounded px-1.5 py-0.5 text-[10.5px] font-semibold ring-1 ring-inset ${STATUS_BADGE[m.status]}`}>{label(m.status)}</span>
                                    )}
                                    {m.assignedTo ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400" title={m.assignedToName ?? ''}>
                                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[8px] font-bold text-gray-600 dark:bg-gray-600 dark:text-gray-200">{initials(m.assignedToName)}</span>
                                            {m.assignedTo === me ? 'You' : shortName(m.assignedToName)}
                                        </span>
                                    ) : (
                                        <span className="text-[11px] text-amber-600 dark:text-amber-400">Unassigned</span>
                                    )}
                                    {!!m._count?.replies && <span className="ml-auto text-[11px] text-gray-400">{m._count.replies} repl{m._count.replies === 1 ? 'y' : 'ies'}</span>}
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            </section>

            {/* ── thread ─────────────────────────────── */}
            <section className={`${card} min-h-[560px]`}>
                {activeId ? <Thread key={activeId} id={activeId} me={me} canUpdate={canUpdate} /> : (
                    <div className="flex h-full min-h-[560px] flex-col items-center justify-center gap-2 text-sm text-gray-400">
                        <ChatBubbleLeftRightIcon className="h-8 w-8" /> Select a message.
                    </div>
                )}
            </section>
        </div>
    );
}

function Thread({ id, me, canUpdate }: { id: string; me: string; canUpdate: boolean }) {
    const { can } = usePermissions();
    const { data: m, isLoading } = useMessage(id);
    const update = useUpdateMessage(id);
    const reply = useReplyToMessage(id);

    const canSeeStaff = can({ permission: 'user:read' });
    const { data: users } = useUsers({ limit: 100 }, { enabled: canUpdate && canSeeStaff });
    const staff = useMemo(
        () => (users?.data ?? []).filter((u) => u.isActive && u.roles?.some((r) => r.name !== 'customer')),
        [users],
    );

    const { data: customer } = useCustomerByUserId(m?.customerId ?? undefined, { enabled: Boolean(m?.customerId) && can({ permission: 'customer:read' }) });
    const canReadOrders = can({ permission: 'order:read' });
    const { data: order } = useQuery({
        queryKey: ['orders', 'by-number', m?.orderNumber],
        queryFn: () => ordersApi.getByNumber(m!.orderNumber!),
        enabled: Boolean(m?.orderNumber) && canReadOrders,
        retry: false,
    });

    const [mode, setMode] = useState<'reply' | 'note'>('reply');
    const [body, setBody] = useState('');
    const [linking, setLinking] = useState(false);
    const [orderInput, setOrderInput] = useState('');

    if (isLoading || !m) {
        return <div className="space-y-3 p-6">{[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-50 dark:bg-gray-700/40" />)}</div>;
    }

    const closed = m.status === 'RESOLVED' || m.status === 'CLOSED';

    const save = (input: Parameters<typeof update.mutate>[0], ok: string) =>
        update.mutate(input, { onSuccess: () => toast.success(ok), onError: (e) => toast.error(errMsg(e, 'Could not update the message.')) });

    const send = (andResolve: boolean) => {
        if (!body.trim()) return;
        const isInternal = mode === 'note';
        reply.mutate(
            { body: body.trim(), isInternal },
            {
                onSuccess: () => {
                    setBody('');
                    toast.success(isInternal ? 'Internal note added' : `Reply emailed to ${m.customerEmail}`);
                    if (andResolve) save({ status: 'RESOLVED' }, 'Marked resolved');
                },
                onError: (e) => toast.error(errMsg(e, 'Could not send.')),
            },
        );
    };

    const linkOrder = async () => {
        const n = orderInput.trim().toUpperCase();
        if (!n) return;
        try {
            const o = await ordersApi.getByNumber(n);
            save({ orderNumber: o.orderNumber, orderId: o.id }, `Linked to ${o.orderNumber}`);
            setLinking(false);
            setOrderInput('');
        } catch {
            toast.error(`No order ${n} found.`);
        }
    };

    return (
        <div className="flex h-full flex-col">
            {/* header */}
            <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-700/70">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="font-mono text-[11px] font-semibold text-gray-400">{ref(m.id)} · {new Date(m.createdAt).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        <h2 className="mt-0.5 text-base font-semibold text-gray-900 dark:text-white">{m.subject}</h2>
                    </div>
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_BADGE[m.status]}`}>{label(m.status)}</span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-gray-600 dark:text-gray-300">
                    <span className="inline-flex items-center gap-1.5 font-medium text-gray-900 dark:text-white">
                        <UserCircleIcon className="h-4 w-4 text-gray-400" />
                        {customer?.id ? <Link href={`/customers/${customer.id}`} className="hover:text-blue-600">{m.customerName}</Link> : m.customerName}
                        {!m.customerId && <span className="rounded bg-gray-100 px-1.5 text-[10.5px] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-300">Guest</span>}
                    </span>
                    <a href={`mailto:${m.customerEmail}`} className="inline-flex items-center gap-1.5 hover:text-blue-600"><EnvelopeIcon className="h-4 w-4 text-gray-400" />{m.customerEmail}</a>
                    {m.customerPhone && <a href={`tel:${m.customerPhone}`} className="inline-flex items-center gap-1.5 hover:text-blue-600"><PhoneIcon className="h-4 w-4 text-gray-400" />{m.customerPhone}</a>}
                    {m.orderNumber ? (
                        <span className="inline-flex items-center gap-1.5">
                            <ShoppingBagIcon className="h-4 w-4 text-gray-400" />
                            {order?.id ? <Link href={`/orders/${order.id}`} className="font-mono font-medium text-blue-600 hover:underline dark:text-blue-400">{m.orderNumber}</Link> : <span className="font-mono">{m.orderNumber}</span>}
                            {order && <span className="text-xs text-gray-400">· {label(order.status)}</span>}
                            {canUpdate && (
                                <button onClick={() => save({ orderNumber: null }, 'Order unlinked')} aria-label="Unlink order" className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"><XMarkIcon className="h-3.5 w-3.5" /></button>
                            )}
                        </span>
                    ) : canUpdate && canReadOrders && (
                        linking ? (
                            <span className="inline-flex items-center gap-1.5">
                                <input autoFocus value={orderInput} onChange={(e) => setOrderInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') linkOrder(); if (e.key === 'Escape') setLinking(false); }}
                                    placeholder="GNS-20260925-1234" className="h-7 w-44 rounded-md border border-gray-200 bg-white px-2 font-mono text-xs dark:border-gray-700 dark:bg-gray-900" />
                                <button onClick={linkOrder} className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">Link</button>
                                <button onClick={() => setLinking(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                            </span>
                        ) : (
                            <button onClick={() => setLinking(true)} className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"><LinkIcon className="h-3.5 w-3.5" /> Link an order</button>
                        )
                    )}
                </div>

                {canUpdate && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <select
                            value={m.assignedTo ?? ''}
                            onChange={(e) => {
                                const v = e.target.value || null;
                                const who = staff.find((u) => u.id === v);
                                save({ assignedTo: v, assignedToName: who?.email ?? null }, v ? `Assigned to ${v === me ? 'you' : shortName(who?.email)}` : 'Unassigned');
                            }}
                            className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                            aria-label="Assignee"
                        >
                            <option value="">Unassigned</option>
                            {me && <option value={me}>Me</option>}
                            {staff.filter((u) => u.id !== me).map((u) => <option key={u.id} value={u.id}>{[u.firstname, u.lastName].filter(Boolean).join(' ') || u.email}</option>)}
                            {m.assignedTo && m.assignedTo !== me && !staff.some((u) => u.id === m.assignedTo) && <option value={m.assignedTo}>{m.assignedToName ?? 'Staff member'}</option>}
                        </select>
                        <select
                            value={m.priority}
                            onChange={(e) => save({ priority: e.target.value as MessagePriority }, 'Priority updated')}
                            className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                            aria-label="Priority"
                        >
                            {(['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const).map((p) => <option key={p} value={p}>{label(p)} priority</option>)}
                        </select>
                        <div className="ml-auto flex gap-1.5">
                            {closed ? (
                                <button onClick={() => save({ status: 'IN_PROGRESS' }, 'Reopened')} className="h-8 rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">Reopen</button>
                            ) : (
                                <>
                                    <button onClick={() => save({ status: 'RESOLVED' }, 'Marked resolved')} className="inline-flex h-8 items-center gap-1 rounded-lg border border-emerald-200 px-3 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-400 dark:hover:bg-emerald-500/10"><CheckCircleIcon className="h-4 w-4" /> Resolve</button>
                                    <button onClick={() => save({ status: 'CLOSED' }, 'Closed')} className="h-8 rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700" title="Close without resolving (spam, duplicate…)">Close</button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* conversation */}
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 lg:max-h-[440px]">
                <Bubble side="left" who={m.customerName} when={m.createdAt} body={m.body} />
                {m.replies?.map((r) => (
                    <Bubble key={r.id} side="right" internal={r.isInternal} who={r.authorId === me ? 'You' : shortName(r.authorName)} when={r.createdAt} body={r.body}
                        meta={r.isInternal ? 'Internal note — not sent' : 'Emailed to customer'} />
                ))}
            </div>

            {/* composer */}
            {canUpdate && (
                <div className="border-t border-gray-100 px-5 py-4 dark:border-gray-700/70">
                    <div className="mb-2 inline-flex rounded-lg bg-gray-100 p-0.5 text-xs font-medium dark:bg-gray-700/60">
                        <button onClick={() => setMode('reply')} className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 transition ${mode === 'reply' ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                            <EnvelopeIcon className="h-3.5 w-3.5" /> Reply to customer
                        </button>
                        <button onClick={() => setMode('note')} className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 transition ${mode === 'note' ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                            <LockClosedIcon className="h-3.5 w-3.5" /> Internal note
                        </button>
                    </div>
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(false); }}
                        rows={3}
                        maxLength={5000}
                        placeholder={mode === 'reply' ? `Reply to ${m.customerName.split(' ')[0]}… (emailed to ${m.customerEmail})` : 'Note for the team — the customer never sees this'}
                        className={`w-full resize-y rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 dark:text-gray-100 ${mode === 'note'
                            ? 'border-amber-200 bg-amber-50/50 focus:border-amber-400 focus:ring-amber-400/30 dark:border-amber-500/30 dark:bg-amber-500/5'
                            : 'border-gray-200 bg-white focus:border-blue-500 focus:ring-blue-500/30 dark:border-gray-700 dark:bg-gray-900'}`}
                    />
                    <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                        <span className="mr-auto text-[11px] text-gray-400">⌘/Ctrl + Enter to send</span>
                        {mode === 'reply' && !closed && (
                            <button onClick={() => send(true)} disabled={!body.trim() || reply.isPending}
                                className="h-9 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
                                Send &amp; resolve
                            </button>
                        )}
                        <button onClick={() => send(false)} disabled={!body.trim() || reply.isPending}
                            className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-medium text-white shadow-sm disabled:opacity-50 ${mode === 'note' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                            {mode === 'note' ? <><LockClosedIcon className="h-4 w-4" /> Add note</> : <><PaperAirplaneIcon className="h-4 w-4" /> {reply.isPending ? 'Sending…' : 'Send reply'}</>}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function Bubble({ side, who, when, body, internal, meta }: { side: 'left' | 'right'; who: string; when: string; body: string; internal?: boolean; meta?: string }) {
    return (
        <div className={`flex ${side === 'right' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[85%]">
                <div className={`mb-1 flex items-center gap-2 text-[11px] text-gray-400 ${side === 'right' ? 'justify-end' : ''}`}>
                    <span className="font-semibold text-gray-600 dark:text-gray-300">{who}</span>
                    <span>{timeAgo(when)}</span>
                </div>
                <div className={`whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${side === 'left'
                    ? 'rounded-tl-sm bg-gray-100 text-gray-800 dark:bg-gray-700/60 dark:text-gray-100'
                    : internal
                        ? 'rounded-tr-sm border border-dashed border-amber-300 bg-amber-50 text-gray-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-gray-100'
                        : 'rounded-tr-sm bg-blue-600 text-white'}`}>
                    {body}
                </div>
                {meta && <p className={`mt-1 flex items-center gap-1 text-[11px] text-gray-400 ${side === 'right' ? 'justify-end' : ''}`}>
                    {internal ? <LockClosedIcon className="h-3 w-3" /> : <EnvelopeIcon className="h-3 w-3" />} {meta}
                </p>}
            </div>
        </div>
    );
}
