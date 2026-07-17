// =========================
// SEAT SELECTION
// =========================
// NOTE: relies on showToast() from index.js, which loads first
// (see the <script> order at the bottom of select_a_seat.html).

const seatMap = document.querySelector('.seat-map');
const selectedSeatText = document.getElementById('selected-seat');
const continueBtn = document.querySelector('.continue-btn');
const pickupSelect = document.getElementById('pickup-center');

if (seatMap && continueBtn) {
    continueBtn.disabled = true;

    // One listener on the container instead of one per seat button.
    // Still works if the seat map is later rendered from an API
    // response (GET /api/trips/:id/seats) instead of hardcoded here.
    seatMap.addEventListener('click', (e) => {
        const seat = e.target.closest('.seat');
        if (!seat || seat.classList.contains('occupied') || seat.disabled) return;

        document
            .querySelectorAll('.seat.selected')
            .forEach(s => s.classList.remove('selected'));

        seat.classList.add('selected');

        if (selectedSeatText) {
            selectedSeatText.textContent = seat.textContent.trim();
        }

        continueBtn.disabled = false;
    });

    continueBtn.addEventListener('click', () => {
        const selectedSeat = document.querySelector('.seat.selected');

        if (!selectedSeat) {
            showToast('Please select a seat first.');
            return;
        }

        // Demo handoff via query string for now — once there's a
        // real booking session/API, this is where that call goes.
        const params = new URLSearchParams({
            seat: selectedSeat.textContent.trim(),
            pickup: pickupSelect ? pickupSelect.value : ''
        });

        window.location.href = `passenger_detail.html?${params.toString()}`;
    });
}