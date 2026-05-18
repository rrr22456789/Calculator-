/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   service-worker.js — Calc+ PWA Service Worker v5

   KEY FIX: cache.addAll() fails the ENTIRE install
   if even ONE file is 404. This was breaking PWA.
   Now we cache files one-by-one, skipping missing ones.
   SW always installs → Chrome shows Install, not Shortcut.
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

var CACHE_VER = 'calcplus-v5';

/* Critical — must succeed */
var CACHE_MUST = ['./index.html'];

/* Optional — silently skipped if missing */
var CACHE_OPT  = ['./', './btn-images.js', './menifest.json',
                  './icon-192.png', './icon-512.png',
                  './click.mp3', './switch.mp3'];

/* ── INSTALL ── */
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_VER)
      .then(function (cache) {
        /* Cache critical file first */
        return cache.addAll(CACHE_MUST).then(function () {
          /* Cache optional files one-by-one, ignore any 404 */
          return Promise.all(
            CACHE_OPT.map(function (url) {
              return cache.add(url).catch(function () {});
            })
          );
        });
      })
      .then(function () { return self.skipWaiting(); })
  );
});

/* ── ACTIVATE: delete old caches ── */
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(
          keys.filter(function (k) { return k !== CACHE_VER; })
              .map(function (k)   { return caches.delete(k); })
        );
      })
      .then(function () { return self.clients.claim(); })
  );
});

/* ── FETCH: cache-first with background network refresh ── */
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    caches.open(CACHE_VER).then(function (cache) {
      return cache.match(e.request).then(function (cached) {

        var networkFetch = fetch(e.request).then(function (res) {
          if (res && res.status === 200 && res.type !== 'opaque') {
            cache.put(e.request, res.clone());
          }
          return res;
        }).catch(function () {
          if (e.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return new Response('', { status: 503 });
        });

        return cached || networkFetch;
      });
    })
  );
});
