/**
 * Service Worker —— 提供离线访问能力
 * 采用"缓存优先，网络兜底"策略，首次访问后即可离线使用。
 */
const CACHE_NAME = "medguide-v4";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.svg",
  "./css/style.css",
  "./js/data/medicines.js",
  "./js/data/symptoms.js",
  "./js/data/diagnoses.js",
  "./js/data/interactions.js",
  "./js/engine/dialog.js",
  "./js/engine/safety.js",
  "./js/engine/recommend.js",
  "./js/ui/components.js",
  "./js/ui/render.js",
  "./js/app.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
