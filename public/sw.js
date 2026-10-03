// fitin service worker: network first, cache fallback, so the app opens offline
// and always picks up new versions when online.
const CACHE = 'fitin-v3';
const SHELL = ['/', '/index.html', '/css/app.css', '/js/app.js', '/js/store.js', '/js/ui.js', '/js/nutrition.js', '/js/foods.js',
  '/js/exercises.js', '/js/planner.js', '/js/scanner.js', '/js/ai.js', '/js/badges.js', '/js/micros.js', '/js/bmi.js', '/manifest.webmanifest', '/icons/icon.svg', '/icons/icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('/index.html'))),
  );
});
