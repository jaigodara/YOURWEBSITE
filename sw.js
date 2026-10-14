// Service worker intentionally does not intercept fetch requests.
// The previous network-first handler could generate repeated "Failed to fetch"
// console errors when a request failed. Let the browser handle networking
// normally until a deliberate offline cache strategy is implemented.

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // Remove old caches left by earlier service-worker versions.
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});
