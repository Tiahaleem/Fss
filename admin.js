// =========================
// ADMIN SHELL
// (shared across every admin-*.html page except admin-login.html)
// =========================

// Guard: bounce to login if there's no admin session. This runs on
// every page that loads admin.js, which is every admin page except
// the login page itself.
const currentAdmin = getCurrentAdmin();

if (!currentAdmin) {
    window.location.href = "admin-login.html";
} else {
    const nameEl = document.getElementById("admin-user-name");
    const avatarEl = document.getElementById("admin-avatar-initial");

    if (nameEl) nameEl.textContent = currentAdmin.name || "Admin";
    if (avatarEl) avatarEl.textContent = (currentAdmin.name || "A").trim().charAt(0).toUpperCase();
}

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

// Logout — clears the real admin session now
const adminLogout = document.getElementById("admin-logout");

if (adminLogout) {
    adminLogout.addEventListener("click", (e) => {
        e.preventDefault();
        clearCurrentAdmin();
        window.location.href = "admin-login.html";
    });
}
