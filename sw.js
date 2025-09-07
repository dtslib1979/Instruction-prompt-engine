// v17.6: Mobile hardening with improved cache strategy
const CACHE='static-v17.6';
const CORE=['./','./index.html','./app.js','./styles.css','./manifest.webmanifest',
  './assets/icon-192.png','./assets/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)));
  self.skipWaiting(); // 새 SW 즉시 활성화
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async ()=>{
      const keys=await caches.keys();
      await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
      await self.clients.claim();
      // 새 버전 신호 브로드캐스트
      const clientsList = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
      for (const client of clientsList){
        client.postMessage({ type: 'NEW_VERSION_AVAILABLE' });
      }
    })()
  );
});

self.addEventListener('fetch',e=>{
  const url = new URL(e.request.url);
  const isHTML = e.request.mode === 'navigate' || url.pathname.endsWith('.html');
  const hasVersionQuery = url.searchParams.has('v');
  
  if (isHTML) {
    // Network-first for HTML with cache fallback
    e.respondWith(
      fetch(e.request).then(response => {
        // Cache successful HTML responses
        if (response.ok) {
          caches.open(CACHE).then(cache => cache.put(e.request, response.clone()));
        }
        return response;
      }).catch(() => {
        // Fallback to cache, then to index.html
        return caches.match(e.request).then(cached => 
          cached || caches.match('./index.html')
        );
      })
    );
  } else if (hasVersionQuery) {
    // Cache-first for static files with version query
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(response => {
          if (response.ok) {
            caches.open(CACHE).then(cache => cache.put(e.request, response.clone()));
          }
          return response;
        });
      })
    );
  } else {
    // Network-first for other requests
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
  }
});