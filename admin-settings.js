// =========================
// ADMIN SETTINGS
// =========================
// Note: `currentAdmin` is already declared by admin.js (loaded
// before this file) and the login guard there has already run —
// if we've reached this point, currentAdmin is guaranteed non-null.
// Same plaintext-password caveat as everywhere else: demo only.

const adminSettingsForm = document.getElementById("admin-settings-form");
const adminNameField = document.getElementById("admin-settings-name");
const adminEmailField = document.getElementById("admin-settings-email");
const adminCurrentPasswordField = document.getElementById("admin-settings-current-password");
const adminNewPasswordField = document.getElementById("admin-settings-new-password");
const adminConfirmPasswordField = document.getElementById("admin-settings-confirm-password");

if (adminSettingsForm && currentAdmin) {
    adminNameField.value = currentAdmin.name || "";
    adminEmailField.value = currentAdmin.email || "";

    adminSettingsForm.addEventListener("submit", (e) => {
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

        const admins = getAdminUsers();
        const adminIndex = admins.findIndex(a => a.id === currentAdmin.id);

        if (adminIndex === -1) {
            showToast("Something went wrong finding your account.");
            return;
        }

        const emailTaken = admins.some(a =>
            a.id !== currentAdmin.id &&
            a.email.toLowerCase() === adminEmailField.value.trim().toLowerCase()
        );

        if (emailTaken) {
            showToast("That email is already used by another admin account.");
            return;
        }

        const wantsPasswordChange =
            adminCurrentPasswordField.value.trim() !== "" ||
            adminNewPasswordField.value.trim() !== "" ||
            adminConfirmPasswordField.value.trim() !== "";

        let newPassword = admins[adminIndex].password;

        if (wantsPasswordChange) {
            if (adminCurrentPasswordField.value !== admins[adminIndex].password) {
                showToast("Current password is incorrect.");
                return;
            }

            if (adminNewPasswordField.value.length < 8) {
                showToast("New password must be at least 8 characters.");
                return;
            }

            if (adminNewPasswordField.value !== adminConfirmPasswordField.value) {
                showToast("New passwords don't match.");
                return;
            }

            newPassword = adminNewPasswordField.value;
        }

        admins[adminIndex] = {
            ...admins[adminIndex],
            name: adminNameField.value.trim(),
            email: adminEmailField.value.trim(),
            password: newPassword
        };

        saveAdminUsers(admins);
        setCurrentAdmin(admins[adminIndex]);

        adminCurrentPasswordField.value = "";
        adminNewPasswordField.value = "";
        adminConfirmPasswordField.value = "";

        // Keep the topbar name/avatar in sync with the change we
        // just made, without needing a full page reload.
        const nameEl = document.getElementById("admin-user-name");
        const avatarEl = document.getElementById("admin-avatar-initial");
        if (nameEl) nameEl.textContent = admins[adminIndex].name;
        if (avatarEl) avatarEl.textContent = admins[adminIndex].name.trim().charAt(0).toUpperCase();

        showToast("Settings saved.", "success");
    });
}
