/* ============================================================
   RAPID APPROACH (Remedies Finder) — sw.js
   Service Worker: App ko OFFLINE banane wala jaadu
   ============================================================ */

/* ---------- 1. CACHE VERSION ----------
   Jab bhi app update karein (nayi medicines waghera),
   sirf "v1" ko "v2" kar dein — sab users ko nayi cheez mil jayegi! */
const CACHE_NAME = "ra-remedies-v1";

/* ---------- 2. CORE FILES (App chalane ke liye zaroori) ---------- */
const CORE_FILES = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/search.js",
  "./js/ui.js",
  "./js/app.js",
  "./data/data.json",
  "./manifest.json",
  "./icons/icon.svg"
];

/* ---------- 3. INSTALL: Sab zaroori files pehli baar cache mein save ---------- */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_FILES))
      .then(() => self.skipWaiting())
  );
});

/* ---------- 4. ACTIVATE: Purane version ke caches saaf karo ---------- */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* ---------- 5. FETCH: Pehle cache se (foran), background mein update ----------
   - Online: Purana foran dikhta hai, naya background mein aa jata hai
   - Offline: Cache se sab kuch chalta rehta hai — internet ki zaroorat nahi! */
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) =>
              cache.put(event.request, clone)
            );
          }
          return response;
        })
        .catch(() => cached); // Internet nahi → cache se do

      return cached || fetchPromise;
    })
  );
});
