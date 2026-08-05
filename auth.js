// =========================
// AUTH (login.html + signup.html)
// =========================
// TEMP DEMO: no real backend yet. Forms validate client-side only
// and simulate success with a toast + redirect. Once auth exists
// (e.g. POST /api/auth/login, POST /api/auth/signup), replace the
// showToast+redirect blocks with real fetch() calls.

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Google button — shared by both pages. Real "Sign in with Google"
// needs a Google Cloud OAuth Client ID and a backend to exchange
// the token for a session; that doesn't exist yet, so this is a
// clearly-labeled placeholder rather than something that pretends
// to work.
const googleBtn = document.querySelector(".google-btn");

if (googleBtn) {
    googleBtn.addEventListener("click", () => {
        showToast("Google Sign-In isn't connected yet — coming soon.");
    });
}

// =========================
// LOGIN FORM
// =========================
const loginForm = document.getElementById("login-form");

if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const email = document.getElementById("login-email");
        const password = document.getElementById("login-password");

        if (email.value.trim() === "" || password.value.trim() === "") {
            showToast("Please enter your email and password.");
            return;
        }

        if (!emailPattern.test(email.value.trim())) {
            showToast("Please enter a valid email address.");
            return;
        }

        showToast("Signed in — redirecting…", "success");

        setTimeout(() => {
            window.location.href = "index.html";
        }, 900);
    });
}

// =========================
// SIGNUP FORM
// =========================
const signupForm = document.getElementById("signup-form");

if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const name = document.getElementById("signup-name");
        const email = document.getElementById("signup-email");
        const password = document.getElementById("signup-password");
        const confirm = document.getElementById("signup-confirm");
        const terms = document.getElementById("signup-terms");

        if (
            name.value.trim() === "" ||
            email.value.trim() === "" ||
            password.value.trim() === "" ||
            confirm.value.trim() === ""
        ) {
            showToast("Please fill in every field.");
            return;
        }

        if (!emailPattern.test(email.value.trim())) {
            showToast("Please enter a valid email address.");
            return;
        }

        if (password.value.length < 8) {
            showToast("Password must be at least 8 characters.");
            return;
        }

        if (password.value !== confirm.value) {
            showToast("Passwords don't match.");
            return;
        }

        if (!terms.checked) {
            showToast("Please accept the Terms & Privacy Policy to continue.");
            return;
        }

        showToast("Account created — redirecting…", "success");

        setTimeout(() => {
            window.location.href = "index.html";
        }, 900);
    });
}