const CACHE = 'instruction-pwa-v12';
const CORE = [
  './',
  './index.html',
  './styles.v12.css',
  './app.js',
  './manifest.webmanifest',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/cover.webp'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)));
  self.skipWaiting();
});
self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});
self.addEventListener('fetch', e=>{
  e.respondWith(
    caches.match(e.request).then(res=>res||fetch(e.request).then(net=>{
      const url=new URL(e.request.url);
      const isHTML = e.request.mode==='navigate' || url.pathname.endsWith('.html');
      if(isHTML){ const clone=net.clone(); caches.open(CACHE).then(c=>c.put(e.request,clone)).catch(()=>{}); }
      return net;
    }).catch(()=>caches.match('./index.html')))
  );
});