/* v24.1 SW: nuke support, versioned cache, skipWaiting/claim */
const CACHE_NAME = 'ipwa-cache-v24-1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  const msg = event.data;
  if (msg?.type === 'SKIP_WAITING') self.skipWaiting();
  if (msg?.type === 'NUKE_CACHES') {
    event.waitUntil(
      (async () => {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      })(),
    );
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    (async () => {
      const req = event.request;
      const url = new URL(req.url);

      // nuke if present on request OR on the client (tab) URL
      let nuke = url.searchParams.has('nuke');
      if (!nuke && event.clientId) {
        try {
          const client = await self.clients.get(event.clientId);
          if (client) {
            const cu = new URL(client.url);
            nuke = cu.searchParams.has('nuke');
          }
        } catch (_) {
          // Ignore client lookup errors
        }
      }

      if (nuke) {
        try {
          return await fetch(req, { cache: 'no-store' });
        } catch {
          const fallback = await caches.match(req, { ignoreSearch: false });
          if (fallback) return fallback;
          throw new Error('Network failed and no cached fallback');
        }
      }

      // default: cache-first with ignoreSearch:false
      const cached = await caches.match(req, { ignoreSearch: false });
      if (cached) return cached;

      const res = await fetch(req);
      try {
        if (url.origin === self.location.origin && res.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, res.clone());
        }
      } catch (_) {
        // Ignore cache put errors
      }
      return res;
    })(),
  );
});
