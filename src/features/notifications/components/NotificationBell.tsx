'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import {
    ArrowUturnLeftIcon,
    BellIcon,
    ChatBubbleLeftRightIcon,
    CubeIcon,
    ShoppingBagIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';
import { useMarkNotificationsRead, useNotificationFeed } from '../hooks/useNotifications';
import type { StaffNotification } from '../api/notifications.api';
import { PushToggle } from './PushToggle';
import { resyncPush } from '../push';

const TYPE_STYLE: Record<string, { icon: ComponentType<SVGProps<SVGSVGElement>>; tone: string }> = {
    ORDER_PLACED: { icon: ShoppingBagIcon, tone: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300' },
    ORDER_CANCELLED: { icon: XCircleIcon, tone: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300' },
    RETURN_REQUESTED: { icon: ArrowUturnLeftIcon, tone: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300' },
    MESSAGE_RECEIVED: { icon: ChatBubbleLeftRightIcon, tone: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300' },
    LOW_STOCK: { icon: CubeIcon, tone: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300' },
};
const FALLBACK = { icon: BellIcon, tone: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' };

function timeAgo(iso: string) {
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    if (s < 7 * 86400) return `${Math.floor(s / 86400)}d ago`;
    return new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
}

/** Header bell: unread count, the latest notifications, and the per-device push switch. */
export function NotificationBell() {
    const router = useRouter();
    const { user } = useAuthStore();
    const isStaff = !!user?.roles?.some((r) => r !== 'customer');
    const feed = useNotificationFeed(isStaff);
    const markRead = useMarkNotificationsRead();

    useEffect(() => {
        if (isStaff) resyncPush();
    }, [isStaff]);

    // keep the app icon badge (installed PWA) in step with the unread count
    useEffect(() => {
        const nav = navigator as Navigator & { setAppBadge?: (n: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
        if (!nav.setAppBadge) return;
        (feed.unread ? nav.setAppBadge(feed.unread) : nav.clearAppBadge?.())?.catch(() => undefined);
    }, [feed.unread]);

    if (!isStaff) return null;

    const open = (n: StaffNotification, close: () => void) => {
        if (!n.read) markRead.mutate({ ids: [n.id] });
        close();
        if (n.link) router.push(n.link);
    };

    const badge = feed.unread > 99 ? '99+' : String(feed.unread);

    return (
        <Popover className="relative">
            <PopoverButton
                aria-label={feed.unread ? `Notifications, ${feed.unread} unread` : 'Notifications'}
                className="relative rounded-full bg-gray-50 p-2 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
                <BellIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                {feed.unread > 0 && (
                    <span className="absolute -right-1 -top-1 min-w-[1.125rem] rounded-full bg-rose-500 px-1 text-center text-[10px] font-semibold leading-[1.125rem] text-white ring-2 ring-white tabular-nums dark:ring-gray-800">
                        {badge}
                    </span>
                )}
            </PopoverButton>

            <PopoverPanel
                transition
                className="fixed inset-x-2 top-[4.25rem] z-50 flex max-h-[calc(100dvh-5rem)] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl transition duration-150 ease-out data-[closed]:translate-y-1 data-[closed]:opacity-0 dark:border-gray-700 dark:bg-gray-800 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:max-h-[min(36rem,calc(100dvh-6rem))] sm:w-96"
            >
                {({ close }) => (
                    <>
                        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                                Notifications
                                {feed.unread > 0 && <span className="ml-1.5 text-xs font-medium text-gray-400">{feed.unread} new</span>}
                            </h2>
                            <button
                                type="button"
                                disabled={!feed.unread || markRead.isPending}
                                onClick={() => markRead.mutate({ all: true })}
                                className="text-xs font-medium text-blue-600 hover:underline disabled:cursor-default disabled:text-gray-300 disabled:no-underline dark:text-blue-400 dark:disabled:text-gray-600"
                            >
                                Mark all read
                            </button>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                            {feed.isLoading ? (
                                <div className="space-y-3 p-4">
                                    {[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-50 dark:bg-gray-700/50" />)}
                                </div>
                            ) : feed.isError ? (
                                <p className="px-4 py-10 text-center text-sm text-gray-500">
                                    Couldn&apos;t load notifications.{' '}
                                    <button type="button" onClick={() => feed.refetch()} className="font-medium text-blue-600 hover:underline">Retry</button>
                                </p>
                            ) : feed.items.length === 0 ? (
                                <div className="px-4 py-12 text-center">
                                    <BellIcon className="mx-auto h-8 w-8 text-gray-300" />
                                    <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-200">You&apos;re all caught up</p>
                                    <p className="mt-1 text-xs text-gray-400">New orders, returns, messages and stock alerts show up here.</p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-gray-50 dark:divide-gray-700/60">
                                    {feed.items.map((n) => {
                                        const { icon: Icon, tone } = TYPE_STYLE[n.type] ?? FALLBACK;
                                        return (
                                            <li key={n.id}>
                                                <button
                                                    type="button"
                                                    onClick={() => open(n, close)}
                                                    className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-gray-700/40 ${n.read ? '' : 'bg-blue-50/40 dark:bg-blue-500/5'}`}
                                                >
                                                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone}`}>
                                                        <Icon className="h-4 w-4" />
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className={`block text-sm ${n.read ? 'text-gray-700 dark:text-gray-200' : 'font-semibold text-gray-900 dark:text-white'}`}>
                                                            {n.title}
                                                        </span>
                                                        <span className="mt-0.5 line-clamp-2 block text-xs text-gray-500 dark:text-gray-400">{n.body}</span>
                                                        <span className="mt-1 block text-[11px] text-gray-400">{timeAgo(n.createdAt)}</span>
                                                    </span>
                                                    {!n.read && <span aria-label="unread" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-600" />}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                            {feed.hasNextPage && (
                                <button
                                    type="button"
                                    disabled={feed.isFetchingNextPage}
                                    onClick={() => feed.fetchNextPage()}
                                    className="w-full py-3 text-center text-xs font-medium text-blue-600 hover:bg-gray-50 disabled:opacity-50 dark:hover:bg-gray-700/40"
                                >
                                    {feed.isFetchingNextPage ? 'Loading…' : 'Show older'}
                                </button>
                            )}
                        </div>

                        <PushToggle />
                    </>
                )}
            </PopoverPanel>
        </Popover>
    );
}
