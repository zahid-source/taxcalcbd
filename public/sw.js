/*
 * Minimal offline shell. The build hashes its own asset names, so anything
 * fetched successfully is cached and served again when the network is gone.
 */
const CACHE = 'taxcalc-v2';
/* on a dev server the assets are rebuilt constantly, so nothing is cached there */
const DEV = ['localhost', '127.0.0.1'].includes(self.location.hostname);
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icons/icon-192.png'];

self.addEventListener('install', event => {
  if (DEV) return void self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (DEV) return;
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return;

  // navigations: network first, so a new build is picked up straight away
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match('/index.html').then(hit => hit || caches.match('/')))
    );
    return;
  }

  // assets: cache first, they carry a content hash in the name
  event.respondWith(
    caches.match(request).then(hit => hit || fetch(request).then(response => {
      if (response.ok && response.type === 'basic') {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(request, copy));
      }
      return response;
    }))
  );
});
