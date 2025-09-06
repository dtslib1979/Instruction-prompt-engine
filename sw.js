// v17-mini.2: 설치 즉시 대기 제거 & 클라이언트 고지
const CACHE='instruction-pwa-v17-mini.2';
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
  e.respondWith(
    caches.match(e.request).then(r=>r||fetch(e.request).then(net=>{
      const u=new URL(e.request.url);
      const isHTML=e.request.mode==='navigate'||u.pathname.endsWith('.html');
      if(isHTML) caches.open(CACHE).then(c=>c.put(e.request,net.clone())).catch(()=>{});
      return net;
    }).catch(()=>caches.match('./index.html')))
  );
});