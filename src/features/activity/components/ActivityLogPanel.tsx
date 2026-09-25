// src/features/activity/components/ActivityLogPanel.tsx
'use client';

import { ClockIcon, ShoppingBagIcon, UserIcon } from '@heroicons/react/24/outline';
import { useActivityLog } from '../hooks/useActivityLog';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

function timeAgo(iso: string) {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function describeStaffAction(action: string, resource?: string) {
    const readable = action.replace(/[._]/g, ' ');
    return resource ? `${readable} · ${resource}` : readable;
}

interface ActivityLogPanelProps {
    limit?: number;
}

export function ActivityLogPanel({ limit = 15 }: ActivityLogPanelProps) {
    const { entries, isLoading, isError } = useActivityLog(limit);

    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
                <span className="text-xs text-gray-400">Orders &amp; staff actions</span>
            </div>

            {isLoading ? (
                <div className="py-8">
                    <LoadingSpinner />
                </div>
            ) : isError ? (
                <p className="py-6 text-center text-sm text-gray-400">Couldn&apos;t load activity.</p>
            ) : entries.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">No recent activity.</p>
            ) : (
                <ul className="space-y-3">
                    {entries.map((item) => (
                        <li key={item.id} className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                {item.kind === 'order' ? (
                                    <ShoppingBagIcon className="h-3.5 w-3.5" />
                                ) : (
                                    <UserIcon className="h-3.5 w-3.5" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                {item.kind === 'order' ? (
                                    <p className="text-sm text-gray-700 dark:text-gray-200">
                                        Order{' '}
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {item.entry.order?.orderNumber ?? item.entry.orderId}
                                        </span>{' '}
                                        marked{' '}
                                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                                            {item.entry.status}
                                        </span>
                                        {item.entry.order?.customerName ? ` for ${item.entry.order.customerName}` : ''}
                                    </p>
                                ) : (
                                    <p className="text-sm text-gray-700 dark:text-gray-200">
                                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                                            {describeStaffAction(item.entry.action, item.entry.resource)}
                                        </span>{' '}
                                        by user {item.entry.userId.slice(0, 8)}
                                    </p>
                                )}
                                <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                                    <ClockIcon className="h-3 w-3" />
                                    {timeAgo(item.createdAt)}
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
