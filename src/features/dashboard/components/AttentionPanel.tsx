// src/features/dashboard/components/AttentionPanel.tsx
'use client';

import Link from 'next/link';
import { ComponentType } from 'react';
import {
    ArchiveBoxXMarkIcon,
    ChatBubbleLeftRightIcon,
    ChevronRightIcon,
    ClockIcon,
    CreditCardIcon,
    ArrowUturnLeftIcon,
    BanknotesIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/20/solid';
import { Order } from '@/types/order.types';
import { Product } from '@/types/product.types';

/** Default reorder threshold when a product has no minStockQty set. */
export const DEFAULT_MIN_STOCK = 5;

export const isLowStock = (p: Product) => p.stockQty <= (p.minStockQty ?? DEFAULT_MIN_STOCK);

const hoursAgo = (iso: string) => {
    const h = Math.floor((Date.now() - new Date(iso).getTime()) / 36e5);
    return h >= 48 ? `${Math.floor(h / 24)}d` : `${h}h`;
};

interface Props {
    stuck?: Order[];
    paymentIssues?: Order[];
    lowStock?: Product[];
    openMessages?: number;
    urgentMessages?: number;
    returnsToReview?: number;
    refundsDue?: { id: string; orderNumber: string; customerName: string; total: string | number; currency: string }[];
    show: { orders: boolean; products: boolean; messages: boolean };
    loading?: boolean;
}

export function AttentionPanel({ stuck = [], paymentIssues = [], lowStock = [], openMessages = 0, urgentMessages = 0, returnsToReview = 0, refundsDue = [], show, loading }: Props) {
    const total = (show.orders ? stuck.length + paymentIssues.length + returnsToReview + refundsDue.length : 0) + (show.products ? lowStock.length : 0) + (show.messages ? openMessages : 0);

    return (
        <section className="flex flex-col rounded-xl border border-gray-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] dark:border-gray-700/70 dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-700/70">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Needs attention</h2>
                {!loading && total > 0 && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 tabular-nums dark:bg-amber-500/10 dark:text-amber-400">
                        {total}
                    </span>
                )}
            </div>

            {loading ? (
                <div className="space-y-3 p-5">
                    {[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-50 dark:bg-gray-700/40" />)}
                </div>
            ) : total === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 text-center">
                    <CheckCircleIcon className="h-8 w-8 text-emerald-500" />
                    <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">All clear</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">No stuck orders, returns, refunds, payment issues or low stock.</p>
                </div>
            ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700/70">
                    {show.orders && refundsDue.length > 0 && (
                        <Group icon={BanknotesIcon} title="Refunds due (cancelled after payment)" count={refundsDue.length} href="/orders?status=CANCELLED">
                            {refundsDue.slice(0, 3).map((o) => (
                                <Row key={o.id} href={`/orders/${o.id}`} primary={o.orderNumber} secondary={o.customerName}
                                    meta={<span className="font-semibold text-rose-600 dark:text-rose-400">{Number(o.total).toLocaleString('en-KE')} {o.currency}</span>} />
                            ))}
                        </Group>
                    )}
                    {show.orders && returnsToReview > 0 && (
                        <Link href="/returns" className="flex items-center gap-3 px-5 py-4 transition hover:bg-gray-50 dark:hover:bg-gray-700/30">
                            <ArrowUturnLeftIcon className="h-4 w-4 shrink-0 text-gray-400" />
                            <span className="flex-1 text-[13px] font-medium text-gray-700 dark:text-gray-200">{returnsToReview} return request{returnsToReview === 1 ? '' : 's'} to review</span>
                            <ChevronRightIcon className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                        </Link>
                    )}
                    {show.orders && stuck.length > 0 && (
                        <Group icon={ClockIcon} title="Orders waiting 24h+" count={stuck.length} href="/orders/urgent">
                            {stuck.slice(0, 3).map((o) => (
                                <Row key={o.id} href={`/orders/${o.id}`} primary={o.orderNumber} secondary={o.customerName}
                                    meta={<span className="text-amber-600 dark:text-amber-400">{hoursAgo(o.createdAt)} · {o.status.toLowerCase()}</span>} />
                            ))}
                        </Group>
                    )}
                    {show.orders && paymentIssues.length > 0 && (
                        <Group icon={CreditCardIcon} title="Payment issues" count={paymentIssues.length} href="/orders/urgent">
                            {paymentIssues.slice(0, 3).map((o) => (
                                <Row key={o.id} href={`/orders/${o.id}`} primary={o.orderNumber} secondary={o.customerName}
                                    meta={<span className={o.paymentStatus === 'FAILED' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}>
                                        {o.paymentStatus === 'FAILED' ? 'Failed' : `Unpaid ${hoursAgo(o.createdAt)}`}
                                    </span>} />
                            ))}
                        </Group>
                    )}
                    {show.products && lowStock.length > 0 && (
                        <Group icon={ArchiveBoxXMarkIcon} title="Low stock" count={lowStock.length} href="/products">
                            {lowStock.slice(0, 4).map((p) => (
                                <Row key={p.id} href={`/products/${p.id}`} primary={p.name} secondary={p.sku}
                                    meta={<span className={p.stockQty === 0 ? 'font-semibold text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}>
                                        {p.stockQty === 0 ? 'Out of stock' : `${p.stockQty} left`}
                                    </span>} />
                            ))}
                        </Group>
                    )}
                    {show.messages && openMessages > 0 && (
                        <Link href="/messages" className="flex items-center gap-3 px-5 py-4 transition hover:bg-gray-50 dark:hover:bg-gray-700/30">
                            <ChatBubbleLeftRightIcon className="h-4 w-4 shrink-0 text-gray-400" />
                            <span className="flex-1 text-[13px] font-medium text-gray-700 dark:text-gray-200">
                                {openMessages} open message{openMessages === 1 ? '' : 's'}
                                {urgentMessages > 0 && <span className="ml-1.5 text-rose-600 dark:text-rose-400">· {urgentMessages} high priority</span>}
                            </span>
                            <ChevronRightIcon className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                        </Link>
                    )}
                </div>
            )}
        </section>
    );
}

function Group({ icon: Icon, title, count, href, children }: {
    icon: ComponentType<{ className?: string }>; title: string; count: number; href: string; children: React.ReactNode;
}) {
    return (
        <div className="px-5 py-4">
            <div className="mb-2 flex items-center gap-2">
                <Icon className="h-4 w-4 text-gray-400" />
                <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-200">{title}</span>
                <span className="text-xs text-gray-400 tabular-nums">{count}</span>
                <Link href={href} className="ml-auto text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">View</Link>
            </div>
            <ul className="space-y-0.5">{children}</ul>
        </div>
    );
}

function Row({ href, primary, secondary, meta }: { href: string; primary: string; secondary?: string; meta: React.ReactNode }) {
    return (
        <li>
            <Link href={href} className="-mx-2 flex items-center gap-3 rounded-md px-2 py-1.5 text-[13px] transition hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <span className="min-w-0 flex-1 truncate">
                    <span className="font-medium text-gray-900 dark:text-white">{primary}</span>
                    {secondary && <span className="text-gray-400"> · {secondary}</span>}
                </span>
                <span className="shrink-0 text-xs tabular-nums">{meta}</span>
            </Link>
        </li>
    );
}
