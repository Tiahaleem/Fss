// =========================
// AUTH (login.html + signup.html) — real backend
// =========================
// Same two-step signup flow as before (details → email verification)
// — but now creates a real account with a real bcrypt-hashed
// password. The "demo code" box still shows the actual code, since
// there's still no email service wired up to send it for real —
// that's the backend's own _devCode field, not something invented
// here anymore.

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
    loginForm.addEventListener("submit", async (e) => {
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

        try {
            const data = await apiFetch("/api/auth/login", {
                method: "POST",
                asCustomer: true,
                body: JSON.stringify({
                    email: email.value.trim(),
                    password: password.value
                })
            });

            setCustomerToken(data.token);

            showToast("Signed in — redirecting…", "success");

            setTimeout(() => {
                window.location.href = "index.html";
            }, 900);
        } catch (err) {
            showToast(err.message);
        }
    });
}

// =========================
// SIGNUP FORM (step 1: details → step 2: email verification)
// =========================
const signupForm = document.getElementById("signup-form");
const signupFormView = document.getElementById("signup-form-view");
const verifyView = document.getElementById("verify-view");
const verifyEmailTarget = document.getElementById("verify-email-target");
const demoCodeDisplay = document.getElementById("demo-code-display");
const verifyForm = document.getElementById("verify-form");
const verifyCodeInput = document.getElementById("verify-code-input");
const resendCodeBtn = document.getElementById("resend-code-btn");
const changeEmailLink = document.getElementById("change-email-link");

let pendingEmail = null;

function showVerifyStep(email, code) {
    pendingEmail = email;
    verifyEmailTarget.textContent = email;
    demoCodeDisplay.textContent = code;
    verifyCodeInput.value = "";

    signupFormView.style.display = "none";
    verifyView.style.display = "block";
    verifyCodeInput.focus();
}

if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
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

        try {
            // Nothing is "logged in" yet — the account exists on the
            // server now (unverified), but no session starts until
            // the code below is confirmed.
            const result = await apiFetch("/api/auth/signup", {
                method: "POST",
                body: JSON.stringify({
                    name: name.value.trim(),
                    email: email.value.trim(),
                    password: password.value
                })
            });

            showVerifyStep(email.value.trim(), result._devCode);
        } catch (err) {
            showToast(err.message);
        }
    });
}

if (verifyForm) {
    verifyForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!pendingEmail) {
            showToast("Something went wrong — please start over.");
            return;
        }

        try {
            const data = await apiFetch("/api/auth/verify", {
                method: "POST",
                body: JSON.stringify({
                    email: pendingEmail,
                    code: verifyCodeInput.value.trim()
                })
            });

            setCustomerToken(data.token);
            pendingEmail = null;

            showToast("Email verified — redirecting…", "success");

            setTimeout(() => {
                window.location.href = "index.html";
            }, 900);
        } catch (err) {
            showToast(err.message);
        }
    });
}

if (resendCodeBtn) {
    resendCodeBtn.addEventListener("click", async () => {
        if (!pendingEmail) return;

        try {
            const result = await apiFetch("/api/auth/resend-code", {
                method: "POST",
                body: JSON.stringify({ email: pendingEmail })
            });

            demoCodeDisplay.textContent = result._devCode;
            verifyCodeInput.value = "";
            verifyCodeInput.focus();

            showToast("New code generated.", "success");
        } catch (err) {
            showToast(err.message);
        }
    });
}

if (changeEmailLink) {
    changeEmailLink.addEventListener("click", (e) => {
        e.preventDefault();
        pendingEmail = null;
        verifyView.style.display = "none";
        signupFormView.style.display = "block";
    });
}