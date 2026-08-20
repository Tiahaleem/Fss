// =========================
// ACCOUNT SETTINGS — real backend
// =========================
// Same plaintext-in-the-browser caveat no longer applies here —
// passwords are hashed server-side now (bcrypt), and this page only
// ever sends the new password over the wire, never stores it.

const settingsForm = document.getElementById("settings-form");
const nameField = document.getElementById("settings-name");
const emailField = document.getElementById("settings-email");
const currentPasswordField = document.getElementById("settings-current-password");
const newPasswordField = document.getElementById("settings-new-password");
const confirmPasswordField = document.getElementById("settings-confirm-password");
const logoutLink = document.getElementById("settings-logout-link");

async function loadSettings() {
    if (!settingsForm) return;

    if (!getCustomerToken()) {
        window.location.href = "login.html";
        return;
    }

    try {
        const user = await apiFetch("/api/auth/me", { asCustomer: true });
        nameField.value = user.name || "";
        emailField.value = user.email || "";
    } catch (err) {
        window.location.href = "login.html";
    }
}

loadSettings();

if (settingsForm) {
    settingsForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (nameField.value.trim() === "" || emailField.value.trim() === "") {
            showToast("Name and email can't be empty.");
            return;
        }

        if (!emailPattern.test(emailField.value.trim())) {
            showToast("Please enter a valid email address.");
            return;
        }

        const wantsPasswordChange =
            currentPasswordField.value.trim() !== "" ||
            newPasswordField.value.trim() !== "" ||
            confirmPasswordField.value.trim() !== "";

        if (wantsPasswordChange && newPasswordField.value !== confirmPasswordField.value) {
            showToast("New passwords don't match.");
            return;
        }

        try {
            await apiFetch("/api/auth/me", {
                method: "PUT",
                asCustomer: true,
                body: JSON.stringify({
                    name: nameField.value.trim(),
                    email: emailField.value.trim(),
                    currentPassword: wantsPasswordChange ? currentPasswordField.value : undefined,
                    newPassword: wantsPasswordChange ? newPasswordField.value : undefined
                })
            });

            currentPasswordField.value = "";
            newPasswordField.value = "";
            confirmPasswordField.value = "";

            showToast("Settings saved.", "success");
        } catch (err) {
            showToast(err.message);
        }
    });
}

if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
        e.preventDefault();
        clearCustomerToken();
        window.location.href = "index.html";
    });
}