// === v21 SW ===
const CACHE_NAME = 'ipwa-cache-v21';
const ASSETS = [
  '/', '/index.html', '/imprint.html',
  '/styles.css', '/app.js', '/manifest.webmanifest'
  // 필요시 폰트/아이콘 추가
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
  self.clients.matchAll({includeUncontrolled:true}).then(cs =>
    cs.forEach(c => c.postMessage({type:'NEW_VERSION_AVAILABLE', ver:'v21'}))
  );
});
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.mode === 'navigate' || r.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(r).then(res => {
        caches.open(CACHE_NAME).then(c => c.put(r, res.clone()));
        return res;
      }).catch(()=>caches.match(r))
    );
  } else {
    e.respondWith(caches.match(r).then(cached => cached || fetch(r)));
  }
});

self.addEventListener('message', (e) => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('message', (e) => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});