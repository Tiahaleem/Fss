// =========================
// PASSENGER PAYMENT (demo)
// =========================
// TEMP DEMO: this simulates a successful payment client-side and
// generates a booking reference locally. Once Paystack/Flutterwave
// is wired up, the real flow is: hand off to their SDK first, and
// only run the "success" block below once their webhook/callback
// confirms payment actually went through — never before.

function generateBookingCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "FSS-";

    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return code;
}

const passengerForm = document.getElementById("passenger-form");

if (passengerForm) {
    const paymentFormView = document.getElementById("payment-form-view");
    const paymentConfirmationView = document.getElementById("payment-confirmation-view");
    const generatedBookingCode = document.getElementById("generated-booking-code");
    const trackTripBtn = document.getElementById("track-trip-btn");

    const nameField = document.getElementById("passenger-name");
    const emailField = document.getElementById("passenger-email");
    const phoneField = document.getElementById("passenger-phone");

    // Pull the seat/pickup this page already displays (see index.js's
    // passenger summary block) so the starter tracking event matches
    // what the customer actually booked, not hardcoded values.
    const seatField = document.querySelector('[data-field="seat"]');
    const pickupField = document.querySelector('[data-field="pickup"]');

    passengerForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (
            nameField.value.trim() === "" ||
            emailField.value.trim() === "" ||
            phoneField.value.trim() === ""
        ) {
            showToast("Please fill in your name, email, and phone.");
            return;
        }

        if (!emailPattern.test(emailField.value.trim())) {
            showToast("Please enter a valid email address.");
            return;
        }

        const bookingCode = generateBookingCode();

        // Finalize the seat hold from select_a_seat.js into a
        // permanent booking, right at the moment payment succeeds —
        // not before. If the customer had abandoned checkout instead
        // of reaching this point, the hold would have simply expired
        // on its own and the seat would already be available again.
        const seatNumber = seatField ? seatField.textContent.trim() : "";
        if (seatNumber) {
            const holds = getSeatHolds();
            holds[seatNumber] = { status: "booked" };
            saveSeatHolds(holds);
        }
        const pickup = pickupField ? pickupField.textContent.trim() : "Jibowu Terminal";

        // Booking details — lighter than the parcel version (no
        // separate "recipient" for a bus trip), but enough for
        // support to reach the passenger if a trip is delayed.
        const bookings = getBookings();
        bookings.push({
            reference: bookingCode,
            type: "passenger",
            ownerEmail: getCurrentUser() ? getCurrentUser().email : null,
            passengerName: nameField.value.trim(),
            passengerEmail: emailField.value.trim(),
            passengerPhone: phoneField.value.trim(),
            route: "Lagos → Abuja",
            pickup: pickup,
            seat: seatField ? seatField.textContent.trim() : "",
            price: "₦24,500",
            createdAt: new Date().toISOString()
        });
        saveBookings(bookings);

        // Seed the starter tracking events for this booking, so the
        // admin panel sees it immediately and can add more progress
        // events (departed, checkpoint, arrived) from there.
        const allEvents = getTrackingEvents();

        allEvents.push({
            id: Date.now(),
            reference: bookingCode,
            order: 1,
            title: "Booking confirmed",
            time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            status: "completed",
            icon: "boarding"
        });

        allEvents.push({
            id: Date.now() + 1,
            reference: bookingCode,
            order: 2,
            title: `Awaiting boarding at ${pickup}`,
            time: "06:00",
            status: "active",
            icon: "location"
        });

        saveTrackingEvents(allEvents);

        generatedBookingCode.textContent = bookingCode;
        trackTripBtn.href = `track.html?ref=${encodeURIComponent(bookingCode)}`;

        paymentFormView.style.display = "none";
        paymentConfirmationView.style.display = "block";

        showToast("Payment received — here's your booking reference.", "success");
    });
}