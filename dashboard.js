// =========================
// CUSTOMER DASHBOARD
// =========================
// Everything here comes from the SAME /api/bookings/mine endpoint
// my-bookings.html already uses — no new backend needed. This page
// just summarizes that same real data differently: stats, the
// soonest upcoming trip, and a condensed recent list.

const welcomeHeading = document.getElementById("welcome-heading");
const nextTripCard = document.getElementById("next-trip-card");
const recentBookingsList = document.getElementById("recent-bookings-list");

function money(kobo) {
    return "₦" + (Number(kobo) / 100).toLocaleString();
}

// travel_date comes back as a full ISO datetime (midnight) — this
// pulls out just the "YYYY-MM-DD" part for a clean string comparison
// against today's own local date.
function dateOnly(isoString) {
    return isoString ? isoString.split("T")[0] : null;
}

async function loadDashboard() {
    if (!getCustomerToken()) {
        window.location.href = "login.html";
        return;
    }

    let user, bookings;
    try {
        [user, bookings] = await Promise.all([
            apiFetch("/api/auth/me", { asCustomer: true }),
            apiFetch("/api/bookings/mine", { asCustomer: true })
        ]);
    } catch (err) {
        window.location.href = "login.html";
        return;
    }

    if (welcomeHeading) {
        welcomeHeading.textContent = `Welcome back, ${user.name ? user.name.split(" ")[0] : "there"}`;
    }

    const today = getLocalDateString();

    const upcomingTrips = bookings.filter(b =>
        b.type === "passenger" && b.status === "confirmed" && dateOnly(b.travel_date) >= today
    );
    const tripsTaken = bookings.filter(b =>
        b.type === "passenger" && b.status === "confirmed" && dateOnly(b.travel_date) < today
    );
    const activeParcels = bookings.filter(b => b.type === "parcel" && b.status === "confirmed");

    document.getElementById("stat-upcoming").textContent = upcomingTrips.length;
    document.getElementById("stat-taken").textContent = tripsTaken.length;
    document.getElementById("stat-parcels").textContent = activeParcels.length;

    renderNextTrip(upcomingTrips);
    renderRecentBookings(bookings.slice(0, 5));
}

function renderNextTrip(upcomingTrips) {
    if (upcomingTrips.length === 0) {
        nextTripCard.innerHTML = `
            <div class="dashboard-empty">
                No upcoming trips yet.
                <a href="book_a_trip.html">Book one now →</a>
            </div>
        `;
        return;
    }

    // Soonest by date, then by departure time on that same date.
    const sorted = [...upcomingTrips].sort((a, b) => {
        const dateCompare = dateOnly(a.travel_date).localeCompare(dateOnly(b.travel_date));
        if (dateCompare !== 0) return dateCompare;
        return (a.departure_time || "").localeCompare(b.departure_time || "");
    });

    const trip = sorted[0];
    const formattedDate = new Date(dateOnly(trip.travel_date) + "T00:00:00").toLocaleDateString("en-GB", {
        weekday: "long", day: "numeric", month: "long"
    });

    nextTripCard.innerHTML = `
        <div class="dashboard-next-trip">
            <div class="dashboard-next-trip-route">
                <h4>${escapeHtml(trip.trip_from)} → ${escapeHtml(trip.trip_to)}</h4>
                <span class="status-badge active">Confirmed</span>
            </div>
            <div class="dashboard-next-trip-details">
                <div><span>Date</span><strong>${formattedDate}</strong></div>
                <div><span>Departure</span><strong>${escapeHtml((trip.departure_time || "").slice(0, 5))}</strong></div>
                <div><span>Seat${(trip.seat_numbers || "").includes(",") ? "s" : ""}</span><strong>${escapeHtml(trip.seat_numbers || "—")}</strong></div>
                <div><span>Reference</span><strong>${escapeHtml(trip.reference)}</strong></div>
            </div>
            <a href="track.html?ref=${encodeURIComponent(trip.reference)}" class="dashboard-track-link">Track this trip →</a>
        </div>
    `;
}

function renderRecentBookings(recent) {
    if (recent.length === 0) {
        recentBookingsList.innerHTML = `
            <div class="dashboard-empty">
                No bookings yet.
                <a href="book_a_trip.html">Get started →</a>
            </div>
        `;
        return;
    }

    recentBookingsList.innerHTML = recent.map(b => {
        const isParcel = b.type === "parcel";
        const route = isParcel
            ? `${escapeHtml(b.from_city)} → ${escapeHtml(b.to_city)}`
            : `${escapeHtml(b.trip_from)} → ${escapeHtml(b.trip_to)}`;

        const statusLabel = b.status.charAt(0).toUpperCase() + b.status.slice(1);
        const statusClass = b.status === "confirmed" ? "active" : "inactive";

        return `
            <a href="track.html?ref=${encodeURIComponent(b.reference)}" class="dashboard-recent-item">
                <div>
                    <strong>${route}</strong>
                    <span>${escapeHtml(b.reference)} · ${isParcel ? "Parcel" : "Passenger"}</span>
                </div>
                <div class="dashboard-recent-right">
                    <span class="status-badge ${statusClass}">${statusLabel}</span>
                    <strong>${money(b.price_kobo)}</strong>
                </div>
            </a>
        `;
    }).join("");
}

loadDashboard();