// src/features/notifications/api/notifications.api.ts
import { apiClient } from '@/lib/api/client';

export type StaffNotificationType =
    | 'ORDER_PLACED'
    | 'ORDER_CANCELLED'
    | 'RETURN_REQUESTED'
    | 'MESSAGE_RECEIVED'
    | 'LOW_STOCK'
    | string;

export interface StaffNotification {
    id: string;
    type: StaffNotificationType;
    title: string;
    body: string;
    link: string | null;
    createdAt: string;
    read: boolean;
}

export interface NotificationFeed {
    data: StaffNotification[];
    unread: number;
    nextBefore: string | null;
}

export interface BrowserPushSubscription {
    endpoint: string;
    keys: { p256dh: string; auth: string };
}

export const notificationsApi = {
    list: (params?: { limit?: number; before?: string }): Promise<NotificationFeed> =>
        apiClient.get<NotificationFeed>('/notifications', params),
    markRead: (ids: string[]) => apiClient.post('/notifications/read', { ids }),
    markAllRead: () => apiClient.post('/notifications/read', { all: true }),
    pushKey: (): Promise<{ publicKey: string }> => apiClient.get('/notifications/push/key'),
    subscribe: (sub: BrowserPushSubscription) => apiClient.post('/notifications/push/subscribe', sub),
    unsubscribe: (endpoint: string) => apiClient.delete('/notifications/push/subscribe', { endpoint }),
    test: () => apiClient.post('/notifications/push/test'),
};
