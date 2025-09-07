// sw.js — v23
const CACHE_NAME = 'ipwa-cache-v23';
const CORE = [
  '/Instruction-prompt-engine/',
  '/Instruction-prompt-engine/index.html',
  '/Instruction-prompt-engine/styles.css?v=23',
  '/Instruction-prompt-engine/css/chrome-mobile-v23.css?v=23',
  '/Instruction-prompt-engine/app.js?v=23',
  '/Instruction-prompt-engine/manifest.webmanifest',
  '/Instruction-prompt-engine/imprint.html',
  '/Instruction-prompt-engine/icons/icon-192x192.png',
  '/Instruction-prompt-engine/icons/icon-512x512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_NAME) && caches.delete(k)));
    await self.clients.claim();
    const cs = await self.clients.matchAll({ includeUncontrolled: true });
    cs.forEach(c => c.postMessage({ type: 'NEW_VERSION', ver: 'v23' }));
  })());
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const req = e.request;
  const accept = req.headers.get('accept') || '';
  const isHTML = req.mode === 'navigate' || accept.includes('text/html');

  e.respondWith((async () => {
    if (isHTML) {
      try {
        const net = await fetch(req, { cache: 'no-store' });
        (await caches.open(CACHE_NAME)).put(req, net.clone());
        return net;
      } catch {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match(req)) || cache.match('/Instruction-prompt-engine/index.html');
      }
    } else {
      const cache = await caches.open(CACHE_NAME);
      const hit = await cache.match(req);
      if (hit) return hit;
      const net = await fetch(req);
      if (net.ok) cache.put(req, net.clone());
      return net;
    }
  })());
});

self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});