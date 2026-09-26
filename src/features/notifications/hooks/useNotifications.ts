// src/features/notifications/hooks/useNotifications.ts
import { useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { notificationsApi, type NotificationFeed } from '../api/notifications.api';

export const notificationKeys = { feed: ['notifications', 'feed'] as const };

/**
 * The bell's feed. Polls every 30s, refreshes when the tab regains focus, and
 * immediately when the service worker receives a push (it posts a message).
 */
export function useNotificationFeed(enabled = true) {
    const qc = useQueryClient();
    const query = useInfiniteQuery({
        queryKey: notificationKeys.feed,
        enabled,
        initialPageParam: undefined as string | undefined,
        queryFn: ({ pageParam }) => notificationsApi.list({ limit: 20, before: pageParam }),
        getNextPageParam: (last) => last.nextBefore ?? undefined,
        refetchInterval: 30_000,
        refetchOnWindowFocus: true,
        staleTime: 10_000,
    });

    useEffect(() => {
        if (!enabled || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
        const onMessage = (e: MessageEvent) => {
            if (e.data?.type === 'push-received') qc.invalidateQueries({ queryKey: notificationKeys.feed });
        };
        navigator.serviceWorker.addEventListener('message', onMessage);
        return () => navigator.serviceWorker.removeEventListener('message', onMessage);
    }, [enabled, qc]);

    const pages = query.data?.pages ?? [];
    return {
        ...query,
        items: pages.flatMap((p) => p.data),
        unread: pages[0]?.unread ?? 0,
    };
}

type Feed = InfiniteData<NotificationFeed, string | undefined>;

/** Mark notifications read, updating the list and unread count straight away. */
export function useMarkNotificationsRead() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (arg: { ids: string[] } | { all: true }) =>
            'all' in arg ? notificationsApi.markAllRead() : notificationsApi.markRead(arg.ids),
        onMutate: async (arg) => {
            await qc.cancelQueries({ queryKey: notificationKeys.feed });
            const prev = qc.getQueryData<Feed>(notificationKeys.feed);
            if (prev) {
                const ids = 'all' in arg ? null : new Set(arg.ids);
                let newlyRead = 0;
                const pages = prev.pages.map((p) => ({
                    ...p,
                    data: p.data.map((n) => {
                        if (n.read || (ids && !ids.has(n.id))) return n;
                        newlyRead++;
                        return { ...n, read: true };
                    }),
                }));
                const unread = 'all' in arg ? 0 : Math.max(0, (prev.pages[0]?.unread ?? 0) - newlyRead);
                qc.setQueryData<Feed>(notificationKeys.feed, {
                    ...prev,
                    pages: pages.map((p, i) => (i === 0 ? { ...p, unread } : p)),
                });
            }
            return { prev };
        },
        onError: (_e, _arg, ctx) => {
            if (ctx?.prev) qc.setQueryData(notificationKeys.feed, ctx.prev);
        },
        onSettled: () => qc.invalidateQueries({ queryKey: notificationKeys.feed }),
    });
}
