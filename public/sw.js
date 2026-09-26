/*
 * Genesis Admin service worker.
 *
 * What it caches: only the app's own static files (hashed JS/CSS chunks, fonts, icons)
 * so the installed app opens fast. What it never caches: pages, API responses, or
 * anything else with store or customer data. The API lives on another origin and is
 * ignored entirely, so data is always live and nothing private stays on the device.
 * With no connection, page loads show a small offline screen instead of an error.
 */
const VERSION = 'v1';
const STATIC_CACHE = `genesis-static-${VERSION}`;
const MAX_STATIC_ENTRIES = 300;

const OFFLINE_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#2563eb">
<title>Offline · Genesis Admin</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f9fafb;
       font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111827;padding:24px;box-sizing:border-box}
  .card{max-width:360px;text-align:center}
  .logo{width:56px;height:56px;border-radius:14px;background:#2563eb;color:#fff;font:700 30px/56px system-ui;margin:0 auto 16px}
  h1{font-size:20px;margin:0 0 6px} p{color:#6b7280;margin:0 0 20px}
  button{background:#2563eb;color:#fff;border:0;border-radius:10px;padding:10px 18px;font:600 15px system-ui;cursor:pointer}
  @media (prefers-color-scheme:dark){body{background:#111827;color:#f9fafb}p{color:#9ca3af}}
</style></head><body><div class="card">
<div class="logo">G</div><h1>You're offline</h1>
<p>Genesis Admin needs a connection to load orders and stock. Check your signal or Wi-Fi and try again.</p>
<button onclick="location.reload()">Try again</button>
</div><script>addEventListener('online',()=>location.reload())</script></body></html>`;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.filter((k) => k.startsWith('genesis-') && k !== STATIC_CACHE).map((k) => caches.delete(k)));
        await self.clients.claim();
    })());
});

const isStatic = (url) =>
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    /\.(?:woff2?|ttf|otf)$/.test(url.pathname) ||
    url.pathname === '/favicon.ico';

async function trim(cache) {
    const keys = await cache.keys();
    for (let i = 0; i < keys.length - MAX_STATIC_ENTRIES; i++) await cache.delete(keys[i]);
}

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return; // API and other hosts: straight to network

    // Page loads: always from the network; offline screen if that fails.
    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req).catch(() => new Response(OFFLINE_HTML, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } })),
        );
        return;
    }

    // Hashed build files, fonts and icons never change under the same URL: cache-first.
    if (isStatic(url)) {
        event.respondWith((async () => {
            const cache = await caches.open(STATIC_CACHE);
            const hit = await cache.match(req);
            if (hit) return hit;
            const res = await fetch(req);
            if (res.ok && res.type === 'basic') {
                cache.put(req, res.clone()).then(() => trim(cache));
            }
            return res;
        })());
    }
    // Everything else (RSC payloads, /_next/image, manifest…): browser default.
});
