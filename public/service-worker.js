// public/service-worker.js - Lightweight version for Talk It Through
const CACHE_NAME = 'talk-it-through-v1';

self.addEventListener('install', (event) => {
  console.log('✅ Talk It Through SW installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ Talk It Through SW activated');
  event.waitUntil(self.clients.claim());
});

// Basic cache-first for offline support
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        return cachedResponse || fetch(event.request);
      })
  );
});