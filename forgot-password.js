// =========================
// FORGOT PASSWORD
// =========================
// Same two-step shape as signup's verification step, reusing the
// same "demo code shown on screen" fallback for whenever a real
// email can't be delivered yet.

const requestView = document.getElementById("request-view");
const requestForm = document.getElementById("request-form");
const requestEmailInput = document.getElementById("request-email");

const resetView = document.getElementById("reset-view");
const resetEmailTarget = document.getElementById("reset-email-target");
const demoCodeBanner = document.getElementById("reset-demo-code-banner");
const demoCodeDisplay = document.getElementById("reset-demo-code-display");
const resetForm = document.getElementById("reset-form");
const resetCodeInput = document.getElementById("reset-code-input");
const resetNewPassword = document.getElementById("reset-new-password");
const resetConfirmPassword = document.getElementById("reset-confirm-password");
const resendBtn = document.getElementById("reset-resend-btn");
const changeEmailLink = document.getElementById("reset-change-email-link");

let pendingResetEmail = null;

function showResetStep(email, devCode) {
    pendingResetEmail = email;
    resetEmailTarget.textContent = email;
    resetCodeInput.value = "";

    if (devCode) {
        demoCodeDisplay.textContent = devCode;
        demoCodeBanner.style.display = "block";
    } else {
        demoCodeBanner.style.display = "none";
    }

    requestView.style.display = "none";
    resetView.style.display = "block";
    resetCodeInput.focus();
}

requestForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = requestEmailInput.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
        showToast("Please enter a valid email address.");
        return;
    }

    try {
        const result = await apiFetch("/api/auth/forgot-password", {
            method: "POST",
            body: JSON.stringify({ email })
        });

        showResetStep(email, result._devCode);
        showToast(result.message, "success");
    } catch (err) {
        showToast(err.message);
    }
});

resetForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!pendingResetEmail) {
        showToast("Something went wrong — please start over.");
        return;
    }

    if (resetNewPassword.value.length < 8) {
        showToast("New password must be at least 8 characters.");
        return;
    }

    if (resetNewPassword.value !== resetConfirmPassword.value) {
        showToast("Passwords don't match.");
        return;
    }

    try {
        await apiFetch("/api/auth/reset-password", {
            method: "POST",
            body: JSON.stringify({
                email: pendingResetEmail,
                code: resetCodeInput.value.trim(),
                newPassword: resetNewPassword.value
            })
        });

        showToast("Password reset — you can sign in now.", "success");

        setTimeout(() => {
            window.location.href = "login.html";
        }, 1200);
    } catch (err) {
        showToast(err.message);
    }
});

resendBtn.addEventListener("click", async () => {
    if (!pendingResetEmail) return;

    try {
        const result = await apiFetch("/api/auth/forgot-password", {
            method: "POST",
            body: JSON.stringify({ email: pendingResetEmail })
        });

        if (result._devCode) {
            demoCodeDisplay.textContent = result._devCode;
            demoCodeBanner.style.display = "block";
        }

        resetCodeInput.value = "";
        resetCodeInput.focus();
        showToast("New code sent.", "success");
    } catch (err) {
        showToast(err.message);
    }
});

changeEmailLink.addEventListener("click", (e) => {
    e.preventDefault();
    pendingResetEmail = null;
    resetView.style.display = "none";
    requestView.style.display = "block";
});
