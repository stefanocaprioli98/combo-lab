/* Service worker: rende l'app utilizzabile offline.
   - file dell'app: prima la rete (così gli aggiornamenti arrivano subito), poi la cache
   - immagini carte: prima la cache (scaricate una sola volta)
   - API carte: prima la rete, poi la cache
   - librerie Firebase: prima la cache (così il login funziona anche offline) */
const VERSION = 'v23';
const SHELL_CACHE = 'combolab-shell-' + VERSION;
const IMG_CACHE = 'combolab-img';
const API_CACHE = 'combolab-api';
const LIB_CACHE = 'combolab-lib';   // librerie Firebase (versione fissa, non cambiano)
const SHELL = ['./', 'index.html', 'style.css', 'app.js', 'manifest.webmanifest',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL_CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('combolab-shell-') && k !== SHELL_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(req, cacheName, ms, fetcher) {
  const cache = await caches.open(cacheName);
  const net = fetcher().then(res => {
    if (res.ok) cache.put(req, res.clone());
    return res;
  });
  try {
    return await Promise.race([net, new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), ms))]);
  } catch (err) {
    const hit = (await cache.match(req)) ||
      (req.mode === 'navigate' ? ((await cache.match('./')) || (await cache.match('index.html'))) : null);
    if (hit) return hit;
    return net;
  }
}

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req, { ignoreVary: true });
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
  return res;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/')) {
    e.respondWith(cacheFirst(req, LIB_CACHE));
  } else if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(cacheFirst(req, LIB_CACHE));
  } else if (url.hostname === 'cards.scryfall.io' || url.hostname === 'svgs.scryfall.io') {
    e.respondWith(cacheFirst(req, IMG_CACHE));
  } else if (url.hostname === 'api.scryfall.com') {
    e.respondWith(networkFirst(req, API_CACHE, 8000, () => fetch(req)));
  } else if (url.hostname === 'images.ygoprodeck.com') {
    e.respondWith(cacheFirst(req, IMG_CACHE));
  } else if (url.hostname === 'db.ygoprodeck.com') {
    e.respondWith(networkFirst(req, API_CACHE, 8000, () => fetch(req)));
  } else if (url.origin === self.location.origin) {
    e.respondWith(networkFirst(req, SHELL_CACHE, 3500, () => fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' })));
  }
});
