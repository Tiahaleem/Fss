// =========================
// ROUTE SCHEDULE
// =========================
// Price/duration come from getRoutes(), departure times come from
// getTrips() filtered by this route and active status — both from
// the shared stores in index.js. Editing either in admin now
// actually changes what shows here, instead of this page having its
// own separate copy of the data.

const scheduleList = document.getElementById("schedule-list");
const scheduleCount = document.getElementById("schedule-count");

if (scheduleList) {
    const params = new URLSearchParams(window.location.search);
    const from = params.get("from") || "Lagos";
    const to = params.get("to") || "Abuja";

    const route = getRoutes().find(r =>
        r.from.toLowerCase() === from.toLowerCase() &&
        r.to.toLowerCase() === to.toLowerCase() &&
        r.status === "active"
    );

    const trips = getTrips()
        .filter(t =>
            t.from.toLowerCase() === from.toLowerCase() &&
            t.to.toLowerCase() === to.toLowerCase() &&
            t.status === "active"
        )
        .sort((a, b) => a.time.localeCompare(b.time));

    if (!route || trips.length === 0) {
        scheduleList.innerHTML = `
            <div class="schedule-empty">
                No published schedule for ${from} → ${to} yet.
                <a href="route.html">Browse all routes</a>
            </div>
        `;
    } else {
        if (scheduleCount) {
            scheduleCount.textContent =
                `${trips.length} departures daily · ${route.duration} · from ₦${Number(route.price).toLocaleString()}`;
        }

        scheduleList.innerHTML = trips.map(trip => `
            <div class="schedule-row">
                <div class="schedule-time">
                    <h3>${trip.time}</h3>
                    <span>Departure</span>
                </div>
                <div class="schedule-meta">
                    <span>${route.duration}</span>
                    <span class="schedule-price">₦${Number(route.price).toLocaleString()}</span>
                </div>
                <a href="book_a_trip.html?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&passengers=1" class="schedule-book-btn">
                    Book this trip →
                </a>
            </div>
        `).join("");
    }
}
