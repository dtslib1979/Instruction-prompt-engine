/* v24.1 SW: 캐시 무시(nuke), 버전 캐시, skipWaiting/claim */
const CACHE_NAME = 'ipwa-cache-v24-1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  const msg = event.data;
  if (msg?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (msg?.type === 'NUKE_CACHES') {
    event.waitUntil((async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    })());
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const nuke = url.searchParams.has('nuke');

  if (nuke) {
    // 네트워크 우선, 캐시 건너뛰기
    event.respondWith(
      fetch(req, { cache: 'no-store' }).catch(() => caches.match(req, { ignoreSearch: false }))
    );
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(req, { ignoreSearch: false });
    if (cached) return cached;

    const res = await fetch(req);
    const cache = await caches.open(CACHE_NAME);
    cache.put(req, res.clone());
    return res;
  })());
});