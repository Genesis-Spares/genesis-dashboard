// src/app/(dashboard)/dashboard/page.tsx
'use client';

import Link from 'next/link';
import {
    BanknotesIcon,
    ChatBubbleLeftRightIcon,
    InboxStackIcon,
    ShoppingBagIcon,
} from '@heroicons/react/24/outline';
import { PlusIcon } from '@heroicons/react/20/solid';
import { useAuthStore } from '@/lib/stores/authStore';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { useOrderStats } from '@/features/orders/hooks/useOrders';
import { useUrgentOrders } from '@/features/orders/hooks/useUrgentOrders';
import { useMessageStats } from '@/features/messages/hooks/useMessages';
import { useProducts } from '@/features/products/hooks/useProducts';
import { formatMoney } from '@/features/orders/components/OrderTable';
import { KpiCard } from '@/features/dashboard/components/KpiCard';
import { RevenueChart } from '@/features/dashboard/components/RevenueChart';
import { StatusBreakdown } from '@/features/dashboard/components/StatusBreakdown';
import { AttentionPanel, isLowStock } from '@/features/dashboard/components/AttentionPanel';
import { RecentOrdersTable } from '@/features/dashboard/components/RecentOrdersTable';
import { useRefundsDue, useReturns } from '@/features/returns/hooks/useReturns';

const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export default function DashboardPage() {
    const { user } = useAuthStore();
    const { can } = usePermissions();

    const canViewOrders = can({ permission: 'order:read' });
    const canViewMessages = can({ permission: 'message:read' });
    const canViewProducts = can({ permission: 'product:read' });
    const canCreateProducts = can({ permission: 'product:create' });

    const { data: stats, isLoading: statsLoading } = useOrderStats();
    const { data: messageStats } = useMessageStats();
    const { stuck, paymentIssues, isLoading: urgentLoading } = useUrgentOrders();
    // lowest stock first; filtered to at/below each product's reorder level
    const { data: stockData, isLoading: stockLoading } = useProducts(
        { sortBy: 'stock', sortOrder: 'asc', limit: 12 },
        { enabled: canViewProducts },
    );
    const lowStock = (stockData?.data ?? []).filter(isLowStock);
    const { data: toReview } = useReturns({ status: 'REQUESTED', limit: 1 }, { enabled: canViewOrders });
    const { data: refundsDue } = useRefundsDue({ enabled: canViewOrders });

    const period = stats?.period;
    const byStatus = stats?.byStatus ?? {};
    const toFulfil = (byStatus.PENDING ?? 0) + (byStatus.CONFIRMED ?? 0) + (byStatus.PROCESSING ?? 0);
    const openMessages = messageStats ? (messageStats.byStatus.OPEN ?? 0) + (messageStats.byStatus.IN_PROGRESS ?? 0) : 0;

    return (
        <div className="space-y-6 pb-6">
            {/* header */}
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">
                        {new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                        {greeting()}{user?.firstName ? `, ${user.firstName}` : ''}
                    </h1>
                </div>
                <div className="flex gap-2">
                    {canViewOrders && (
                        <Link href="/orders" className="inline-flex h-9 items-center rounded-lg border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
                            View orders
                        </Link>
                    )}
                    {canCreateProducts && (
                        <Link href="/products/new" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700">
                            <PlusIcon className="h-4 w-4" /> Add product
                        </Link>
                    )}
                </div>
            </div>

            {canViewOrders ? (
                <>
                    {/* KPIs */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <KpiCard
                            label="Revenue · 30 days"
                            icon={BanknotesIcon}
                            loading={statsLoading}
                            value={period ? formatMoney(period.revenue) : '—'}
                            current={period?.revenue}
                            previous={period?.previousRevenue}
                            sub={stats?.today && <span>Today {formatMoney(stats.today.revenue)}</span>}
                        />
                        <KpiCard
                            label="Orders · 30 days"
                            icon={ShoppingBagIcon}
                            loading={statsLoading}
                            value={period?.orders ?? '—'}
                            current={period?.orders}
                            previous={period?.previousOrders}
                            sub={stats?.today && <span>{stats.today.orders} today</span>}
                            href="/orders"
                        />
                        <KpiCard
                            label="To fulfil"
                            icon={InboxStackIcon}
                            loading={statsLoading}
                            value={toFulfil}
                            tone={toFulfil > 0 ? 'warning' : 'default'}
                            sub={<span>{byStatus.SHIPPED ?? 0} in transit</span>}
                            href="/orders/urgent"
                        />
                        {canViewMessages ? (
                            <KpiCard
                                label="Open messages"
                                icon={ChatBubbleLeftRightIcon}
                                loading={!messageStats}
                                value={openMessages}
                                tone={messageStats?.urgentOpen ? 'warning' : 'default'}
                                sub={messageStats?.urgentOpen
                                    ? <span className="font-medium text-rose-600 dark:text-rose-400">{messageStats.urgentOpen} high priority</span>
                                    : <span>No urgent enquiries</span>}
                                href="/messages"
                            />
                        ) : (
                            <KpiCard
                                label="Revenue · all time"
                                icon={BanknotesIcon}
                                loading={statsLoading}
                                value={stats ? formatMoney(stats.totalRevenue) : '—'}
                                sub={<span>{stats?.totalOrders ?? 0} orders all time</span>}
                            />
                        )}
                    </div>

                    {/* trend + pipeline */}
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                        <div className="min-w-0 xl:col-span-2">
                            <RevenueChart daily={stats?.daily} loading={statsLoading} />
                        </div>
                        <StatusBreakdown byStatus={stats?.byStatus} loading={statsLoading} />
                    </div>

                    {/* work queue */}
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                        <div className="min-w-0 xl:col-span-2">
                            <RecentOrdersTable limit={6} />
                        </div>
                        <AttentionPanel
                            stuck={stuck}
                            paymentIssues={paymentIssues}
                            lowStock={lowStock}
                            openMessages={openMessages}
                            urgentMessages={messageStats?.urgentOpen}
                            returnsToReview={toReview?.meta.total ?? 0}
                            refundsDue={refundsDue ?? []}
                            show={{ orders: true, products: canViewProducts, messages: canViewMessages }}
                            loading={urgentLoading || (canViewProducts && stockLoading)}
                        />
                    </div>
                </>
            ) : (
                <div className="rounded-xl border border-gray-200/80 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-700/70 dark:bg-gray-800 dark:text-gray-400">
                    You don&apos;t have access to order data. Use the sidebar to open the sections available to your role.
                </div>
            )}
        </div>
    );
}
