/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   service-worker.js — Calc+ PWA Service Worker
   Bump CACHE_VER when you deploy a new version
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

var CACHE_VER  = 'calcplus-v4';
var CACHE_CORE = [
  './',
  './index.html',
  './btn-images.js',
  './menifest.json',
  './icon-192.png',
  './icon-512.png',
  './click.mp3',
  './switch.mp3'
];

/* ── INSTALL: cache all core assets ── */
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_VER).then(function (cache) {
      return cache.addAll(CACHE_CORE);
    }).then(function () {
      /* Activate immediately without waiting for old tabs to close */
      return self.skipWaiting();
    })
  );
});

/* ── ACTIVATE: delete old caches ── */
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (k) { return k !== CACHE_VER; })
          .map(function (k) { return caches.delete(k); })
      );
    }).then(function () {
      /* Take control of all open clients immediately */
      return self.clients.claim();
    })
  );
});

/* ── FETCH: cache-first for core assets, network-first for rest ── */
self.addEventListener('fetch', function (e) {
  /* Only handle GET requests */
  if (e.request.method !== 'GET') return;

  /* Skip cross-origin requests (e.g. Google Fonts) */
  var url = new URL(e.request.url);
  if (url.origin !== location.origin) {
    /* For Google Fonts — network with no-cors fallback */
    e.respondWith(fetch(e.request).catch(function () {
      return new Response('', { status: 408 });
    }));
    return;
  }

  e.respondWith(
    caches.open(CACHE_VER).then(function (cache) {
      return cache.match(e.request).then(function (cached) {
        if (cached) {
          /* Serve from cache, refresh in background */
          fetch(e.request).then(function (fresh) {
            if (fresh && fresh.status === 200) {
              cache.put(e.request, fresh.clone());
            }
          }).catch(function () {});
          return cached;
        }

        /* Not in cache — fetch from network and cache it */
        return fetch(e.request).then(function (response) {
          if (response && response.status === 200) {
            cache.put(e.request, response.clone());
          }
          return response;
        }).catch(function () {
          /* Offline fallback for HTML pages */
          if (e.request.headers.get('accept') &&
              e.request.headers.get('accept').indexOf('text/html') >= 0) {
            return caches.match('./index.html');
          }
          return new Response('Offline', { status: 503 });
        });
      });
    })
  );
});
