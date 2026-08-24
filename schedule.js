// =========================
// ROUTE SCHEDULE
// =========================
// Price/duration come from the real /api/routes, departure times
// come from the real /api/trips (filtered by from/to/active right
// on the server) — editing either in admin now actually changes
// what a real customer sees here.

const scheduleList = document.getElementById("schedule-list");
const scheduleCount = document.getElementById("schedule-count");

async function loadSchedule() {
    if (!scheduleList) return;

    const params = new URLSearchParams(window.location.search);
    const from = params.get("from") || "Lagos";
    const to = params.get("to") || "Abuja";
    const date = params.get("date") || new Date().toISOString().split("T")[0];

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
                    <h3>${trip.time}</h3>
                    <span>Departure</span>
                </div>
                <div class="schedule-meta">
                    <span>${route.duration}</span>
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