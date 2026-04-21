const CACHE_NAME = 'samplehunt-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/main.a11ec542.js',
  '/static/css/main.e6c13ad2.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) return response;
        return fetch(event.request);
      })
  );
});