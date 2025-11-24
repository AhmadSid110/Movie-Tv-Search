const CACHE_NAME = 'rankedstream-v1';
const ASSETS_TO_CACHE = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(ASSETS_TO_CACHE);
  })());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request).then((r) => r || fetch(event.request)));
});