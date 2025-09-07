// sw.js
const CACHE_VER = 'v17.5';
const STATIC = `static-${CACHE_VER}`;

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(STATIC).then(c => c.addAll([
      '/Instruction-prompt-engine/styles.css?v=17.5',
      '/Instruction-prompt-engine/app.js?v=17.5',
      '/Instruction-prompt-engine/manifest.webmanifest',
    ]))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== STATIC).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// HTML은 무조건 네트워크 우선(오프라인 fallback)
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const accept = req.headers.get('accept') || '';
  const isHTML = req.mode === 'navigate' || accept.includes('text/html');

  if (isHTML) {
    e.respondWith((async () => {
      try {
        return await fetch(req, { cache: 'no-store' });
      } catch {
        const c = await caches.open(STATIC);
        return (await c.match('/Instruction-prompt-engine/index.html')) || Response.error();
      }
    })());
    return;
  }

  // 정적은 cache-first
  e.respondWith((async () => {
    const c = await caches.open(STATIC);
    const hit = await c.match(req);
    if (hit) return hit;
    const fresh = await fetch(req);
    if (new URL(req.url).search) c.put(req, fresh.clone()); // 버전 쿼리만 캐시
    return fresh;
  })());
});