self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Necesario para que sea instalable, incluso si solo hace pass-through
  e.respondWith(fetch(e.request));
});
