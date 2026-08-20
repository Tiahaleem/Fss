// =========================
// SEAT SELECTION — real backend, multi-seat
// =========================
// Reads ?trip=ID&passengers=N from the URL. Lets the customer select
// up to N seats (matching what they searched for on the homepage),
// each one a real hold via the API. Continuing requires exactly N
// seats selected — matches the group up with what they're actually
// paying for.

const seatMap = document.querySelector('.seat-map');
const selectedSeatText = document.getElementById('selected-seat');
const continueBtn = document.querySelector('.continue-btn');
const pickupSelect = document.getElementById('pickup-center');
const holdTimerRow = document.getElementById('hold-timer-row');
const holdTimerText = document.getElementById('hold-timer-text');
const seatLimitText = document.getElementById('seat-limit-text');

const heroHeading = document.querySelector('.seat-hero h1');
const heroSubtitle = document.querySelector('.seat-hero p');
const summaryRoute = document.querySelector('.summary-row:nth-child(1) strong');
const summaryDeparture = document.querySelector('.summary-row:nth-child(3) strong');
const summaryArrival = document.querySelector('.summary-row:nth-child(4) strong');
const summaryTotal = document.querySelector('[data-field="seat-total"]');

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

    const urlParams = new URLSearchParams(window.location.search);
    const tripId = urlParams.get('trip');
    const seatLimit = Math.max(1, Number(urlParams.get('passengers')) || 1);
    const tabId = getTabSessionId();

    let countdownInterval = null;
    let currentRoute = null;

    if (seatLimitText) {
        seatLimitText.textContent = seatLimit === 1 ? "Select 1 seat" : `Select ${seatLimit} seats`;
    }

    function seatButtons() {
        return Array.from(seatMap.querySelectorAll('.seat:not(.driver)'));
    }

    function mySelectedSeats() {
        return seatButtons().filter(b => b.classList.contains('selected')).map(b => b.textContent.trim());
    }

    async function loadTripDetails() {
        if (!tripId) {
            showToast("No trip specified.");
            return;
        }

        try {
            const [trip, allRoutes] = await Promise.all([
                apiFetch(`/api/trips/${tripId}`),
                apiFetch("/api/routes")
            ]);

            currentRoute = allRoutes.find(r =>
                r.from.toLowerCase() === trip.from.toLowerCase() &&
                r.to.toLowerCase() === trip.to.toLowerCase()
            );

            if (currentRoute) {
                const arrival = addMinutesToTime(trip.time, currentRoute.duration);

                if (heroHeading) heroHeading.textContent = `${trip.from} → ${trip.to}`;
                if (heroSubtitle) heroSubtitle.textContent = `${trip.time} → ${arrival} (${currentRoute.duration}) · ${trip.vehicle}`;
                if (summaryRoute) summaryRoute.textContent = `${trip.from} → ${trip.to}`;
                if (summaryDeparture) summaryDeparture.textContent = trip.time;
                if (summaryArrival) summaryArrival.textContent = arrival;
            }

            const terminals = await apiFetch(`/api/terminals?city=${encodeURIComponent(trip.from)}&status=active`);

            if (terminals.length === 0) {
                pickupSelect.innerHTML = `<option value="">No pickup centers set up for ${trip.from} yet</option>`;
            } else {
                pickupSelect.innerHTML = terminals.map(t => `<option value="${t.id}">${t.name}</option>`).join("");
            }
        } catch (err) {
            showToast(err.message);
        }
    }

    function updateSummary() {
        const mySeats = mySelectedSeats();

        if (selectedSeatText) {
            selectedSeatText.textContent = mySeats.length > 0 ? mySeats.join(', ') : 'None';
        }

        if (summaryTotal && currentRoute) {
            const total = Number(currentRoute.price) * mySeats.length;
            summaryTotal.textContent = `₦${total.toLocaleString()}`;
        }

        continueBtn.disabled = mySeats.length !== seatLimit;
    }

    // Countdown shows time remaining on whichever of your held seats
    // expires soonest — if any one goes, the whole group needs
    // re-picking, so that's the number that actually matters.
    function startCountdown(expiresAt) {
        clearInterval(countdownInterval);

        countdownInterval = setInterval(() => {
            const msLeft = new Date(expiresAt).getTime() - Date.now();

            if (msLeft <= 0) {
                clearInterval(countdownInterval);
                loadSeats();
                return;
            }

            const totalSeconds = Math.floor(msLeft / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;

            if (holdTimerText) {
                const label = mySelectedSeats().length > 1 ? "Seats held for" : "Seat held for";
                holdTimerText.textContent = `${label} ${minutes}:${String(seconds).padStart(2, '0')}`;
            }
        }, 1000);
    }

    async function loadSeats() {
        try {
            const seatStates = await apiFetch(`/api/trips/${tripId}/seats`);
            const holds = {};
            seatStates.forEach(s => { holds[s.seatNumber] = s; });

            let earliestMyExpiry = null;

            seatButtons().forEach(btn => {
                const seatNum = btn.textContent.trim();
                const hold = holds[seatNum];

                btn.classList.remove('selected', 'occupied');
                btn.disabled = false;
                btn.removeAttribute('aria-label');

                if (!hold) return;

                if (hold.status === 'booked') {
                    btn.classList.add('occupied');
                    btn.disabled = true;
                    btn.setAttribute('aria-label', `Seat ${seatNum}, booked`);
                } else if (hold.status === 'held' && hold.heldBy === tabId) {
                    btn.classList.add('selected');
                    if (!earliestMyExpiry || new Date(hold.expiresAt) < new Date(earliestMyExpiry)) {
                        earliestMyExpiry = hold.expiresAt;
                    }
                } else if (hold.status === 'held') {
                    btn.classList.add('occupied');
                    btn.disabled = true;
                    btn.setAttribute('aria-label', `Seat ${seatNum}, temporarily held by another customer`);
                }
            });

            if (earliestMyExpiry) {
                if (holdTimerRow) holdTimerRow.style.display = 'flex';
                startCountdown(earliestMyExpiry);
            } else {
                if (holdTimerRow) holdTimerRow.style.display = 'none';
                clearInterval(countdownInterval);
            }

            updateSummary();
        } catch (err) {
            showToast(err.message);
        }
    }

    seatMap.addEventListener('click', async (e) => {
        const seat = e.target.closest('.seat');
        if (!seat || seat.classList.contains('driver') || seat.disabled) return;

        const seatNum = seat.textContent.trim();
        const isMine = seat.classList.contains('selected');

        // Clicking one of your own selected seats again releases it
        if (isMine) {
            try {
                await apiFetch(`/api/trips/${tripId}/seats/${seatNum}/hold`, {
                    method: "DELETE",
                    body: JSON.stringify({ sessionId: tabId })
                });
                await loadSeats();
            } catch (err) {
                showToast(err.message);
            }
            return;
        }

        // Someone else's seat (already disabled/occupied) — click does nothing
        if (seat.classList.contains('occupied')) return;

        // Already at the limit — tell them instead of silently failing
        if (mySelectedSeats().length >= seatLimit) {
            showToast(`You can only select ${seatLimit} seat${seatLimit === 1 ? '' : 's'} for this search. Deselect one first to change your pick.`);
            return;
        }

        try {
            await apiFetch(`/api/trips/${tripId}/seats/${seatNum}/hold`, {
                method: "POST",
                body: JSON.stringify({ sessionId: tabId })
            });
            await loadSeats();
        } catch (err) {
            showToast(err.message);
            await loadSeats(); // refresh in case someone else just took it
        }
    });

    continueBtn.addEventListener('click', () => {
        const mySeats = mySelectedSeats();

        if (mySeats.length !== seatLimit) {
            showToast(`Please select ${seatLimit} seat${seatLimit === 1 ? '' : 's'} to continue.`);
            return;
        }

        if (!pickupSelect.value) {
            showToast('Please choose a pickup center.');
            return;
        }

        const searchParams = new URLSearchParams({
            trip: tripId,
            seats: mySeats.join(','),
            terminal: pickupSelect.value
        });

        window.location.href = `passenger_detail.html?${searchParams.toString()}`;
    });

    continueBtn.disabled = true;
    loadTripDetails();
    loadSeats();
}