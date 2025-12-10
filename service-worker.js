const CACHE_NAME = 'butane-pwa-v2';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './service-worker.js'
];

self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (evt) => {
  if (evt.request.method !== 'GET') return;

  evt.respondWith(
    caches.match(evt.request).then((cached) => {
      return (
        cached ||
        fetch(evt.request)
          .then((resp) => {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(evt.request, resp.clone());
              return resp;
            });
          })
          .catch(() => caches.match('./index.html'))
      );
    })
  );
});
