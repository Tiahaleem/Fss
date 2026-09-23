// =========================
// SERVICE WORKER
// =========================
// This is what makes the site installable and lets it work at least
// partially offline. Bump CACHE_NAME whenever you want to force
// everyone's cached files to refresh after a real update.
//
// CRITICAL: this never touches anything on a different origin — your
// backend API (bookings, seat availability, live trip data), Google
// Maps, Flutterwave, Paystack, fonts — none of that ever gets
// cached. Caching real-time data would mean showing someone a seat
// as "available" after it's already been booked, which is far worse
// than just not working offline at all.

const CACHE_NAME = "fss-transport-v1";

const CORE_ASSETS = [
    "./index.html",
    "./style.css",
    "./index.js",
    "./api.js",
    "./manifest.json",
    "./img/ffs_bg_removal.png"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((names) =>
            Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)))
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // Only ever handle simple GET requests to THIS SAME site.
    // Everything else (the real backend API, Google Maps, payment
    // providers, POST/PUT/DELETE requests) passes straight through
    // to the network, completely untouched by this cache.
    if (event.request.method !== "GET" || url.origin !== self.location.origin) {
        return;
    }

    // A real page load (clicking a link, typing an address) — try
    // the network first so visitors always get the latest version
    // while online, only falling back to a cached copy if genuinely
    // offline right now.
    if (event.request.mode === "navigate") {
        event.respondWith(
            fetch(event.request).catch(() =>
                caches.match(event.request).then((cached) => cached || caches.match("./index.html"))
            )
        );
        return;
    }

    // Static assets (CSS, JS, images, fonts) — show the cached
    // version instantly if there is one, while quietly fetching a
    // fresh copy in the background for next time.
    event.respondWith(
        caches.match(event.request).then((cached) => {
            const networkFetch = fetch(event.request)
                .then((response) => {
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                    }
                    return response;
                })
                .catch(() => cached);

            return cached || networkFetch;
        })
    );
});