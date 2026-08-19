// =========================
// TRACKING STORE (shared)
// =========================
// Backed by localStorage so the admin Tracking panel and the public
// track.html page stay in sync WITHIN THE SAME BROWSER. This is a
// stand-in for a real database — it does not sync between different
// visitors/devices. Once a backend exists, replace getTrackingEvents()
// with a fetch('/api/tracking?ref=...') and saveTrackingEvents() with
// the matching POST/PUT/DELETE calls.

const TRACKING_STORAGE_KEY = "fss_tracking_events";

function getTrackingEvents() {
    try {
        const raw = localStorage.getItem(TRACKING_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (err) {
        console.error("Couldn't read tracking data:", err);
    }

    // Default demo seed, used the first time (nothing saved yet)
    return [
        { id: 1, reference: "FSS-DEMO", order: 1, title: "Boarding completed", time: "07:55", status: "completed", icon: "boarding" },
        { id: 2, reference: "FSS-DEMO", order: 2, title: "Departed Jibowu Terminal", time: "08:02", status: "completed", icon: "departed" },
        { id: 3, reference: "FSS-DEMO", order: 3, title: "Passed Berger checkpoint", time: "08:48", status: "completed", icon: "checkpoint" },
        { id: 4, reference: "FSS-DEMO", order: 4, title: "Currently near Ibadan", time: "10:30", status: "active", icon: "location" },
        { id: 5, reference: "FSS-DEMO", order: 5, title: "Expected arrival · Abuja", time: "18:15 (ETA)", status: "pending", icon: "arrival" }
    ];
}

function saveTrackingEvents(events) {
    try {
        localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(events));
    } catch (err) {
        console.error("Couldn't save tracking data:", err);
    }
}

// =========================
// BOOKINGS STORE (shared)
// =========================
// Same idea as the tracking store above, but holds the actual
// booking details (sender/receiver for parcels, passenger info for
// trips) keyed by reference — the stuff a support agent would
// actually need when a customer calls in about FSS-XXXXXX. Same
// same-browser-only limitation as the tracking store.

const BOOKINGS_STORAGE_KEY = "fss_bookings";

function getBookings() {
    try {
        const raw = localStorage.getItem(BOOKINGS_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (err) {
        console.error("Couldn't read booking data:", err);
    }
    return [];
}

function saveBookings(bookings) {
    try {
        localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
    } catch (err) {
        console.error("Couldn't save booking data:", err);
    }
}

// =========================
// ROUTES STORE (shared)
// =========================

const ROUTES_STORAGE_KEY = "fss_routes";

function getRoutes() {
    try {
        const raw = localStorage.getItem(ROUTES_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (err) {
        console.error("Couldn't read route data:", err);
    }

    return [
        { id: 1, from: "Lagos", to: "Abuja", distance: 760, duration: "11h 00m", price: 24500, status: "active" },
        { id: 2, from: "Lagos", to: "Port Harcourt", distance: 610, duration: "9h 00m", price: 22000, status: "active" },
        { id: 3, from: "Lagos", to: "Benin City", distance: 320, duration: "6h 00m", price: 14500, status: "active" },
        { id: 4, from: "Lagos", to: "Enugu", distance: 540, duration: "9h 00m", price: 19500, status: "active" },
        { id: 5, from: "Lagos", to: "Ibadan", distance: 130, duration: "2h 30m", price: 6500, status: "active" },
        { id: 6, from: "Abuja", to: "Lagos", distance: 760, duration: "11h 00m", price: 24500, status: "active" }
    ];
}

function saveRoutes(routes) {
    try {
        localStorage.setItem(ROUTES_STORAGE_KEY, JSON.stringify(routes));
    } catch (err) {
        console.error("Couldn't save route data:", err);
    }
}

// =========================
// TRIPS STORE (shared)
// =========================

const TRIPS_STORAGE_KEY = "fss_trips";

function getTrips() {
    try {
        const raw = localStorage.getItem(TRIPS_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (err) {
        console.error("Couldn't read trip data:", err);
    }

    const scheduleSeed = {
        "Lagos-Abuja": ["06:00", "09:30", "13:00", "16:30", "20:00"],
        "Lagos-Port Harcourt": ["06:30", "10:00", "14:00", "18:00"],
        "Lagos-Benin City": ["07:00", "11:00", "15:00", "19:00"],
        "Lagos-Enugu": ["06:00", "10:30", "15:00"],
        "Lagos-Ibadan": ["06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"],
        "Abuja-Lagos": ["06:00", "09:30", "13:00", "16:30", "20:00"]
    };

    const seeded = [];
    let id = 1;

    Object.entries(scheduleSeed).forEach(([routeKey, times]) => {
        const [from, to] = routeKey.split("-");
        times.forEach(time => {
            seeded.push({ id: id++, from, to, time, vehicle: "Honda Odyssey", seats: 7, status: "active" });
        });
    });

    return seeded;
}

function saveTrips(trips) {
    try {
        localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(trips));
    } catch (err) {
        console.error("Couldn't save trip data:", err);
    }
}

// =========================
// TERMINALS STORE (shared)
// =========================

const TERMINALS_STORAGE_KEY = "fss_terminals";

function getTerminals() {
    try {
        const raw = localStorage.getItem(TERMINALS_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (err) {
        console.error("Couldn't read terminal data:", err);
    }

    return [
        { id: 1, city: "Lagos", name: "Jibowu Terminal", address: "23 Jibowu Street, Yaba, Lagos", phone: "+234 800 111 2201", hours: "5:00 – 22:00", status: "active" },
        { id: 2, city: "Lagos", name: "Lekki Hub", address: "Plot 12, Admiralty Way, Lekki Phase 1", phone: "+234 800 111 2202", hours: "5:30 – 21:30", status: "active" },
        { id: 3, city: "Abuja", name: "Utako Terminal", address: "Plot 45, Utako District, Abuja", phone: "+234 800 111 2203", hours: "5:00 – 22:00", status: "active" },
        { id: 4, city: "Abuja", name: "Wuse Terminal", address: "Zone 5, Wuse, Abuja", phone: "+234 800 111 2204", hours: "5:00 – 22:00", status: "active" },
        { id: 5, city: "Port Harcourt", name: "Mile 1 Terminal", address: "Ikwerre Road, Mile 1, Port Harcourt", phone: "+234 800 111 2205", hours: "5:30 – 21:30", status: "active" },
        { id: 6, city: "Benin City", name: "Ring Road Terminal", address: "Ring Road, Benin City, Edo", phone: "+234 800 111 2206", hours: "5:00 – 21:00", status: "active" }
    ];
}

function saveTerminals(terminals) {
    try {
        localStorage.setItem(TERMINALS_STORAGE_KEY, JSON.stringify(terminals));
    } catch (err) {
        console.error("Couldn't save terminal data:", err);
    }
}

// =========================
// USERS STORE (shared)
// =========================
// ⚠️ DEMO ONLY — passwords are stored as plain text here. This is
// NOT acceptable in a real product under any circumstances. Once a
// backend exists, passwords must be hashed server-side (bcrypt or
// similar) and the plaintext value must never touch storage, logs,
// or be sent back in a response — this whole store gets replaced by
// real POST /api/auth/signup and /api/auth/login calls.

const USERS_STORAGE_KEY = "fss_users";
const SESSION_STORAGE_KEY = "fss_current_user";

function getUsers() {
    try {
        const raw = localStorage.getItem(USERS_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (err) {
        console.error("Couldn't read user data:", err);
    }
    return [];
}

function saveUsers(users) {
    try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (err) {
        console.error("Couldn't save user data:", err);
    }
}

function getCurrentUser() {
    try {
        const raw = localStorage.getItem(SESSION_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (err) {
        console.error("Couldn't read session:", err);
    }
    return null;
}

function setCurrentUser(user) {
    try {
        // Never keep the password in the session record
        const { password, ...safeUser } = user;
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(safeUser));
    } catch (err) {
        console.error("Couldn't save session:", err);
    }
}

function clearCurrentUser() {
    localStorage.removeItem(SESSION_STORAGE_KEY);
}

// =========================
// ADMIN USERS STORE (shared)
// =========================
// Deliberately separate from the customer USERS STORE above — admin
// accounts are staff, not customers, and shouldn't share a table
// even in this demo. Same plaintext-password caveat applies: demo
// only, never acceptable once there's a real backend.
//
// Seeded with one default login so admin-login.html isn't a dead
// end before any admin account has been created:
//   email: admin@fss.ng   password: admin1234
// Change it from admin-settings.html after logging in.

const ADMIN_USERS_STORAGE_KEY = "fss_admin_users";
const ADMIN_SESSION_STORAGE_KEY = "fss_current_admin";

function getAdminUsers() {
    try {
        const raw = localStorage.getItem(ADMIN_USERS_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (err) {
        console.error("Couldn't read admin user data:", err);
    }

    // First time ever loading this — save the seed immediately so
    // it's not just sitting in memory until someone happens to
    // trigger a write. Removes any ambiguity about what's actually
    // in storage.
    const seed = [
        { id: 1, name: "Admin", email: "admin@fss.ng", password: "admin1234" }
    ];
    saveAdminUsers(seed);
    return seed;
}

function saveAdminUsers(admins) {
    try {
        localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(admins));
    } catch (err) {
        console.error("Couldn't save admin user data:", err);
    }
}

function getCurrentAdmin() {
    try {
        const raw = localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (err) {
        console.error("Couldn't read admin session:", err);
    }
    return null;
}

function setCurrentAdmin(admin) {
    try {
        const { password, ...safeAdmin } = admin;
        localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(safeAdmin));
    } catch (err) {
        console.error("Couldn't save admin session:", err);
    }
}

function clearCurrentAdmin() {
    localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
}

// =========================
// SEAT HOLDS (shared) — the double-booking groundwork
// =========================
// Now keyed by TRIP first, then seat number — so each departure
// (each specific trip ID from getTrips()) has its own independent
// seat data. Booking seat 3 on the 06:00 trip has zero effect on
// seat 3 for the 09:30 trip — same as two different cinema showings
// having separate bookings even for the same seat number.
//
// Shape: { "5": { "4": { status: "booked" } }, "12": { ... } }
//                 ^trip id      ^seat number
//
// Real hold → book mechanic, backed by localStorage. This makes
// seat selection genuinely work correctly across multiple tabs on
// THE SAME BROWSER — hold a seat in one tab, it locks in another.
// It does NOT prevent two different customers on two different
// devices from both grabbing the same seat on the same trip — that
// needs a real backend with a database that both of them talk to.
// This is the exact mechanic that logic will use once it exists;
// only the storage calls change (these functions become fetch() calls).

const SEAT_HOLDS_KEY = "fss_seat_holds";
const SEAT_HOLD_MINUTES = 10;

function getAllSeatHolds() {
    try {
        const raw = localStorage.getItem(SEAT_HOLDS_KEY);
        if (raw) return JSON.parse(raw);
    } catch (err) {
        console.error("Couldn't read seat hold data:", err);
    }
    // Demo seed: seat 4 booked on trip id 1 (the 06:00 Lagos→Abuja
    // trip), matching the original single-seat-map demo.
    return { "1": { "4": { status: "booked" } } };
}

function saveAllSeatHolds(holds) {
    try {
        localStorage.setItem(SEAT_HOLDS_KEY, JSON.stringify(holds));
    } catch (err) {
        console.error("Couldn't save seat hold data:", err);
    }
}

// Reads one trip's seat holds, silently drops any expired ones, and
// persists that cleanup — so an abandoned seat really does become
// available again after the hold window passes, for that trip only.
function getActiveSeatHoldsForTrip(tripId) {
    const allHolds = getAllSeatHolds();
    const tripHolds = allHolds[tripId] || {};
    const now = Date.now();
    let changed = false;

    Object.keys(tripHolds).forEach(seat => {
        const hold = tripHolds[seat];
        if (hold.status === "held" && hold.expiresAt && new Date(hold.expiresAt).getTime() < now) {
            delete tripHolds[seat];
            changed = true;
        }
    });

    if (changed) {
        allHolds[tripId] = tripHolds;
        saveAllSeatHolds(allHolds);
    }

    return tripHolds;
}

function saveSeatHoldsForTrip(tripId, tripHolds) {
    const allHolds = getAllSeatHolds();
    allHolds[tripId] = tripHolds;
    saveAllSeatHolds(allHolds);
}

// One ID per browser TAB (sessionStorage, not localStorage) — this
// is what lets the UI tell "you're holding this seat" apart from
// "someone else (another tab) is holding this seat".
function getTabSessionId() {
    try {
        let id = sessionStorage.getItem("fss_tab_session");
        if (!id) {
            id = "tab-" + Math.random().toString(36).slice(2, 10);
            sessionStorage.setItem("fss_tab_session", id);
        }
        return id;
    } catch (err) {
        console.error("Couldn't read/set tab session:", err);
        return "tab-fallback";
    }
}

// =========================
// NAV AUTH STATE
// =========================
// Swaps "Sign In" / "Get Started" for the user's name + Settings +
// Log Out, on every page that has a .nav-buttons element and isn't
// already mid-auth-flow. Runs once, on load.

(function applyNavAuthState() {
    const navButtons = document.querySelector(".nav-buttons");
    if (!navButtons) return;

    const user = getCurrentUser();
    if (!user) return;

    const initial = user.name ? user.name.trim().charAt(0).toUpperCase() : "U";

    navButtons.innerHTML = `
        <a href="settings.html" class="signin" style="display:flex; align-items:center; gap:8px;">
            <span style="width:26px; height:26px; border-radius:50%; background:var(--color-cyan); color:white; display:inline-flex; align-items:center; justify-content:center; font-size:12px; font-weight:700;">${initial}</span>
            ${user.name ? user.name.split(" ")[0] : "Account"}
        </a>
        <a href="#" class="btn-primary" id="nav-logout-btn">Log Out</a>
    `;

    const logoutBtn = document.getElementById("nav-logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            clearCurrentUser();
            window.location.href = "index.html";
        });
    }
})();

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