// Smæsh offline support.
// The page itself is fetched network-first so every launch with signal gets
// the newest app; the cached copy is only used when there is no connection.
const CACHE = 'smaesh-capture-v6';
const ASSETS = ['./capture.html', './manifest.webmanifest', './icon-180.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isPage = e.request.mode === 'navigate' || url.pathname.endsWith('.html');
  if (isPage && url.origin === location.origin) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./capture.html', copy)); }
        return res;
      }).catch(() => caches.match('./capture.html'))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => hit ||
      fetch(e.request).then(res => {
        if (res.ok && url.origin === location.origin) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
        return res;
      }).catch(() => hit)
    )
  );
});
