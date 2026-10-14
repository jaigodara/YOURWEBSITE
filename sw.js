// Service worker intentionally does not intercept fetch requests.
// This avoids unhandled "Failed to fetch" errors from a network-first handler.
// The browser handles all requests normally until an offline cache strategy
// is deliberately implemented.

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
