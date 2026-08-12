// =========================
// ACCOUNT SETTINGS
// =========================
// ⚠️ Same plaintext-password caveat as auth.js/index.js — this is
// demo-only. A real implementation checks/updates passwords on the
// server, never compares them in the browser.

const currentUser = getCurrentUser();

// Not signed in — nothing to show here
if (!currentUser) {
    window.location.href = "login.html";
}

const settingsForm = document.getElementById("settings-form");
const nameField = document.getElementById("settings-name");
const emailField = document.getElementById("settings-email");
const currentPasswordField = document.getElementById("settings-current-password");
const newPasswordField = document.getElementById("settings-new-password");
const confirmPasswordField = document.getElementById("settings-confirm-password");
const logoutLink = document.getElementById("settings-logout-link");

if (settingsForm && currentUser) {
    // Pre-fill with the signed-in user's current info
    nameField.value = currentUser.name || "";
    emailField.value = currentUser.email || "";

    settingsForm.addEventListener("submit", (e) => {
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

        const users = getUsers();
        const userIndex = users.findIndex(u => u.id === currentUser.id);

        if (userIndex === -1) {
            showToast("Something went wrong finding your account.");
            return;
        }

        // Email changed to one already used by a different account
        const emailTaken = users.some(u =>
            u.id !== currentUser.id &&
            u.email.toLowerCase() === emailField.value.trim().toLowerCase()
        );

        if (emailTaken) {
            showToast("That email is already in use by another account.");
            return;
        }

        const wantsPasswordChange =
            currentPasswordField.value.trim() !== "" ||
            newPasswordField.value.trim() !== "" ||
            confirmPasswordField.value.trim() !== "";

        let newPassword = users[userIndex].password;

        if (wantsPasswordChange) {
            if (currentPasswordField.value !== users[userIndex].password) {
                showToast("Current password is incorrect.");
                return;
            }

            if (newPasswordField.value.length < 8) {
                showToast("New password must be at least 8 characters.");
                return;
            }

            if (newPasswordField.value !== confirmPasswordField.value) {
                showToast("New passwords don't match.");
                return;
            }

            newPassword = newPasswordField.value;
        }

        users[userIndex] = {
            ...users[userIndex],
            name: nameField.value.trim(),
            email: emailField.value.trim(),
            password: newPassword
        };

        saveUsers(users);
        setCurrentUser(users[userIndex]);

        currentPasswordField.value = "";
        newPasswordField.value = "";
        confirmPasswordField.value = "";

        showToast("Settings saved.", "success");
    });
}

if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
        e.preventDefault();
        clearCurrentUser();
        window.location.href = "index.html";
    });
}
