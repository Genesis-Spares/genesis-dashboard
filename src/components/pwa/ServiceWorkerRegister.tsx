'use client';

import { useEffect } from 'react';

/**
 * Registers /sw.js in production builds. Skipped in `next dev`, where a service
 * worker would get in the way of hot reloading.
 */
export function ServiceWorkerRegister() {
    useEffect(() => {
        if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
        const register = () =>
            navigator.serviceWorker
                .register('/sw.js', { scope: '/', updateViaCache: 'none' })
                .catch((err) => console.warn('Service worker registration failed', err));
        if (document.readyState === 'complete') register();
        else window.addEventListener('load', register, { once: true });
    }, []);
    return null;
}
