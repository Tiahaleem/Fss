// =========================
// SERVICE WORKER
// =========================
// This is what makes the site installable and lets it work at least
// partially offline.
//
// THE RULE THIS FILE FOLLOWS: when you're online, you always get the
// newest version of every page and every script. Saved copies are only
// a safety net for when the network is slow or gone.
//
// (An earlier version showed the saved copy FIRST and fetched the new
// one quietly for next time. After an update that meant new pages
// running old code — for example a fixed Trip Summary still showing
// the old, wrong values. Don't go back to that for scripts.)
//
// Bump CACHE_NAME if you ever need to throw away everyone's saved
// files in one go.
//
// CRITICAL: this never touches anything on a different origin — your
// backend API (bookings, seat availability, live trip data), Google
// Maps, Flutterwave, Paystack, fonts — none of that ever gets
// cached. Caching real-time data would mean showing someone a seat
// as "available" after it's already been booked, which is far worse
// than just not working offline at all.

const CACHE_NAME = "fss-transport-v2";

// If the network hasn't answered a script/stylesheet request after this
// long, use the saved copy instead of leaving the customer waiting
// (the fresh one still arrives in the background for next time).
const SLOW_NETWORK_MS = 4000;

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
        caches.open(CACHE_NAME).then((cache) =>
            // cache:"reload" skips the browser's own saved copies, so an
            // out-of-date file can never be stored in the fresh cache.
            // allSettled: one missing file must not stop the whole
            // service worker from installing.
            Promise.allSettled(
                CORE_ASSETS.map((url) => cache.add(new Request(url, { cache: "reload" })))
            )
        )
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

// A real page load: always ask the server for the latest. Only if the
// network is genuinely down do we fall back to something saved.
async function handleNavigation(request) {
    try {
        return await fetch(request, { cache: "no-cache" });
    } catch (_) {
        const cached = await caches.match(request);
        if (cached) return cached;

        const indexCached = await caches.match("./index.html");
        if (indexCached) return indexCached;

        // Absolute last resort — guarantees a real Response no matter
        // what, since returning undefined here is exactly what throws
        // "Failed to convert value to 'Response'" and breaks the page.
        return new Response(
            "You're offline and this page hasn't been saved for offline use yet.",
            { status: 503, headers: { "Content-Type": "text/plain" } }
        );
    }
}

// Scripts, stylesheets, data files: fresh from the server whenever the
// network is fine (no-cache = "check with the server, don't just trust
// the browser's 10-minute memory"). Saved copy only if the network
// fails, or is slower than SLOW_NETWORK_MS.
function handleCode(request) {
    return new Promise((resolve) => {
        let answered = false;

        const timer = setTimeout(async () => {
            const cached = await caches.match(request);
            if (cached && !answered) {
                answered = true;
                resolve(cached);
            }
        }, SLOW_NETWORK_MS);

        fetch(request, { cache: "no-cache" })
            .then((response) => {
                clearTimeout(timer);

                if (response.ok) {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                }

                if (!answered) {
                    answered = true;
                    resolve(response);
                }
            })
            .catch(async () => {
                clearTimeout(timer);
                if (answered) return;

                answered = true;
                resolve((await caches.match(request)) || Response.error());
            });
    });
}

// Pictures and fonts almost never change, so showing the saved copy
// instantly while refreshing it quietly is the right trade here.
async function handleImage(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    const refresh = fetch(request)
        .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
        })
        .catch(() => null);

    return cached || (await refresh) || Response.error();
}

self.addEventListener("fetch", (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // Only ever handle simple GET requests to THIS SAME site.
    // Everything else (the real backend API, Google Maps, payment
    // providers, POST/PUT/DELETE requests) passes straight through
    // to the network, completely untouched by this cache.
    if (request.method !== "GET" || url.origin !== self.location.origin) {
        return;
    }

    if (request.mode === "navigate") {
        event.respondWith(handleNavigation(request));
        return;
    }

    if (/\.(png|jpe?g|gif|webp|avif|svg|ico|woff2?)$/i.test(url.pathname)) {
        event.respondWith(handleImage(request));
        return;
    }

    event.respondWith(handleCode(request));
});