// =========================
// SEAT SELECTION — hold-based
// =========================
// Seat state now comes entirely from getActiveSeatHolds() in
// index.js, not from hardcoded classes in the HTML. Selecting a seat
// places a real 10-minute hold in shared storage; it becomes a
// permanent booking only after payment succeeds on the next page
// (see passenger_detail.js). Works correctly across multiple tabs
// on this browser — see the full explanation in index.js.

const seatMap = document.querySelector('.seat-map');
const selectedSeatText = document.getElementById('selected-seat');
const continueBtn = document.querySelector('.continue-btn');
const pickupSelect = document.getElementById('pickup-center');
const holdTimerRow = document.getElementById('hold-timer-row');
const holdTimerText = document.getElementById('hold-timer-text');

if (seatMap && continueBtn) {

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
        const holds = getActiveSeatHolds();

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
                // Held by a different tab — temporarily unavailable
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
        const holds = getActiveSeatHolds();

        // Release whatever this tab was previously holding — only
        // one seat per session, matching "Select up to 1 seat"
        releaseMyHold(holds);

        const expiresAt = new Date(Date.now() + SEAT_HOLD_MINUTES * 60 * 1000).toISOString();
        holds[seatNum] = { status: 'held', heldBy: tabId, expiresAt };

        saveSeatHolds(holds);
        renderSeats();
    });

    continueBtn.addEventListener('click', () => {
        const holds = getActiveSeatHolds();
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
        const params = new URLSearchParams({
            seat: mySeat,
            pickup: pickupSelect ? pickupSelect.value : ''
        });

        window.location.href = `passenger_detail.html?${params.toString()}`;
    });

    continueBtn.disabled = true;
    renderSeats();
}
