// =========================
// PASSENGER PAYMENT — real Paystack
// =========================
// "Pay" no longer creates a booking directly — it starts a real
// Paystack transaction and sends the customer to Paystack's own
// checkout page. The booking only actually gets created after
// payment-callback.html verifies the payment really succeeded.

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
const travelDate = params.get("date") || new Date().toISOString().split("T")[0];

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
            // Starts a real Paystack transaction — no booking exists
            // yet. Booking details ride along as metadata, which
            // Paystack hands back once payment is verified.
            // TEMP: no travel-date picker exists yet anywhere in the
            // flow, so this defaults to today.
            const result = await apiFetch("/api/payments/initialize-passenger", {
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
                    travelDate
                })
            });

            // Send the customer to Paystack's real checkout page
            window.location.href = result.authorizationUrl;
        } catch (err) {
            // Most likely case: someone else booked this exact seat
            // between when it was held and now (e.g. the 10-minute
            // hold expired while this form was open).
            showToast(err.message);
            if (submitBtn) submitBtn.disabled = false;
        }
    });
}