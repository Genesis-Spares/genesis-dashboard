// src/features/notifications/push.ts
// Browser side of web push: permission, subscription, and keeping the server in sync.
import { notificationsApi } from './api/notifications.api';

export type PushState =
    | 'unsupported' // browser has no Push API
    | 'ios-install' // iPhone/iPad Safari: only works once the app is on the Home Screen
    | 'denied' // the user blocked notifications for this site
    | 'off' // supported, not subscribed
    | 'on'; // subscribed on this device

const isIOS = () =>
    /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1);
const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

function urlBase64ToUint8Array(base64: string) {
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function registration() {
    // in dev there's no service worker (see ServiceWorkerRegister), so push is unavailable
    const reg = await navigator.serviceWorker.getRegistration('/');
    return reg ?? null;
}

export async function getPushState(): Promise<PushState> {
    if (typeof window === 'undefined') return 'unsupported';
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    if (!supported) return isIOS() && !isStandalone() ? 'ios-install' : 'unsupported';
    if (Notification.permission === 'denied') return 'denied';
    const reg = await registration();
    if (!reg) return 'unsupported';
    const sub = await reg.pushManager.getSubscription();
    return sub ? 'on' : 'off';
}

/** Ask for permission (must run from a click) and register this device with the API. */
export async function enablePush(): Promise<PushState> {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'off';
    const reg = (await registration()) ?? (await navigator.serviceWorker.ready);
    const { publicKey } = await notificationsApi.pushKey();
    let sub = await reg.pushManager.getSubscription();
    // a subscription made with a different server key can't be reused
    const existingKey = sub?.options?.applicationServerKey;
    if (sub && existingKey) {
        const a = new Uint8Array(existingKey);
        const b = urlBase64ToUint8Array(publicKey);
        if (a.length !== b.length || a.some((v, i) => v !== b[i])) {
            await sub.unsubscribe();
            sub = null;
        }
    }
    sub ??= await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
    await notificationsApi.subscribe(sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } });
    return 'on';
}

export async function disablePush(): Promise<PushState> {
    const reg = await registration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
        await notificationsApi.unsubscribe(sub.endpoint).catch(() => undefined);
        await sub.unsubscribe();
    }
    return 'off';
}

/**
 * On app start: if this device is already subscribed, re-send it so the server has
 * the current owner and permissions (e.g. after a role change or a new login).
 */
export async function resyncPush() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (Notification.permission !== 'granted') return;
    const reg = await registration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) await notificationsApi.subscribe(sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }).catch(() => undefined);
}
