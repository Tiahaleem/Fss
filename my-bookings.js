// =========================
// MY BOOKINGS — real backend
// =========================
// Only shows bookings genuinely tied to this account (owner_id in
// the real database) — not just "anything in this browser". Two
// different devices signed into the same account now see the same
// bookings, which was never possible with the old localStorage version.

const bookingsList = document.getElementById("bookings-list");

async function loadMyBookings() {
    if (!bookingsList) return;

    if (!getCustomerToken()) {
        window.location.href = "login.html";
        return;
    }

    let myBookings;
    try {
        myBookings = await apiFetch("/api/bookings/mine", { asCustomer: true });
    } catch (err) {
        window.location.href = "login.html";
        return;
    }

    if (myBookings.length === 0) {
        bookingsList.innerHTML = `
            <div class="bookings-empty">
                <div class="bookings-empty-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                </div>
                <h3>No bookings yet</h3>
                <p>Trips and parcels you book while signed in will show up here.</p>
                <div class="bookings-empty-actions">
                    <a href="book_a_trip.html" class="primary">Book a Trip</a>
                    <a href="courier.html" class="secondary">Send a Parcel</a>
                </div>
            </div>
        `;
        return;
    }

    const busIcon = '<rect x="3" y="6" width="18" height="10" rx="2"></rect><circle cx="7.5" cy="19" r="1.5"></circle><circle cx="16.5" cy="19" r="1.5"></circle><path d="M3 11h18"></path>';
    const packageIcon = '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"></path><path d="M12 22V12"></path><polyline points="3.29 7 12 12 20.71 7"></polyline><path d="m7.5 4.27 9 5.15"></path>';

    bookingsList.innerHTML = myBookings.map(b => {
        const isParcel = b.type === "parcel";
        const price = `₦${(Number(b.price_kobo) / 100).toLocaleString()}`;
        const bookedDate = new Date(b.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

        const title = isParcel ? `${b.from_city} → ${b.to_city}` : `${b.trip_from} → ${b.trip_to}`;
        const subtitle = isParcel
            ? `To ${b.receiver_name} · Booked ${bookedDate}`
            : `Seat${b.seat_numbers && b.seat_numbers.includes(',') ? 's' : ''} ${b.seat_numbers} · ${b.pickup_terminal_name} · Booked ${bookedDate}`;

        const statusLabel = b.status.charAt(0).toUpperCase() + b.status.slice(1);
        const canCancel = b.status === "confirmed";

        return `
            <div class="booking-card">

                <div class="booking-card-main">

                    <div class="booking-type-icon ${isParcel ? "parcel" : "passenger"}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${isParcel ? packageIcon : busIcon}</svg>
                    </div>

                    <div class="booking-card-info">
                        <h3>${title}</h3>
                        <p><span class="booking-ref">${b.reference}</span> · ${subtitle}</p>
                        <span class="booking-status-badge ${b.status}">${statusLabel}</span>
                    </div>

                </div>

                <div class="booking-card-right">
                    <span class="booking-price">${price}</span>
                    <a href="track.html?ref=${encodeURIComponent(b.reference)}" class="booking-track-btn">
                        Track →
                    </a>
                    ${canCancel ? `<button type="button" class="booking-cancel-btn" data-cancel="${b.reference}">Cancel</button>` : ""}
                </div>

            </div>
        `;
    }).join("");
}

bookingsList.addEventListener("click", async (e) => {
    const cancelBtn = e.target.closest("[data-cancel]");
    if (!cancelBtn) return;

    const reference = cancelBtn.dataset.cancel;

    if (!confirm(`Cancel booking ${reference}? This can't be undone.`)) {
        return;
    }

    cancelBtn.disabled = true;

    try {
        await apiFetch(`/api/bookings/${reference}/cancel`, {
            method: "POST",
            asCustomer: true
        });

        showToast("Booking cancelled.", "success");
        loadMyBookings();
    } catch (err) {
        showToast(err.message);
        cancelBtn.disabled = false;
    }
});

loadMyBookings();