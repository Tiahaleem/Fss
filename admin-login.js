// =========================
// ADMIN LOGIN
// =========================
// Calls the real backend now — checks a real bcrypt-hashed password
// against your Supabase database, and stores a real login token
// (JWT) instead of the old browser-only "session".

const adminLoginForm = document.getElementById("admin-login-form");

if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", async (e) => {
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

        try {
            const data = await apiFetch("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    email: email.value.trim(),
                    password: password.value
                })
            });

            if (data.user.role !== "admin") {
                showToast("This account doesn't have admin access.");
                return;
            }

            setAdminToken(data.token);

            showToast("Signed in — redirecting…", "success");

            setTimeout(() => {
                window.location.href = "admin-dashboard.html";
            }, 900);
        } catch (err) {
            showToast(err.message);
        }
    });
}