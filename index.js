// =========================
// TOAST NOTIFICATIONS
// (custom replacement for alert() / confirm() popups)
// =========================
function showToast(message, type = "error") {
    let container = document.getElementById("toast-container");

    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.setAttribute("aria-live", "polite");
        container.setAttribute("aria-atomic", "true");
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    // Trigger the enter animation on the next frame
    requestAnimationFrame(() => toast.classList.add("toast-show"));

    // Auto-dismiss
    setTimeout(() => {
        toast.classList.remove("toast-show");
        toast.addEventListener("transitionend", () => toast.remove(), { once: true });
    }, 3500);
}

// =========================
// NAVBAR / HAMBURGER
// =========================
const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-links");
const navButtons = document.querySelector(".nav-buttons");

if (hamburger && navLinks && navButtons) {
    hamburger.setAttribute("aria-expanded", "false");

    const closeMenu = () => {
        navLinks.classList.remove("show");
        navButtons.classList.remove("show");
        hamburger.setAttribute("aria-expanded", "false");
        hamburger.textContent = "☰";
    };

    const toggleMenu = () => {
        const isOpen = navLinks.classList.toggle("show");
        navButtons.classList.toggle("show");
        hamburger.setAttribute("aria-expanded", String(isOpen));
        hamburger.textContent = isOpen ? "✕" : "☰";
    };

    hamburger.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleMenu();
    });

    // Close when a nav link is clicked
    navLinks.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", closeMenu);
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
        const isOpen = navLinks.classList.contains("show");
        const clickedInsideMenu = navLinks.contains(e.target) || navButtons.contains(e.target);
        if (isOpen && !clickedInsideMenu && e.target !== hamburger) {
            closeMenu();
        }
    });

    // Close on Escape
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && navLinks.classList.contains("show")) {
            closeMenu();
        }
    });
}

// =========================
// FAQ ACCORDION (one open at a time, dynamic height)
// =========================
const faqItems = document.querySelectorAll(".faq-item");

faqItems.forEach(item => {
    const question = item.querySelector(".faq-question");
    const answer = item.querySelector(".faq-answer");
    if (!question || !answer) return;

    question.setAttribute("aria-expanded", item.classList.contains("active"));

    question.addEventListener("click", () => {
        const isActive = item.classList.contains("active");

        // Close every item first
        faqItems.forEach(i => {
            i.classList.remove("active");
            const q = i.querySelector(".faq-question");
            const a = i.querySelector(".faq-answer");
            if (q) q.setAttribute("aria-expanded", "false");
            if (a) a.style.maxHeight = null;
        });

        // Reopen the clicked one if it wasn't already open
        if (!isActive) {
            item.classList.add("active");
            question.setAttribute("aria-expanded", "true");
            answer.style.maxHeight = answer.scrollHeight + "px";
        }
    });

    // Set initial height for the item marked "active" in HTML
    if (item.classList.contains("active")) {
        answer.style.maxHeight = answer.scrollHeight + "px";
    }
});

// =========================
// BOOKING SEARCH (index.html)
// =========================
// NOTE: these selects currently only have one hardcoded <option> each
// (demo data). When the routes API is ready, populate them from
// something like fetch('/api/routes') and keep the same
// data-field attributes below so this JS doesn't need to change.

const bookingBox = document.querySelector(".booking-box");

if (bookingBox) {
    const fromSelect = bookingBox.querySelector('[data-field="from"]');
    const toSelect = bookingBox.querySelector('[data-field="to"]');
    const dateInput = bookingBox.querySelector('[data-field="date"]');
    const passengersSelect = bookingBox.querySelector('[data-field="passengers"]');
    const swapBtn = bookingBox.querySelector(".swap");
    const searchBtn = bookingBox.querySelector(".search-btn");

    // Prevent picking a departure date in the past
    if (dateInput) {
        const today = new Date().toISOString().split("T")[0];
        dateInput.min = today;
        if (dateInput.value && dateInput.value < today) {
            dateInput.value = today;
        }
    }

    // Swap "From" and "To"
    // Note: this only works because both selects share the same
    // list of cities (see index.html) — swapping to a value that
    // doesn't exist in the target select silently clears it.
    if (swapBtn && fromSelect && toSelect) {
        const swapFields = () => {
            const temp = fromSelect.value;
            fromSelect.value = toSelect.value;
            toSelect.value = temp;
        };

        swapBtn.addEventListener("click", swapFields);

        // Keyboard support since .swap is a div acting as a button
        swapBtn.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                swapFields();
            }
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener("click", () => {
            if (!fromSelect || !toSelect || !dateInput || !passengersSelect) {
                console.error("Booking form is missing an expected field.");
                return;
            }

            if (!dateInput.value) {
                dateInput.focus();
                return;
            }

            if (fromSelect.value === toSelect.value) {
                showToast("Departure and destination can't be the same.");
                return;
            }

            const params = new URLSearchParams({
                from: fromSelect.value,
                to: toSelect.value,
                date: dateInput.value,
                passengers: passengersSelect.value
            });

            window.location.href = `book_a_trip.html?${params.toString()}`;
        });
    }
}

// =========================
// TRIP SEARCH RESULTS HEADER (book_a_trip.html)
// =========================
// Reads the ?from=&to=&date=&passengers= params the homepage search
// sends over. The actual trip list is still demo data — once
// GET /api/trips?from=&to=&date= exists, fetch it here and render
// .trip-card markup from the response instead.
const tripRouteInfo = document.querySelector(".trip-route-info");

if (tripRouteInfo) {
    const params = new URLSearchParams(window.location.search);
    const from = params.get("from");
    const to = params.get("to");
    const date = params.get("date");
    const passengers = params.get("passengers");

    if (from && to) {
        const heading = tripRouteInfo.querySelector("h1");
        if (heading) heading.textContent = `${from} → ${to}`;

        const tripsCount = document.querySelector(".trips-header p");
        if (tripsCount) {
            tripsCount.textContent = `Trips found for ${from} → ${to}`;
        }
    }

    if (date || passengers) {
        const subtitle = tripRouteInfo.querySelector("p");

        if (subtitle) {
            const formattedDate = date
                ? new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                })
                : null;

            const passengerLabel = passengers
                ? `${passengers} passenger${passengers === "1" ? "" : "s"}`
                : null;

            subtitle.textContent = [formattedDate, passengerLabel].filter(Boolean).join(" • ");
        }
    }
}

// =========================
// PASSENGER DETAIL SUMMARY (passenger_detail.html)
// =========================
// Reads the ?seat=&pickup= that select_a_seat.js sends over, and
// fills in the Trip Summary card so the seat/pickup you actually
// picked show up here instead of the static demo values. Route,
// date, vehicle, and price are still static — book_a_trip.html
// doesn't forward those to select_a_seat.html yet, so there's
// nothing to carry further at this stage.
const passengerPage = document.querySelector(".passenger-page");

if (passengerPage) {
    const params = new URLSearchParams(window.location.search);
    const seat = params.get("seat");
    const pickup = params.get("pickup");

    if (seat) {
        const seatField = passengerPage.querySelector('[data-field="seat"]');
        if (seatField) seatField.textContent = seat;
    }

    if (pickup) {
        const pickupField = passengerPage.querySelector('[data-field="pickup"]');
        if (pickupField) pickupField.textContent = pickup;
    }
}