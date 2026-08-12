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
//
// How it plugs into the account system already built here: once
// Google confirms the user's email, the backend checks it against
// the same users table getUsers()/saveUsers() represents now — an
// existing email logs in, a new one auto-creates an account (no
// password needed, Google already verified them). Either way it
// ends at the same setCurrentUser() call the email/password flow
// uses below, so the navbar/session logic in index.js needs zero
// changes to support it — Google auth is a second door into the
// same account system, not a separate one.
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

        const users = getUsers();
        const match = users.find(u =>
            u.email.toLowerCase() === email.value.trim().toLowerCase() &&
            u.password === password.value
        );

        if (!match) {
            showToast("Incorrect email or password.");
            return;
        }

        setCurrentUser(match);

        showToast("Signed in — redirecting…", "success");

        setTimeout(() => {
            window.location.href = "index.html";
        }, 900);
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

// Holds the not-yet-created account while the code is being
// verified. Nothing is written to the users store until the code
// checks out.
let pendingSignup = null;

function generateCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

function showVerifyStep(email, code) {
    verifyEmailTarget.textContent = email;
    demoCodeDisplay.textContent = code;
    verifyCodeInput.value = "";

    signupFormView.style.display = "none";
    verifyView.style.display = "block";
    verifyCodeInput.focus();
}

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

        const users = getUsers();
        const alreadyExists = users.some(u => u.email.toLowerCase() === email.value.trim().toLowerCase());

        if (alreadyExists) {
            showToast("An account with that email already exists — try signing in instead.");
            return;
        }

        // Nothing saved yet — the account is only created once the
        // code below is verified.
        pendingSignup = {
            name: name.value.trim(),
            email: email.value.trim(),
            password: password.value,
            code: generateCode()
        };

        showVerifyStep(pendingSignup.email, pendingSignup.code);
    });
}

if (verifyForm) {
    verifyForm.addEventListener("submit", (e) => {
        e.preventDefault();

        if (!pendingSignup) {
            showToast("Something went wrong — please start over.");
            return;
        }

        if (verifyCodeInput.value.trim() !== pendingSignup.code) {
            showToast("Incorrect code. Check your email and try again.");
            return;
        }

        // ⚠️ Plaintext password — demo only, see the warning in
        // index.js's USERS STORE section.
        const newUser = {
            id: Date.now(),
            name: pendingSignup.name,
            email: pendingSignup.email,
            password: pendingSignup.password,
            verified: true
        };

        const users = getUsers();
        users.push(newUser);
        saveUsers(users);
        setCurrentUser(newUser);

        pendingSignup = null;

        showToast("Email verified — redirecting…", "success");

        setTimeout(() => {
            window.location.href = "index.html";
        }, 900);
    });
}

if (resendCodeBtn) {
    resendCodeBtn.addEventListener("click", () => {
        if (!pendingSignup) return;

        pendingSignup.code = generateCode();
        demoCodeDisplay.textContent = pendingSignup.code;
        verifyCodeInput.value = "";
        verifyCodeInput.focus();

        showToast("New code generated.", "success");
    });
}

if (changeEmailLink) {
    changeEmailLink.addEventListener("click", (e) => {
        e.preventDefault();
        pendingSignup = null;
        verifyView.style.display = "none";
        signupFormView.style.display = "block";
    });
}
