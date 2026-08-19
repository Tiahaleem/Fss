// =========================
// AVAILABLE TRIPS
// =========================
// Renders one card per active trip matching the searched ?from=&to=,
// pulling times from getTrips() and price/duration from getRoutes()
// — both from the shared stores in index.js. This is the connection
// that was missing before: adding/editing a trip or route in admin
// now actually changes what shows here.
//
// "Select Seats" now carries this specific trip's ID forward, so
// select_a_seat.html shows THAT trip's own independent seat
// availability — not a single shared demo seat map for every trip.

const tripsCountEl = document.getElementById("trips-count");
const tripCardsList = document.getElementById("trip-cards-list");

const wifiIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" /><path fill="#81dade" d="M10.225 20.275Q9.5 19.55 9.5 18.5t.725-1.775T12 16t1.775.725t.725 1.775t-.725 1.775T12 21t-1.775-.725M6.35 15.35l-2.1-2.15q1.475-1.475 3.463-2.337T12 10t4.288.875t3.462 2.375l-2.1 2.1q-1.1-1.1-2.55-1.725T12 13t-3.1.625t-2.55 1.725M2.1 11.1L0 9q2.3-2.35 5.375-3.675T12 4t6.625 1.325T24 9l-2.1 2.1q-1.925-1.925-4.462-3.012T12 7T6.563 8.088T2.1 11.1"/></svg>';
const acIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" /><path fill="#81dade" d="M11.5 20q-1.25 0-2.125-.875T8.5 17h2q0 .425.288.713T11.5 18t.713-.288T12.5 17t-.288-.712T11.5 16H2v-2h9.5q1.25 0 2.125.875T14.5 17t-.875 2.125T11.5 20M2 10V8h13.5q.65 0 1.075-.425T17 6.5t-.425-1.075T15.5 5t-1.075.425T14 6.5h-2q0-1.475 1.013-2.488T15.5 3t2.488 1.013T19 6.5t-1.012 2.488T15.5 10zm16.5 8v-2q.65 0 1.075-.425T20 14.5t-.425-1.075T18.5 13H2v-2h16.5q1.475 0 2.488 1.013T22 14.5t-1.012 2.488T18.5 18"/></svg>';
const usbIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" /><path fill="#81dade" d="M10.588 21.413Q10 20.825 10 20q0-.525.275-.975T11 18.3V16H8q-.825 0-1.412-.587T6 14v-2.3q-.45-.225-.725-.675T5 10q0-.825.588-1.413T7 8t1.413.588T9 10q0 .575-.275 1T8 11.7V14h3V6H9l3-4l3 4h-2v8h3v-2h-1V8h4v4h-1v2q0 .825-.587 1.413T16 16h-3v2.3q.475.25.738.7T14 20q0 .825-.587 1.413T12 22t-1.412-.587"/></svg>';
const refreshIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 50 50"><path d="M0 0h50v50H0z" fill="none" /><path fill="#81dade" d="M48.894 15.154L44.959 46H31.668l-3.919-31h16.226l3.207-11.077L49 4.471l-3.077 10.66zM25.87 33s.497-4-6.395-4H8.499c-6.882 0-6.395 4-6.395 4zM2.104 42s-.487 4 6.395 4h10.977c6.892 0 6.395-4 6.395-4zm22.735-2c1.128 0 2.039-1.114 2.039-2.499c0-1.393-.911-2.501-2.039-2.501H3.04C1.917 35 1 36.108 1 37.501C1 38.886 1.917 40 3.04 40z"/></svg>';

if (tripCardsList) {
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
        if (tripsCountEl) tripsCountEl.textContent = `No trips found for ${from} → ${to}`;
        tripCardsList.innerHTML = `
            <div class="admin-empty">
                No trips are currently scheduled on this route.
                <a href="route.html">Browse all routes</a>
            </div>
        `;
    } else {
        if (tripsCountEl) {
            tripsCountEl.textContent = `${trips.length} trip${trips.length === 1 ? "" : "s"} found for ${from} → ${to}`;
        }

        function addMinutesToTime(time, durationText) {
            const [h, m] = time.split(":").map(Number);
            const durationMatch = durationText.match(/(\d+)h\s*(\d+)?m?/);
            const durHours = durationMatch ? Number(durationMatch[1]) : 0;
            const durMinutes = durationMatch && durationMatch[2] ? Number(durationMatch[2]) : 0;

            const totalMinutes = (h * 60 + m + durHours * 60 + durMinutes) % (24 * 60);
            const arriveH = Math.floor(totalMinutes / 60);
            const arriveM = totalMinutes % 60;

            return `${String(arriveH).padStart(2, "0")}:${String(arriveM).padStart(2, "0")}`;
        }

        tripCardsList.innerHTML = trips.map(trip => `
            <div class="trip-card">

                <div class="trip-top">

                    <div class="trip-time">
                        <h3>${trip.time}</h3>
                        <span>${trip.from}</span>
                    </div>

                    <div class="trip-duration">
                        <span>${route.duration}</span>
                        <div class="trip-line"></div>
                        <span class="trip-type">Executive</span>
                    </div>

                    <div class="trip-time">
                        <h3>${addMinutesToTime(trip.time, route.duration)}</h3>
                        <span>${trip.to}</span>
                    </div>

                    <div class="trip-price">
                        <small>From</small>
                        <h3>₦${Number(route.price).toLocaleString()}</h3>
                        <a href="select_a_seat.html?trip=${trip.id}" class="seat-btn">Select Seats →</a>
                    </div>

                </div>

                <div class="trip-bottom">
                    <span>${trip.vehicle} · ${trip.seats} seats</span>
                    <span>${wifiIcon} WiFi</span>
                    <span>${acIcon} Air Conditioning</span>
                    <span>${usbIcon} USB Charging</span>
                    <span>${refreshIcon} Refreshments</span>
                </div>

            </div>
        `).join("");
    }
}