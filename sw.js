// v17-mini SW with update notice
const CACHE='instruction-pwa-v17-mini';
const CORE=['./','./index.html','./app.js','./manifest.webmanifest',
  './assets/icon-192.png','./assets/icon-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    (async ()=>{
      const keys=await caches.keys();
      await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
      await self.clients.claim();
      // tell clients a new version is active
      const clientsList = await self.clients.matchAll({type:'window', includeUncontrolled:true});
      for (const client of clientsList){
        client.postMessage({type:'NEW_VERSION', cache:CACHE});
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