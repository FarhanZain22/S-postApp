const CACHE_NAME = 'workbox-precache-v2';
const PRECACHE_RESOURCES = [
  '/',
  '/index.html',
  '/offline.html',
  '/app.bundle.js',
  '/app.css', // pastikan ini sesuai output Webpack
  '/app.bundle.js', // sesuaikan dengan nama bundle hasil Webpack
];
// Saat install, precache resource yang penting
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      for (const resource of PRECACHE_RESOURCES) {
        try {
          const response = await fetch(resource);
          if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
          await cache.put(resource, response.clone());
          console.log(`[SW] Cached: ${resource}`);
        } catch (err) {
          console.error(`[SW] Gagal caching: ${resource}`, err);
        }
      }
    })(),
  );
});

// Saat aktivasi, hapus cache lama
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Hapus cache lama:', key);
            return caches.delete(key);
          }
        }),
      );
    })(),
  );
});

// Intercept fetch requests
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).catch(() => {
        // Fallback saat offline
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
      });
    }),
  );
});
