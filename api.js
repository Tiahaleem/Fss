// =========================
// API CLIENT (shared)
// =========================
// Replaces the localStorage get___()/save___() pattern from index.js
// with real calls to the backend. Load this AFTER index.js on any
// admin page (index.js still provides showToast() etc.).
//
// Change this to your deployed backend's real address once it's
// hosted somewhere other than your own computer (Render, etc.).
const API_BASE_URL = "http://localhost:4000";

const ADMIN_TOKEN_KEY = "fss_admin_token";

function getAdminToken() {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
}

function setAdminToken(token) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

function clearAdminToken() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
}

// Separate from the admin token on purpose — someone testing this
// site could be logged into the admin panel AND have a customer
// account signed in at the same time, in the same browser. They
// shouldn't interfere with each other.
const CUSTOMER_TOKEN_KEY = "fss_customer_token";

function getCustomerToken() {
    return localStorage.getItem(CUSTOMER_TOKEN_KEY);
}

function setCustomerToken(token) {
    localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
}

function clearCustomerToken() {
    localStorage.removeItem(CUSTOMER_TOKEN_KEY);
}

// Wraps fetch() with the API base URL, JSON headers, a login token
// (if any), and consistent error handling. Every call site does:
// const data = await apiFetch("/api/routes");
//
// Pass { asCustomer: true } for endpoints a signed-in CUSTOMER calls
// (like /api/bookings/mine) — everything else (the existing admin
// pages) keeps using the admin token by default, unchanged.
async function apiFetch(path, options = {}) {
    const asCustomer = options.asCustomer === true;
    const token = asCustomer ? getCustomerToken() : getAdminToken();

    const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
    };

    let response;

    try {
        response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    } catch (err) {
        // The server itself is unreachable (not running, wrong URL, etc.)
        throw new Error("Couldn't reach the server. Is it running?");
    }

    // Session expired or was never valid
    if (response.status === 401 && path !== "/api/auth/login") {
        if (asCustomer) {
            clearCustomerToken();
            // No forced redirect here — most customer pages are public
            // and shouldn't kick someone out just because their
            // optional login expired. Callers decide what to do.
        } else {
            clearAdminToken();
            window.location.href = "admin-login.html";
        }
        throw new Error("Session expired.");
    }

    // No content (e.g. a successful DELETE)
    if (response.status === 204) {
        return null;
    }

    let data;
    try {
        data = await response.json();
    } catch (err) {
        throw new Error(`Server returned an unexpected response (status ${response.status}) for ${path}.`);
    }

    if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
    }

    return data;
}

// =========================
// NAV AUTH STATE
// =========================
// Swaps "Sign In" / "Get Started" for the customer's name + Log Out,
// on every page that has a .nav-buttons element and a customer
// session token. Checks the REAL session with the backend (not just
// "is there a token sitting in storage") — a stale/expired token
// quietly falls back to showing the normal Sign In / Get Started.

(async function applyNavAuthState() {
    const navButtons = document.querySelector(".nav-buttons");
    if (!navButtons) return;

    const token = getCustomerToken();
    if (!token) return;

    let user;
    try {
        user = await apiFetch("/api/auth/me", { asCustomer: true });
    } catch (err) {
        return; // no token, expired token, or server unreachable — leave the default Sign In / Get Started
    }

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
            clearCustomerToken();
            window.location.href = "index.html";
        });
    }
})();