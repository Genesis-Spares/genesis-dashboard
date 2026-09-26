import type { MetadataRoute } from 'next';

/** Web app manifest (served at /manifest.webmanifest): makes the dashboard installable. */
export default function manifest(): MetadataRoute.Manifest {
    return {
        id: '/',
        name: 'Genesis Admin',
        short_name: 'Genesis',
        description: 'Run the Genesis store: orders, stock, customers and reports.',
        start_url: '/dashboard',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#f9fafb',
        theme_color: '#ffffff', // matches the white header, so the installed app's title bar blends in
        categories: ['business', 'productivity'],
        icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
            { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
            { name: 'Orders', url: '/orders', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
            { name: 'Urgent orders', url: '/orders/urgent', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
            { name: 'Inventory', url: '/inventory', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
        ],
    };
}
