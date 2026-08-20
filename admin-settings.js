// =========================
// ADMIN SETTINGS — real backend
// =========================
// Note: `currentAdmin` is already populated by admin.js's real
// GET /api/auth/me session check, loaded before this file runs.
// Passwords are hashed server-side now — the plaintext caveat that
// used to apply here no longer does.

const adminSettingsForm = document.getElementById("admin-settings-form");
const adminNameField = document.getElementById("admin-settings-name");
const adminEmailField = document.getElementById("admin-settings-email");
const adminCurrentPasswordField = document.getElementById("admin-settings-current-password");
const adminNewPasswordField = document.getElementById("admin-settings-new-password");
const adminConfirmPasswordField = document.getElementById("admin-settings-confirm-password");

if (adminSettingsForm && currentAdmin) {
    adminNameField.value = currentAdmin.name || "";
    adminEmailField.value = currentAdmin.email || "";

    adminSettingsForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (adminNameField.value.trim() === "" || adminEmailField.value.trim() === "") {
            showToast("Name and email can't be empty.");
            return;
        }

        if (!emailPattern.test(adminEmailField.value.trim())) {
            showToast("Please enter a valid email address.");
            return;
        }

        const wantsPasswordChange =
            adminCurrentPasswordField.value.trim() !== "" ||
            adminNewPasswordField.value.trim() !== "" ||
            adminConfirmPasswordField.value.trim() !== "";

        if (wantsPasswordChange && adminNewPasswordField.value !== adminConfirmPasswordField.value) {
            showToast("New passwords don't match.");
            return;
        }

        try {
            const updated = await apiFetch("/api/auth/me", {
                method: "PUT",
                body: JSON.stringify({
                    name: adminNameField.value.trim(),
                    email: adminEmailField.value.trim(),
                    currentPassword: wantsPasswordChange ? adminCurrentPasswordField.value : undefined,
                    newPassword: wantsPasswordChange ? adminNewPasswordField.value : undefined
                })
            });

            adminCurrentPasswordField.value = "";
            adminNewPasswordField.value = "";
            adminConfirmPasswordField.value = "";

            // Keep the topbar name/avatar in sync with the change we
            // just made, without needing a full page reload.
            const nameEl = document.getElementById("admin-user-name");
            const avatarEl = document.getElementById("admin-avatar-initial");
            if (nameEl) nameEl.textContent = updated.name;
            if (avatarEl) avatarEl.textContent = updated.name.trim().charAt(0).toUpperCase();

            showToast("Settings saved.", "success");
        } catch (err) {
            showToast(err.message);
        }
    });
}