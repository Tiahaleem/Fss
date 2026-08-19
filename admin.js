// =========================
// ADMIN SHELL
// (shared across every admin-*.html page except admin-login.html)
// =========================
// The session check is now a real network request — "is this token
// still genuinely valid, according to the server?" — instead of an
// instant, trust-it-blindly localStorage read. That's slightly
// slower (a brief moment before the page fully "unlocks"), but it's
// the real thing: a stale or tampered token now gets caught here.

let currentAdmin = null; // populated once the check below finishes

(async function checkAdminSession() {
    const token = getAdminToken();

    if (!token) {
        window.location.href = "admin-login.html";
        return;
    }

    try {
        currentAdmin = await apiFetch("/api/auth/me");

        if (currentAdmin.role !== "admin") {
            clearAdminToken();
            window.location.href = "admin-login.html";
            return;
        }

        const nameEl = document.getElementById("admin-user-name");
        const avatarEl = document.getElementById("admin-avatar-initial");

        if (nameEl) nameEl.textContent = currentAdmin.name || "Admin";
        if (avatarEl) avatarEl.textContent = (currentAdmin.name || "A").trim().charAt(0).toUpperCase();

        // Let other admin-*.js files know it's safe to run anything
        // that depends on currentAdmin being populated.
        document.dispatchEvent(new CustomEvent("admin-session-ready"));
    } catch (err) {
        // apiFetch already redirects to login on a real 401 — this
        // catches the "server unreachable" case specifically.
        showToast("Couldn't verify your session — is the server running?");
    }
})();

const adminSidebar = document.querySelector(".admin-sidebar");
const adminHamburger = document.querySelector(".admin-hamburger");

if (adminSidebar && adminHamburger) {
    adminHamburger.addEventListener("click", () => {
        adminSidebar.classList.toggle("show");
    });

    // Close sidebar after picking a nav item on mobile
    adminSidebar.querySelectorAll(".admin-nav a").forEach(link => {
        link.addEventListener("click", () => {
            adminSidebar.classList.remove("show");
        });
    });
}

// Logout — clears the real login token
const adminLogout = document.getElementById("admin-logout");

if (adminLogout) {
    adminLogout.addEventListener("click", (e) => {
        e.preventDefault();
        clearAdminToken();
        window.location.href = "admin-login.html";
    });
}