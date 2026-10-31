// Cache hors ligne : le jeu tient en un fichier, on sert le cache puis on met à jour en arrière-plan.
const CACHE='ute-v1.2.0-b';
const FILES=['./','index.html','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','art/menu.png',
  'audio/ach.mp3','audio/boom.mp3','audio/bow.mp3','audio/brk.mp3','audio/buy.mp3','audio/click.mp3','audio/coin.mp3','audio/deny.mp3','audio/hit.mp3','audio/horn.mp3','audio/hurt.mp3','audio/jump.mp3','audio/music-day.mp3','audio/music-menu.mp3','audio/music-night.mp3','audio/pick.mp3','audio/place.mp3','audio/sword.mp3'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==CACHE).map(n=>caches.delete(n)))));self.clients.claim()});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;
  e.respondWith(caches.match(e.request).then(hit=>{const net=fetch(e.request).then(r=>{if(r.ok){const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp))}return r}).catch(()=>hit);return hit||net}))});
