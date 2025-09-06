const CACHE='instruction-pwa-v12';
const CORE=['./','./index.html','./styles.v12.css','./app.js','./manifest.webmanifest',
'./assets/icon-192.png','./assets/icon-512.png','./assets/cover.webp'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)));
  self.skipWaiting();
});
self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim())
  );
});
self.addEventListener('fetch',e=>{
  e.respondWith(
    caches.match(e.request).then(r=>r||fetch(e.request).then(net=>{
      const u=new URL(e.request.url);
      const isHTML=e.request.mode==='navigate'||u.pathname.endsWith('.html');
      if(isHTML) caches.open(CACHE).then(c=>c.put(e.request,net.clone()));
      return net;
    }).catch(()=>caches.match('./index.html')))
  );
});