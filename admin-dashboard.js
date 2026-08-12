// =========================
// DASHBOARD OVERVIEW
// =========================
// All numbers here come from the same shared stores the other admin
// pages read/write (see index.js) — nothing hardcoded. If it looks
// wrong, it's because the underlying data is wrong, not because this
// page made something up.

const statRoutes = document.getElementById("stat-routes");
const statTrips = document.getElementById("stat-trips");
const statTerminals = document.getElementById("stat-terminals");
const statBookings = document.getElementById("stat-bookings");
const recentBookingsBody = document.getElementById("recent-bookings-body");

if (statRoutes) {
    const routes = getRoutes();
    const trips = getTrips();
    const terminals = getTerminals();
    const bookings = getBookings();

    statRoutes.textContent = routes.filter(r => r.status === "active").length;
    statTrips.textContent = trips.filter(t => t.status === "active").length;
    statTerminals.textContent = terminals.filter(t => t.status === "active").length;
    statBookings.textContent = bookings.length;

    if (bookings.length === 0) {
        recentBookingsBody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="admin-empty">No bookings yet — they'll show up here as customers pay on the courier and passenger pages.</div>
                </td>
            </tr>
        `;
    } else {
        const recent = [...bookings]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

        recentBookingsBody.innerHTML = recent.map(b => {
            const isParcel = b.type === "parcel";
            const customer = isParcel ? b.senderName : b.passengerName;
            const route = isParcel ? `${b.from} → ${b.to}` : b.route;

            return `
                <tr>
                    <td>${b.reference}</td>
                    <td><span class="status-badge ${isParcel ? "inactive" : "active"}">${isParcel ? "Parcel" : "Passenger"}</span></td>
                    <td>${customer}</td>
                    <td>${route}</td>
                    <td>${b.price}</td>
                </tr>
            `;
        }).join("");
    }
}
