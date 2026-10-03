// =========================
// ROUTE SCHEDULE
// =========================
// Price/duration come from the real /api/routes, departure times
// come from the real /api/trips (filtered by from/to/active right
// on the server) — editing either in admin now actually changes
// what a real customer sees here.

const scheduleList = document.getElementById("schedule-list");
const scheduleCount = document.getElementById("schedule-count");

// Real coordinates for major Nigerian cities — covers essentially
// every city a real intercity transport route would realistically
// connect. If a city isn't in this list, the map just doesn't show
// for that route rather than guessing or breaking.
const NIGERIA_CITY_COORDS = {
    "lagos": [6.5244, 3.3792], "abuja": [9.0765, 7.3986], "ibadan": [7.3775, 3.9470],
    "kano": [12.0022, 8.5920], "port harcourt": [4.8156, 7.0498], "benin city": [6.3350, 5.6037],
    "kaduna": [10.5222, 7.4383], "enugu": [6.5244, 7.5086], "onitsha": [6.1490, 6.7853],
    "warri": [5.5160, 5.7500], "calabar": [4.9757, 8.3417], "uyo": [5.0377, 7.9128],
    "ilorin": [8.4966, 4.5426], "abeokuta": [7.1475, 3.3619], "akure": [7.2571, 5.2058],
    "osogbo": [7.7719, 4.5569], "sokoto": [13.0059, 5.2476], "maiduguri": [11.8333, 13.1500],
    "jos": [9.8965, 8.8583], "owerri": [5.4840, 7.0351], "aba": [5.1066, 7.3667],
    "asaba": [6.2059, 6.7327], "minna": [9.6139, 6.5569], "bauchi": [10.3158, 9.8442],
    "yola": [9.2035, 12.4954], "zaria": [11.0667, 7.7000], "gombe": [10.2897, 11.1673],
    "makurdi": [7.7322, 8.5391], "lokoja": [7.8023, 6.7333], "awka": [6.2120, 7.0742],
    "abakaliki": [6.3249, 8.1137], "umuahia": [5.5250, 7.4951], "ikeja": [6.6018, 3.3515]
};

function getCityCoords(cityName) {
    return NIGERIA_CITY_COORDS[cityName.trim().toLowerCase()] || null;
}

function renderRouteMap(fromCity, toCity) {
    const mapContainer = document.getElementById("route-map");
    if (!mapContainer || typeof L === "undefined") return;

    const fromCoords = getCityCoords(fromCity);
    const toCoords = getCityCoords(toCity);

    // If either city isn't in the lookup, there's nothing accurate
    // to draw — hide the map section rather than guess or show
    // something misleading.
    if (!fromCoords || !toCoords) {
        mapContainer.closest(".route-map-section").style.display = "none";
        return;
    }

    const map = L.map("route-map", { scrollWheelZoom: false });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
    }).addTo(map);

    const fromMarker = L.marker(fromCoords).addTo(map).bindPopup(`<strong>${escapeHtml(fromCity)}</strong> — Departure`);
    const toMarker = L.marker(toCoords).addTo(map).bindPopup(`<strong>${escapeHtml(toCity)}</strong> — Destination`);

    L.polyline([fromCoords, toCoords], {
        color: "#08b6d6",
        weight: 3,
        dashArray: "8, 8"
    }).addTo(map);

    map.fitBounds(L.latLngBounds([fromCoords, toCoords]).pad(0.3));
}

async function loadSchedule() {
    if (!scheduleList) return;

    const params = new URLSearchParams(window.location.search);
    const from = params.get("from") || "Lagos";
    const to = params.get("to") || "Abuja";
    const date = params.get("date") || getLocalDateString();

    renderRouteMap(from, to);

    try {
        const [allRoutes, trips] = await Promise.all([
            apiFetch("/api/routes"),
            apiFetch(`/api/trips?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&status=active`)
        ]);

        const route = allRoutes.find(r =>
            r.from.toLowerCase() === from.toLowerCase() &&
            r.to.toLowerCase() === to.toLowerCase() &&
            r.status === "active"
        );

        const sortedTrips = [...trips].sort((a, b) => a.time.localeCompare(b.time));

        if (!route || sortedTrips.length === 0) {
            scheduleList.innerHTML = `
                <div class="schedule-empty">
                    No published schedule for ${from} → ${to} yet.
                    <a href="route.html">Browse all routes</a>
                </div>
            `;
            return;
        }

        if (scheduleCount) {
            scheduleCount.textContent =
                `${sortedTrips.length} departures daily · ${route.duration} · from ₦${Number(route.price).toLocaleString()}`;
        }

        scheduleList.innerHTML = sortedTrips.map(trip => `
            <div class="schedule-row">
                <div class="schedule-time">
                    <h3>${escapeHtml(trip.time)}</h3>
                    <span>Departure</span>
                </div>
                <div class="schedule-meta">
                    <span>${escapeHtml(route.duration)}</span>
                    <span class="schedule-price">₦${Number(route.price).toLocaleString()}</span>
                </div>
                <a href="book_a_trip.html?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&passengers=1&date=${date}" class="schedule-book-btn">
                    Book this trip →
                </a>
            </div>
        `).join("");
    } catch (err) {
        scheduleList.innerHTML = `
            <div class="schedule-empty">Couldn't load the schedule right now. Please try again shortly.</div>
        `;
    }
}

loadSchedule();