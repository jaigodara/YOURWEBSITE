// Minimal network-first service worker. Only same-origin GET requests are
// intercepted; failed fetches are handled instead of becoming unhandled rejections.
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch (_) {
    return;
  }

  // Let cross-origin assets (Firebase, fonts, CDN scripts) use the browser's
  // normal network handling. Do not turn their failures into service-worker errors.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request).catch(() => {
      if (request.mode === 'navigate') {
        return new Response(
          '<!doctype html><html lang="hi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>कनेक्शन उपलब्ध नहीं</title><body style="font-family:system-ui;padding:2rem"><h2>इंटरनेट कनेक्शन उपलब्ध नहीं है</h2><p>कृपया कनेक्शन जाँचकर पेज फिर से खोलें।</p></body></html>',
          { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
      return new Response('', { status: 504, statusText: 'Network unavailable' });
    })
  );
});
