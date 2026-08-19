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

// Wraps fetch() with the API base URL, JSON headers, the admin's
// login token (if any), and consistent error handling. Every call
// site does: const data = await apiFetch("/api/routes");
async function apiFetch(path, options = {}) {
    const token = getAdminToken();

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

    // Session expired or was never valid — send back to login
    if (response.status === 401 && path !== "/api/auth/login") {
        clearAdminToken();
        window.location.href = "admin-login.html";
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