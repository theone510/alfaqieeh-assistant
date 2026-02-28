const CACHE_NAME = 'faqih-assistant-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  // Bypass for non-GET requests
  if (event.request.method !== 'GET') return;

  // Bypass for Vite dev server and extensions
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/@vite/') ||
    url.pathname.startsWith('/@fs/') ||
    url.protocol === 'chrome-extension:') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if found
        if (response) return response;

        // Otherwise, fetch from network
        return fetch(event.request).catch(error => {
          console.error('Fetch failed:', error);
          throw error;
        });
      })
  );
});