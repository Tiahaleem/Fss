// =========================
// ROUTE SCHEDULE
// =========================
// TEMP DEMO DATA: matches the prices/durations already shown on
// route.html. Once GET /api/routes/:from/:to/schedule exists,
// fetch and render from that instead.

const routeSchedules = {
    "Lagos-Abuja": { price: 24500, duration: "11h 00m", times: ["06:00", "09:30", "13:00", "16:30", "20:00"] },
    "Lagos-Port Harcourt": { price: 22000, duration: "9h 00m", times: ["06:30", "10:00", "14:00", "18:00"] },
    "Lagos-Benin City": { price: 14500, duration: "6h 00m", times: ["07:00", "11:00", "15:00", "19:00"] },
    "Lagos-Enugu": { price: 19500, duration: "9h 00m", times: ["06:00", "10:30", "15:00"] },
    "Lagos-Ibadan": { price: 6500, duration: "2h 30m", times: ["06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"] },
    "Abuja-Lagos": { price: 24500, duration: "11h 00m", times: ["06:00", "09:30", "13:00", "16:30", "20:00"] }
};

const scheduleList = document.getElementById("schedule-list");
const scheduleCount = document.getElementById("schedule-count");

if (scheduleList) {
    const params = new URLSearchParams(window.location.search);
    const from = params.get("from") || "Lagos";
    const to = params.get("to") || "Abuja";

    const route = routeSchedules[`${from}-${to}`];

    if (!route) {
        scheduleList.innerHTML = `
            <div class="schedule-empty">
                No published schedule for ${from} → ${to} yet.
                <a href="route.html">Browse all routes</a>
            </div>
        `;
    } else {
        if (scheduleCount) {
            scheduleCount.textContent =
                `${route.times.length} departures daily · ${route.duration} · from ₦${route.price.toLocaleString()}`;
        }

        scheduleList.innerHTML = route.times.map(time => `
            <div class="schedule-row">
                <div class="schedule-time">
                    <h3>${time}</h3>
                    <span>Departure</span>
                </div>
                <div class="schedule-meta">
                    <span>${route.duration}</span>
                    <span class="schedule-price">₦${route.price.toLocaleString()}</span>
                </div>
                <a href="book_a_trip.html?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&passengers=1" class="schedule-book-btn">
                    Book this trip →
                </a>
            </div>
        `).join("");
    }
}