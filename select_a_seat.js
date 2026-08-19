// =========================
// SEAT SELECTION — per-trip, hold-based
// =========================
// Reads ?trip=ID from the URL and operates ONLY on that trip's own
// seat holds (getActiveSeatHoldsForTrip/saveSeatHoldsForTrip in
// index.js) — booking seat 3 on trip A has zero effect on seat 3 for
// trip B, same as two different showings at a cinema. Falls back to
// trip 1 (the demo 06:00 Lagos→Abuja trip) if no ID is in the URL,
// so a direct visit to this page still shows something sensible.

const seatMap = document.querySelector('.seat-map');
const selectedSeatText = document.getElementById('selected-seat');
const continueBtn = document.querySelector('.continue-btn');
const pickupSelect = document.getElementById('pickup-center');
const holdTimerRow = document.getElementById('hold-timer-row');
const holdTimerText = document.getElementById('hold-timer-text');

// Elements on the seat-hero + summary card that show which trip
// this actually is — updated below instead of staying hardcoded.
const heroHeading = document.querySelector('.seat-hero h1');
const heroSubtitle = document.querySelector('.seat-hero p');
const summaryRoute = document.querySelector('.summary-row:nth-child(1) strong');
const summaryDate = document.querySelector('.summary-row:nth-child(2) strong');
const summaryDeparture = document.querySelector('.summary-row:nth-child(3) strong');
const summaryArrival = document.querySelector('.summary-row:nth-child(4) strong');

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

if (seatMap && continueBtn) {

    const params = new URLSearchParams(window.location.search);
    const tripId = params.get('trip') || '1';

    const trip = getTrips().find(t => String(t.id) === String(tripId));
    const route = trip ? getRoutes().find(r =>
        r.from.toLowerCase() === trip.from.toLowerCase() &&
        r.to.toLowerCase() === trip.to.toLowerCase()
    ) : null;

    // Show this specific trip's real details instead of the old
    // hardcoded "Lagos → Abuja · 06:00 → 17:00" text
    if (trip && route) {
        const arrival = addMinutesToTime(trip.time, route.duration);

        if (heroHeading) heroHeading.textContent = `${trip.from} → ${trip.to}`;
        if (heroSubtitle) {
            heroSubtitle.textContent = `${trip.time} → ${arrival} (${route.duration}) · ${trip.vehicle}`;
        }
        if (summaryRoute) summaryRoute.textContent = `${trip.from} → ${trip.to}`;
        if (summaryDeparture) summaryDeparture.textContent = trip.time;
        if (summaryArrival) summaryArrival.textContent = arrival;
    }

    const tabId = getTabSessionId();
    let countdownInterval = null;

    function seatButtons() {
        return Array.from(seatMap.querySelectorAll('.seat:not(.driver)'));
    }

    function releaseMyHold(holds) {
        Object.keys(holds).forEach(seatNum => {
            if (holds[seatNum].status === 'held' && holds[seatNum].heldBy === tabId) {
                delete holds[seatNum];
            }
        });
    }

    function startCountdown(expiresAt) {
        clearInterval(countdownInterval);

        countdownInterval = setInterval(() => {
            const msLeft = new Date(expiresAt).getTime() - Date.now();

            if (msLeft <= 0) {
                clearInterval(countdownInterval);
                renderSeats();
                return;
            }

            const totalSeconds = Math.floor(msLeft / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;

            if (holdTimerText) {
                holdTimerText.textContent = `Seat held for ${minutes}:${String(seconds).padStart(2, '0')}`;
            }
        }, 1000);
    }

    function renderSeats() {
        const holds = getActiveSeatHoldsForTrip(tripId);

        seatButtons().forEach(btn => {
            const seatNum = btn.textContent.trim();
            const hold = holds[seatNum];

            btn.classList.remove('selected', 'occupied');
            btn.disabled = false;
            btn.removeAttribute('aria-label');

            if (!hold) {
                return;
            }

            if (hold.status === 'booked') {
                btn.classList.add('occupied');
                btn.disabled = true;
                btn.setAttribute('aria-label', `Seat ${seatNum}, booked`);
            } else if (hold.status === 'held' && hold.heldBy === tabId) {
                btn.classList.add('selected');
                if (selectedSeatText) selectedSeatText.textContent = seatNum;
                continueBtn.disabled = false;
                if (holdTimerRow) holdTimerRow.style.display = 'flex';
                startCountdown(hold.expiresAt);
            } else if (hold.status === 'held') {
                // Held by a different tab (or a different customer on
                // this same trip) — temporarily unavailable
                btn.classList.add('occupied');
                btn.disabled = true;
                btn.setAttribute('aria-label', `Seat ${seatNum}, temporarily held by another customer`);
            }
        });
    }

    seatMap.addEventListener('click', (e) => {
        const seat = e.target.closest('.seat');
        if (!seat || seat.classList.contains('driver') || seat.classList.contains('occupied') || seat.disabled) return;

        const seatNum = seat.textContent.trim();
        const holds = getActiveSeatHoldsForTrip(tripId);

        // Release whatever this tab was previously holding on THIS
        // trip — only one seat per session per trip
        releaseMyHold(holds);

        const expiresAt = new Date(Date.now() + SEAT_HOLD_MINUTES * 60 * 1000).toISOString();
        holds[seatNum] = { status: 'held', heldBy: tabId, expiresAt };

        saveSeatHoldsForTrip(tripId, holds);
        renderSeats();
    });

    continueBtn.addEventListener('click', () => {
        const holds = getActiveSeatHoldsForTrip(tripId);
        const mySeat = Object.keys(holds).find(seatNum =>
            holds[seatNum].status === 'held' && holds[seatNum].heldBy === tabId
        );

        if (!mySeat) {
            showToast('Please select a seat first.');
            return;
        }

        // The hold stays "held" (not yet booked) through checkout —
        // passenger_detail.js finalizes it to "booked" only once
        // payment actually succeeds. If the customer abandons
        // checkout, the hold simply expires on its own.
        const searchParams = new URLSearchParams({
            trip: tripId,
            seat: mySeat,
            pickup: pickupSelect ? pickupSelect.value : ''
        });

        window.location.href = `passenger_detail.html?${searchParams.toString()}`;
    });

    continueBtn.disabled = true;
    renderSeats();
}