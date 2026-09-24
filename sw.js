// Service worker : le grimoire reste lisible hors ligne.
// - Fichiers de l'application : réseau d'abord (les mises à jour arrivent tout de suite), cache en secours.
// - Images des pages : cache d'abord (leur nom change quand leur contenu change).
const CACHE = 'grimoire-v2';
const SHELL = [
  './',
  'index.html',
  'book.json',
  'manifest.webmanifest',
  'css/reader.css',
  'fonts/fonts.css',
  'fonts/cinzel-0.woff2',
  'fonts/cinzel-decorative-1.woff2',
  'fonts/cormorant-garamond-2.woff2',
  'fonts/cormorant-garamond-3.woff2',
  'fonts/princess-sofia.woff2',
  'lib/page-flip.browser.js',
  'js/main.js',
  'js/reader.js',
  'js/cover.js',
  'js/fx.js',
  'js/sound.js',
  'js/store.js',
  'js/config.js',
  'img/desk.jpg',
  'img/parchment.jpg',
  'img/leather.jpg',
  'icons/icon-192.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function cacheFirst(req) {
  const hit = await caches.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
  return res;
}

async function networkFirst(req, store) {
  try {
    const fresh = req.mode === 'navigate'
      ? new Request(req.url, { cache: 'no-cache', credentials: 'same-origin' })
      : new Request(req, { cache: 'no-cache' });
    const res = await fetch(fresh);
    if (res.ok && store) (await caches.open(CACHE)).put(req, res.clone());
    return res;
  } catch (e) {
    const hit = await caches.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === 'navigate') return caches.match('index.html');
    throw e;
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (/\/(pages|assets)\//.test(url.pathname)) {
    event.respondWith(cacheFirst(req));
    return;
  }
  event.respondWith(networkFirst(req, !url.search));
});
