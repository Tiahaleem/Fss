// =========================
// PASSENGER PAYMENT — real backend
// =========================
// TEMP: still simulates payment succeeding immediately (no
// Paystack/Flutterwave yet — same honest gap as before), but
// everything AFTER "payment succeeds" is now completely real: the
// seat gets permanently booked, the booking is saved to Supabase,
// and starter tracking events are created — all in one database
// transaction handled server-side by POST /api/bookings/passenger.

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

const params = new URLSearchParams(window.location.search);
const tripId = params.get("trip");
const seatNumbers = (params.get("seats") || "").split(",").filter(Boolean);
const terminalId = params.get("terminal");

let currentTrip = null;
let currentRoute = null;
let currentTerminal = null;

async function loadBookingSummary() {
    if (!tripId || seatNumbers.length === 0 || !terminalId) {
        showToast("Missing booking details — please start over from Book a Trip.");
        return;
    }

    try {
        const [trip, allRoutes, terminal] = await Promise.all([
            apiFetch(`/api/trips/${tripId}`),
            apiFetch("/api/routes"),
            apiFetch(`/api/terminals/${terminalId}`)
        ]);

        currentTrip = trip;
        currentTerminal = terminal;
        currentRoute = allRoutes.find(r =>
            r.from.toLowerCase() === trip.from.toLowerCase() &&
            r.to.toLowerCase() === trip.to.toLowerCase()
        );

        if (!currentRoute) {
            showToast("Couldn't find pricing for this trip.");
            return;
        }

        const arrival = addMinutesToTime(trip.time, currentRoute.duration);
        const totalPrice = Number(currentRoute.price) * seatNumbers.length;
        const priceText = `₦${totalPrice.toLocaleString()}`;

        const routeField = document.querySelector('[data-field="route"]');
        const departureField = document.querySelector('[data-field="departure"]');
        const arrivalField = document.querySelector('[data-field="arrival"]');
        const vehicleField = document.querySelector('[data-field="vehicle"]');
        const payAmountField = document.querySelector('[data-field="pay-amount"]');
        const totalAmountField = document.querySelector('[data-field="total-amount"]');
        const seatField = document.querySelector('[data-field="seat"]');
        const pickupField = document.querySelector('[data-field="pickup"]');

        if (routeField) routeField.textContent = `${trip.from} → ${trip.to}`;
        if (departureField) departureField.textContent = trip.time;
        if (arrivalField) arrivalField.textContent = arrival;
        if (vehicleField) vehicleField.textContent = trip.vehicle;
        if (payAmountField) payAmountField.textContent = priceText;
        if (totalAmountField) totalAmountField.textContent = priceText;
        if (seatField) seatField.textContent = seatNumbers.join(', ');
        if (pickupField) pickupField.textContent = terminal.name;
    } catch (err) {
        showToast(err.message);
    }
}

loadBookingSummary();

const passengerForm = document.getElementById("passenger-form");

if (passengerForm) {
    const paymentFormView = document.getElementById("payment-form-view");
    const paymentConfirmationView = document.getElementById("payment-confirmation-view");
    const generatedBookingCode = document.getElementById("generated-booking-code");
    const trackTripBtn = document.getElementById("track-trip-btn");

    const nameField = document.getElementById("passenger-name");
    const emailField = document.getElementById("passenger-email");
    const phoneField = document.getElementById("passenger-phone");

    passengerForm.addEventListener("submit", async (e) => {
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

        const submitBtn = passengerForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        try {
            // One real API call does everything: finalizes the seat as
            // booked, saves the booking, and creates the starter
            // tracking events — all as one transaction on the server.
            // TEMP: no travel-date picker exists yet anywhere in the
            // flow, so this defaults to today.
            const result = await apiFetch("/api/bookings/passenger", {
                method: "POST",
                asCustomer: true,
                body: JSON.stringify({
                    tripId,
                    terminalId,
                    seatNumbers,
                    sessionId: getTabSessionId(),
                    passengerName: nameField.value.trim(),
                    passengerEmail: emailField.value.trim(),
                    passengerPhone: phoneField.value.trim(),
                    travelDate: new Date().toISOString().split("T")[0]
                })
            });

            generatedBookingCode.textContent = result.reference;
            trackTripBtn.href = `track.html?ref=${encodeURIComponent(result.reference)}`;

            paymentFormView.style.display = "none";
            paymentConfirmationView.style.display = "block";

            showToast("Payment received — here's your booking reference.", "success");
        } catch (err) {
            // Most likely case: someone else booked this exact seat
            // between when it was held and now (e.g. the 10-minute
            // hold expired while this form was open).
            showToast(err.message);
            if (submitBtn) submitBtn.disabled = false;
        }
    });
}