// =========================
// ADD BOOKING (admin) — manual/phone bookings
// =========================
// Creates real bookings directly, no payment gate — for phone or
// walk-in customers where payment happens some other way (cash,
// bank transfer, etc.). Uses the exact same admin-only endpoints
// that were already built and tested throughout today's work.

// ---- Tab switching ----
document.querySelectorAll(".booking-type-tab").forEach(tab => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".booking-type-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        document.getElementById("passenger-tab").style.display = tab.dataset.tab === "passenger" ? "block" : "none";
        document.getElementById("parcel-tab").style.display = tab.dataset.tab === "parcel" ? "block" : "none";
    });
});

// =========================
// PASSENGER BOOKING
// =========================

const tripSelect = document.getElementById("pb-trip");
const dateInput = document.getElementById("pb-date");
const seatPicker = document.getElementById("pb-seat-picker");
const seatHint = document.getElementById("pb-seat-hint");
const terminalSelect = document.getElementById("pb-terminal");
const totalRow = document.getElementById("pb-total-row");
const totalEl = document.getElementById("pb-total");
const passengerForm = document.getElementById("admin-passenger-form");

let allTrips = [];
let allRoutes = [];
let selectedSeats = [];
let currentTripPrice = 0;

dateInput.value = new Date().toISOString().split("T")[0];

async function loadTripsForDropdown() {
    try {
        [allTrips, allRoutes] = await Promise.all([
            apiFetch("/api/trips?status=active"),
            apiFetch("/api/routes")
        ]);

        if (allTrips.length === 0) {
            tripSelect.innerHTML = `<option value="">No active trips exist yet</option>`;
            return;
        }

        tripSelect.innerHTML = allTrips
            .map(t => `<option value="${t.id}">${t.from} → ${t.to} · ${t.time}</option>`)
            .join("");

        loadSeatsForSelection();
    } catch (err) {
        tripSelect.innerHTML = `<option value="">Couldn't load trips</option>`;
        showToast(err.message);
    }
}

async function loadTerminalsForTrip(tripId) {
    const trip = allTrips.find(t => t.id === tripId);
    if (!trip) return;

    try {
        const terminals = await apiFetch(`/api/terminals?city=${encodeURIComponent(trip.from)}&status=active`);

        terminalSelect.innerHTML = terminals.length === 0
            ? `<option value="">No terminals set up for ${trip.from} yet</option>`
            : terminals.map(t => `<option value="${t.id}">${t.name}</option>`).join("");
    } catch (err) {
        terminalSelect.innerHTML = `<option value="">Couldn't load terminals</option>`;
    }
}

function updateTotal() {
    if (selectedSeats.length === 0) {
        totalRow.style.display = "none";
        return;
    }

    totalRow.style.display = "flex";
    totalEl.textContent = `₦${(currentTripPrice * selectedSeats.length).toLocaleString()}`;
}

async function loadSeatsForSelection() {
    const tripId = tripSelect.value;
    const date = dateInput.value;

    selectedSeats = [];
    updateTotal();

    if (!tripId || !date) return;

    const trip = allTrips.find(t => t.id === tripId);
    if (!trip) return;

    const route = allRoutes.find(r =>
        r.from.toLowerCase() === trip.from.toLowerCase() && r.to.toLowerCase() === trip.to.toLowerCase()
    );
    currentTripPrice = route ? Number(route.price) : 0;

    loadTerminalsForTrip(tripId);

    try {
        const seatStates = await apiFetch(`/api/trips/${tripId}/seats?date=${encodeURIComponent(date)}`);
        const takenSeats = new Set(seatStates.map(s => s.seatNumber));

        seatHint.textContent = `(${trip.seats - takenSeats.size} of ${trip.seats} available)`;

        const seatNumbers = Array.from({ length: trip.seats - 1 }, (_, i) => String(i + 2)); // seat 1 is always the driver

        seatPicker.innerHTML = seatNumbers.map(num => `
            <button type="button" class="admin-seat-btn" data-seat="${num}" ${takenSeats.has(num) ? "disabled" : ""}>
                ${num}
            </button>
        `).join("");
    } catch (err) {
        seatPicker.innerHTML = `<p class="admin-empty">Couldn't load seat availability.</p>`;
        showToast(err.message);
    }
}

tripSelect.addEventListener("change", loadSeatsForSelection);
dateInput.addEventListener("change", loadSeatsForSelection);

seatPicker.addEventListener("click", (e) => {
    const btn = e.target.closest(".admin-seat-btn");
    if (!btn || btn.disabled) return;

    const seatNum = btn.dataset.seat;

    if (selectedSeats.includes(seatNum)) {
        selectedSeats = selectedSeats.filter(s => s !== seatNum);
        btn.classList.remove("selected");
    } else {
        selectedSeats.push(seatNum);
        btn.classList.add("selected");
    }

    updateTotal();
});

passengerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("pb-name").value.trim();
    const phone = document.getElementById("pb-phone").value.trim();
    const email = document.getElementById("pb-email").value.trim();

    if (!tripSelect.value || !dateInput.value || !terminalSelect.value || !name || !phone || !email) {
        showToast("Please fill in every field.");
        return;
    }

    if (selectedSeats.length === 0) {
        showToast("Please select at least one seat.");
        return;
    }

    const submitBtn = passengerForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
        const result = await apiFetch("/api/bookings/passenger", {
            method: "POST",
            body: JSON.stringify({
                tripId: tripSelect.value,
                terminalId: terminalSelect.value,
                seatNumbers: selectedSeats,
                passengerName: name,
                passengerPhone: phone,
                passengerEmail: email,
                travelDate: dateInput.value
            })
        });

        showToast(`Booking created — ${result.reference}`, "success");
        passengerForm.reset();
        dateInput.value = new Date().toISOString().split("T")[0];
        loadSeatsForSelection();
    } catch (err) {
        showToast(err.message);
    } finally {
        submitBtn.disabled = false;
    }
});

// =========================
// PARCEL BOOKING
// =========================

const parcelForm = document.getElementById("admin-parcel-form");

parcelForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fromCity = document.getElementById("pcl-from").value.trim();
    const toCity = document.getElementById("pcl-to").value.trim();
    const senderName = document.getElementById("pcl-sender-name").value.trim();
    const senderPhone = document.getElementById("pcl-sender-phone").value.trim();
    const senderEmail = document.getElementById("pcl-sender-email").value.trim();
    const receiverName = document.getElementById("pcl-receiver-name").value.trim();
    const receiverPhone = document.getElementById("pcl-receiver-phone").value.trim();
    const description = document.getElementById("pcl-description").value.trim();
    const weight = document.getElementById("pcl-weight").value;
    const declaredValue = document.getElementById("pcl-declared-value").value;
    const price = document.getElementById("pcl-price").value;

    if (!fromCity || !toCity || !senderName || !senderPhone || !senderEmail || !receiverName || !receiverPhone || !description || !weight || !price) {
        showToast("Please fill in every required field.");
        return;
    }

    const submitBtn = parcelForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
        const result = await apiFetch("/api/bookings/parcel", {
            method: "POST",
            body: JSON.stringify({
                fromCity, toCity, senderName, senderPhone, senderEmail,
                receiverName, receiverPhone, description,
                weightKg: Number(weight),
                declaredValueKobo: Math.round(Number(declaredValue || 0) * 100),
                priceKobo: Math.round(Number(price) * 100)
            })
        });

        showToast(`Booking created — ${result.reference}`, "success");
        parcelForm.reset();
    } catch (err) {
        showToast(err.message);
    } finally {
        submitBtn.disabled = false;
    }
});

loadTripsForDropdown();