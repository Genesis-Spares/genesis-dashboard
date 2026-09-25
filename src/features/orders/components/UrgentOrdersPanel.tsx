// src/features/orders/components/UrgentOrdersPanel.tsx
'use client';

import { useState, type ComponentType, type ReactNode } from 'react';
import {
    ClockIcon,
    ExclamationTriangleIcon,
    BanknotesIcon,
    ArrowPathIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';
import { StatusDialog, PaymentDialog, STATUS_ACTION } from './OrderDialogs';
import { useUrgentOrders } from '../hooks/useUrgentOrders';
import { Order, OrderStatus } from '@/types/order.types';
import { formatMoney } from './OrderTable';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
    PENDING: 'CONFIRMED',
    CONFIRMED: 'PROCESSING',
    PROCESSING: 'SHIPPED',
    SHIPPED: 'DELIVERED',
};

function hoursAgo(iso: string) {
    return Math.floor((Date.now() - new Date(iso).getTime()) / (60 * 60 * 1000));
}

function ActionButton({
    onClick,
    disabled,
    icon: Icon,
    children,
}: {
    onClick: () => void;
    disabled?: boolean;
    icon: ComponentType<{ className?: string }>;
    children: ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:opacity-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20"
        >
            <Icon className="h-3.5 w-3.5" />
            {children}
        </button>
    );
}

function StuckOrderRow({ order }: { order: Order }) {
    const { can } = usePermissions();
    const canUpdate = can({ permission: 'order:update' });
    const [target, setTarget] = useState<OrderStatus | null>(null);
    const next = NEXT_STATUS[order.status];

    return (
        <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/40">
            <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {order.orderNumber} <span className="text-gray-400">· {order.customerName}</span>
                </p>
                <p className="text-xs text-gray-400">
                    {order.status} for {hoursAgo(order.createdAt)}h · {formatMoney(order.total, order.currency)}
                </p>
            </div>
            {canUpdate && (
                <div className="flex shrink-0 gap-1.5">
                    {next && (
                        <ActionButton icon={ArrowPathIcon} onClick={() => setTarget(next)}>
                            {STATUS_ACTION[next].verb}
                        </ActionButton>
                    )}
                    <ActionButton icon={XCircleIcon} onClick={() => setTarget('CANCELLED')}>
                        Cancel
                    </ActionButton>
                </div>
            )}
            <StatusDialog order={order} target={target} onClose={() => setTarget(null)} />
        </li>
    );
}

function PaymentIssueRow({ order }: { order: Order }) {
    const { can } = usePermissions();
    const canUpdate = can({ permission: 'order:update' });
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [target, setTarget] = useState<OrderStatus | null>(null);

    return (
        <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/40">
            <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {order.orderNumber} <span className="text-gray-400">· {order.customerName}</span>
                </p>
                <p className="text-xs text-gray-400">
                    Payment {order.paymentStatus} · {formatMoney(order.total, order.currency)}
                </p>
            </div>
            {canUpdate && (
                <div className="flex shrink-0 gap-1.5">
                    <ActionButton icon={BanknotesIcon} onClick={() => setPaymentOpen(true)}>
                        Update payment
                    </ActionButton>
                    {['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status) && (
                        <ActionButton icon={XCircleIcon} onClick={() => setTarget('CANCELLED')}>
                            Cancel
                        </ActionButton>
                    )}
                </div>
            )}
            <PaymentDialog order={order} open={paymentOpen} onClose={() => setPaymentOpen(false)} />
            <StatusDialog order={order} target={target} onClose={() => setTarget(null)} />
        </li>
    );
}

function HighValueRow({ order }: { order: Order }) {
    const { can } = usePermissions();
    const canUpdate = can({ permission: 'order:update' });
    const [target, setTarget] = useState<OrderStatus | null>(null);
    const next = NEXT_STATUS[order.status];

    return (
        <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/40">
            <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {order.orderNumber} <span className="text-gray-400">· {order.customerName}</span>
                </p>
                <p className="text-xs text-gray-400">
                    {order.status} · <span className="font-semibold text-blue-600 dark:text-blue-400">{formatMoney(order.total, order.currency)}</span>
                </p>
            </div>
            {canUpdate && next && (
                <ActionButton icon={ArrowPathIcon} onClick={() => setTarget(next)}>
                    {STATUS_ACTION[next].verb}
                </ActionButton>
            )}
            <StatusDialog order={order} target={target} onClose={() => setTarget(null)} />
        </li>
    );
}

function Section({
    title,
    icon: Icon,
    count,
    children,
    emptyLabel,
}: {
    title: string;
    icon: ComponentType<{ className?: string }>;
    count: number;
    children: ReactNode;
    emptyLabel: string;
}) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
                </div>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{count}</span>
            </div>
            {count === 0 ? (
                <p className="py-4 text-center text-xs text-gray-400">{emptyLabel}</p>
            ) : (
                <ul className="max-h-[320px] space-y-0.5 overflow-y-auto">{children}</ul>
            )}
        </div>
    );
}

export function UrgentOrdersPanel() {
    const { stuck, paymentIssues, highValueOrders, isLoading } = useUrgentOrders();

    if (isLoading) {
        return (
            <div className="py-12">
                <LoadingSpinner size="sm" />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Section title="Stuck Orders" icon={ClockIcon} count={stuck.length} emptyLabel="Nothing stuck right now.">
                {stuck.map((o) => (
                    <StuckOrderRow key={o.id} order={o} />
                ))}
            </Section>
            <Section
                title="Payment Issues"
                icon={ExclamationTriangleIcon}
                count={paymentIssues.length}
                emptyLabel="No payment problems."
            >
                {paymentIssues.map((o) => (
                    <PaymentIssueRow key={o.id} order={o} />
                ))}
            </Section>
            <Section title="High-Value Orders" icon={BanknotesIcon} count={highValueOrders.length} emptyLabel="No orders yet.">
                {highValueOrders.map((o) => (
                    <HighValueRow key={o.id} order={o} />
                ))}
            </Section>
        </div>
    );
}
