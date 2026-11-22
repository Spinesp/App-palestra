// Service worker: l'app funziona anche senza rete in palestra.
// Cambia CACHE a ogni nuova versione: alla riapertura l'iPhone scarica la versione nuova.
const CACHE = 'palestra-v1.6';
const FILES = [
  './', './index.html', './styles.css', './app.js', './data.js', './manifest.webmanifest',
  './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png',
  './fonts/barlow-condensed-latin-700-normal.woff2', './fonts/barlow-condensed-latin-800-normal.woff2',
  './fonts/inter-latin-400-normal.woff2', './fonts/inter-latin-500-normal.woff2', './fonts/inter-latin-600-normal.woff2',
  './fonts/inter-latin-700-normal.woff2', './fonts/inter-latin-800-normal.woff2',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// prima la rete (così gli aggiornamenti arrivano subito), poi la copia salvata se sei offline
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
  );
});
