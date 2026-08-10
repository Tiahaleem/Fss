// =========================
// ADMIN LOGIN
// =========================
// Checks against the seeded/stored admin accounts in index.js
// (getAdminUsers()). Default login: admin@fss.ng / admin1234.
// Once real auth exists, replace this with a proper fetch() call.

const adminLoginForm = document.getElementById("admin-login-form");

if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const email = document.getElementById("admin-email");
        const password = document.getElementById("admin-password");
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (email.value.trim() === "" || password.value.trim() === "") {
            showToast("Please enter your email and password.");
            return;
        }

        if (!emailPattern.test(email.value.trim())) {
            showToast("Please enter a valid email address.");
            return;
        }

        const admins = getAdminUsers();
        const match = admins.find(a =>
            a.email.toLowerCase() === email.value.trim().toLowerCase() &&
            a.password === password.value
        );

        if (!match) {
            showToast("Incorrect email or password.");
            return;
        }

        setCurrentAdmin(match);

        showToast("Signed in — redirecting…", "success");

        setTimeout(() => {
            window.location.href = "admin-dashboard.html";
        }, 900);
    });
}