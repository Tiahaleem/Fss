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
    let seatLimit = Math.max(1, Number(urlParams.get('passengers')) || 1);
    let maxSeatLimit = 6; // safe default until the real vehicle capacity loads
    const travelDate = urlParams.get('date') || getLocalDateString();
    const tabId = getTabSessionId();

    const seatCountValue = document.getElementById('seat-count-value');
    const seatCountMinus = document.getElementById('seat-count-minus');
    const seatCountPlus = document.getElementById('seat-count-plus');

    function updateSeatCountDisplay() {
        if (seatCountValue) seatCountValue.textContent = seatLimit;
        if (seatCountMinus) seatCountMinus.disabled = seatLimit <= 1;
        if (seatCountPlus) seatCountPlus.disabled = seatLimit >= maxSeatLimit;
        if (seatLimitText) {
            seatLimitText.textContent = seatLimit === 1 ? "Select 1 seat" : `Select ${seatLimit} seats`;
        }
        if (continueBtn) {
            continueBtn.disabled = mySelectedSeats().length !== seatLimit;
        }
    }

    let countdownInterval = null;
    let currentRoute = null;

    updateSeatCountDisplay();

    const summaryDateEl = document.getElementById('summary-date');
    if (summaryDateEl) {
        const [y, m, d] = travelDate.split('-').map(Number);
        summaryDateEl.textContent = new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    function seatButtons() {
        return Array.from(seatMap.querySelectorAll('.seat:not(.driver)'));
    }

    function mySelectedSeats() {
        return seatButtons().filter(b => b.classList.contains('selected')).map(b => b.textContent.trim());
    }

    const DRIVER_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16">
\t<path d="M0 0h16v16H0z" fill="none" />
\t<path fill="currentColor" fill-rule="evenodd" d="M5.5 11H4.419l-.342 1.026l-.158.474H2V9.52c.496.129 1.213.23 2.25.23a.75.75 0 1 0 0-1.5c-1.073 0-1.682-.12-1.998-.217a2 2 0 0 1-.204-.075a1.8 1.8 0 0 1 .485-.87q.11-.11.214-.228C4.272 7.293 6.15 7.5 8 7.5s3.728-.207 5.253-.64q.103.119.214.228c.241.242.408.544.485.87q-.066.032-.204.075c-.316.097-.925.217-1.998.217a.75.75 0 0 0 0 1.5c1.037 0 1.754-.101 2.25-.23v2.98h-1.919l-.158-.474L11.581 11zm6.924-5.472C11.144 5.838 9.584 6 8 6s-3.144-.162-4.424-.472q.046-.112.088-.226l.448-1.257c.18-.505.57-.806.96-.863a20.8 20.8 0 0 1 5.855 0c.392.057.78.358.96.863l.45 1.257q.04.114.087.226m-1.652 7.788L10.5 12.5h-5l-.272.816a1 1 0 0 1-.949.684H1.5a1 1 0 0 1-1-1V8.375c0-.88.35-1.725.972-2.347a3.3 3.3 0 0 0 .43-.528H1.25a.75.75 0 1 1 0-1.5h1.286l.164-.46c.343-.96 1.148-1.696 2.157-1.842a22.3 22.3 0 0 1 6.286 0c1.009.146 1.814.882 2.157 1.843l.164.459h1.286a.75.75 0 0 1 0 1.5h-.651q.187.286.429.528a3.32 3.32 0 0 1 .972 2.347V13a1 1 0 0 1-1 1h-2.78a1 1 0 0 1-.948-.684" clip-rule="evenodd" />
</svg>`;

    // Works out how many seats go in each row. Uses the vehicle's
    // real layout string (e.g. "2-3") when it's set and actually
    // adds up to the real seat count — otherwise falls back to a
    // sensible default (rows of 2, with the last row absorbing the
    // remainder) rather than assuming every vehicle has 7 seats.
    function getSeatRowSizes(totalSeats, layoutString) {
        if (layoutString) {
            const parsed = layoutString.split("-").map(Number).filter(n => Number.isInteger(n) && n > 0);
            const sum = parsed.reduce((a, b) => a + b, 0);
            if (sum === totalSeats) return parsed;
        }

        const rows = [];
        let remaining = totalSeats;
        while (remaining > 3) {
            rows.push(2);
            remaining -= 2;
        }
        if (remaining > 0) rows.push(remaining);
        return rows;
    }

    // Builds the actual seat grid HTML from scratch, matching
    // whatever this specific vehicle's real seat count and layout
    // are — seat 1 is always the driver, exactly like before, just
    // no longer hardcoded to a fixed 7-seat shape.
    function renderSeatMapGrid(totalSeats, layoutString) {
        const rowSizes = getSeatRowSizes(totalSeats, layoutString);
        let seatNum = 1;
        let html = "";

        rowSizes.forEach((rowSize, rowIndex) => {
            const isLastRow = rowIndex === rowSizes.length - 1;
            html += `<div class="seat-row${isLastRow && rowSize >= 3 ? " rear-row" : ""}">`;

            for (let i = 0; i < rowSize; i++) {
                if (seatNum === 1) {
                    html += `<button class="seat driver" disabled aria-label="Seat 1, Driver, not selectable">${DRIVER_ICON_SVG} 1</button>`;
                } else {
                    html += `<button class="seat">${seatNum}</button>`;
                }
                seatNum++;
            }

            html += `</div>`;
        });

        seatMap.innerHTML = html;
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

            // The real vehicle's seat count minus 1 (seat 1 is
            // always the driver) — the true ceiling on how many
            // seats a single booking could ever need.
            maxSeatLimit = Math.max(1, (trip.seats || 7) - 1);
            if (seatLimit > maxSeatLimit) seatLimit = maxSeatLimit;
            updateSeatCountDisplay();

            renderSeatMapGrid(trip.seats || 7, trip.vehicleLayout);

            if (currentRoute) {
                const arrival = addMinutesToTime(trip.time, currentRoute.duration);

                if (heroHeading) heroHeading.textContent = `${trip.from} → ${trip.to}`;

                const summaryRouteEl = document.getElementById("summary-route");
                if (summaryRouteEl) summaryRouteEl.textContent = `${trip.from} → ${trip.to}`;
                if (heroSubtitle) heroSubtitle.textContent = `${trip.time} → ${arrival} (${currentRoute.duration}) · ${trip.vehicleName || "Vehicle"}`;

                const vehicleNameEl = document.getElementById("vehicle-name");
                const vehiclePlateEl = document.getElementById("vehicle-plate");
                const vehicleSeatsEl = document.getElementById("vehicle-seats");

                if (vehicleNameEl) vehicleNameEl.textContent = trip.vehicleName || "Vehicle";
                if (vehiclePlateEl) vehiclePlateEl.textContent = trip.vehiclePlate || "";
                if (vehicleSeatsEl) vehicleSeatsEl.textContent = trip.seats;

                // Layout and vehicle class are genuinely optional per
                // vehicle — only show that box at all when this
                // specific vehicle actually has one set, rather than
                // displaying an empty "–" for vehicles nobody's
                // bothered to fill that in for yet.
                const layoutBox = document.getElementById("vehicle-layout-box");
                const layoutEl = document.getElementById("vehicle-layout");
                if (trip.vehicleLayout) {
                    layoutEl.textContent = trip.vehicleLayout;
                    layoutBox.style.display = "";
                } else if (layoutBox) {
                    layoutBox.style.display = "none";
                }

                const classBox = document.getElementById("vehicle-class-box");
                const classEl = document.getElementById("vehicle-class");
                if (trip.vehicleClass) {
                    classEl.textContent = trip.vehicleClass;
                    classBox.style.display = "";
                } else if (classBox) {
                    classBox.style.display = "none";
                }

                // A/C always has a real true/false value, so it
                // always shows.
                const acEl = document.getElementById("vehicle-ac");
                if (acEl) acEl.textContent = trip.vehicleHasAC ? "Yes" : "No";
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
            const seatStates = await apiFetch(`/api/trips/${tripId}/seats?date=${encodeURIComponent(travelDate)}`);
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

    seatCountMinus?.addEventListener('click', async () => {
        if (seatLimit <= 1) return;
        seatLimit--;

        // If they'd already selected more seats than the new lower
        // limit allows, release the extra ones automatically —
        // starting from whichever seat they picked last.
        const excess = mySelectedSeats().slice(seatLimit);
        for (const seatNum of excess) {
            try {
                await apiFetch(`/api/trips/${tripId}/seats/${seatNum}/hold`, {
                    method: "DELETE",
                    body: JSON.stringify({ sessionId: tabId, travelDate })
                });
            } catch (err) {
                // Not critical — worst case it just stays held until it expires naturally
            }
        }

        updateSeatCountDisplay();
        if (excess.length > 0) await loadSeats();
    });

    seatCountPlus?.addEventListener('click', () => {
        if (seatLimit >= maxSeatLimit) return;
        seatLimit++;
        updateSeatCountDisplay();
    });

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
                    body: JSON.stringify({ sessionId: tabId, travelDate })
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
                body: JSON.stringify({ sessionId: tabId, travelDate })
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
            terminal: pickupSelect.value,
            date: travelDate
        });

        window.location.href = `passenger_detail.html?${searchParams.toString()}`;
    });

    continueBtn.disabled = true;
    (async () => {
        await loadTripDetails(); // builds the real seat grid first
        await loadSeats();       // only safe to run once those buttons actually exist
    })();
}