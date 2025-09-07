const CACHE_STATIC = 'static-v18';
const ASSET_ALLOW = ['.css','.js','.png','.svg','.webmanifest'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE_STATIC);
    // 핵심 정적 자산만 프리캐시 (버전 쿼리 포함)
    await cache.addAll([
      './','./index.html?v=18',
      './styles.css?v=18','./app.js?v=18',
      './manifest.webmanifest?v=18'
    ]);
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_STATIC) && caches.delete(k)));
    await self.clients.claim();
  })());
});

/* 전략: HTML은 network-first, 정적은 cache-first */
self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  const isHTML = req.destination === 'document' || url.pathname.endsWith('.html');

  if (isHTML) {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache:'no-store' });
        const cache = await caches.open(CACHE_STATIC);
        cache.put(req, fresh.clone());
        return fresh;
      } catch {
        const cache = await caches.open(CACHE_STATIC);
        return (await cache.match(req)) || cache.match('./index.html?v=18');
      }
    })());
    return;
  }

  if (ASSET_ALLOW.some(ext => url.pathname.endsWith(ext))) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE_STATIC);
      const cached = await cache.match(req);
      if (cached) return cached;
      const fresh = await fetch(req);
      cache.put(req, fresh.clone());
      return fresh;
    })());
  }
});