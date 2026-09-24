// =========================
// DRIVERS (admin)
// =========================
// Real drivers assignable to a trip.

let drivers = [];
let deleteTargetId = null;

const tableBody = document.getElementById("drivers-table-body");

const driverModal = document.getElementById("driver-modal-overlay");
const driverModalTitle = document.getElementById("driver-modal-title");
const driverForm = document.getElementById("driver-form");

const driverIdField = document.getElementById("driver-id");
const driverNameField = document.getElementById("driver-name");
const driverLicenseField = document.getElementById("driver-license");
const driverPhoneField = document.getElementById("driver-phone");
const driverStatusField = document.getElementById("driver-status");

const deleteModal = document.getElementById("delete-modal-overlay");
const deleteConfirmText = document.getElementById("delete-confirm-text");

async function loadDrivers() {
    try {
        drivers = await apiFetch("/api/drivers");
        renderDrivers();
    } catch (err) {
        showToast(err.message);
        tableBody.innerHTML = `<tr><td colspan="5"><div class="admin-empty">Couldn't load drivers.</div></td></tr>`;
    }
}

function renderDrivers() {
    if (drivers.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="admin-empty">No drivers yet. Click "Add Driver" to add your first one.</div>
                </td>
            </tr>
        `;
        return;
    }

    const sorted = [...drivers].sort((a, b) => a.name.localeCompare(b.name));

    tableBody.innerHTML = sorted.map(d => `
        <tr>
            <td>${escapeHtml(d.name)}</td>
            <td>${escapeHtml(d.licenseNumber || "—")}</td>
            <td>${escapeHtml(d.phone)}</td>
            <td><span class="status-badge ${d.status}">${d.status === "active" ? "Active" : "Inactive"}</span></td>
            <td>
                <div class="admin-table-actions">
                    <button class="admin-icon-btn" data-edit="${d.id}" aria-label="Edit driver">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"></path></svg>
                    </button>
                    <button class="admin-icon-btn danger" data-delete="${d.id}" aria-label="Delete driver">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

function openDriverModal(driver) {
    if (driver) {
        driverModalTitle.textContent = "Edit Driver";
        driverIdField.value = driver.id;
        driverNameField.value = driver.name;
        driverLicenseField.value = driver.licenseNumber || "";
        driverPhoneField.value = driver.phone;
        driverStatusField.value = driver.status;
    } else {
        driverModalTitle.textContent = "Add Driver";
        driverForm.reset();
        driverIdField.value = "";
    }

    driverModal.classList.add("show");
}

function closeDriverModal() {
    driverModal.classList.remove("show");
}

document.getElementById("add-driver-btn").addEventListener("click", () => openDriverModal(null));
document.getElementById("driver-modal-close").addEventListener("click", closeDriverModal);
document.getElementById("driver-cancel-btn").addEventListener("click", closeDriverModal);

driverModal.addEventListener("click", (e) => {
    if (e.target === driverModal) closeDriverModal();
});

driverForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (driverNameField.value.trim() === "" || driverPhoneField.value.trim() === "") {
        showToast("Please fill in the driver's name and phone.");
        return;
    }

    const editingId = driverIdField.value || null;

    const driverData = {
        name: driverNameField.value.trim(),
        licenseNumber: driverLicenseField.value.trim(),
        phone: driverPhoneField.value.trim(),
        status: driverStatusField.value
    };

    try {
        if (editingId) {
            await apiFetch(`/api/drivers/${editingId}`, {
                method: "PUT",
                body: JSON.stringify(driverData)
            });
            showToast("Driver updated.", "success");
        } else {
            await apiFetch("/api/drivers", {
                method: "POST",
                body: JSON.stringify(driverData)
            });
            showToast("Driver added.", "success");
        }

        await loadDrivers();
        closeDriverModal();
    } catch (err) {
        showToast(err.message);
    }
});

// Edit / delete buttons (event delegation)
tableBody.addEventListener("click", (e) => {
    const editBtn = e.target.closest("[data-edit]");
    const deleteBtn = e.target.closest("[data-delete]");

    if (editBtn) {
        const driver = drivers.find(d => d.id === editBtn.dataset.edit);
        if (driver) openDriverModal(driver);
    }

    if (deleteBtn) {
        deleteTargetId = deleteBtn.dataset.delete;
        const driver = drivers.find(d => d.id === deleteTargetId);
        if (driver) {
            deleteConfirmText.textContent =
                `Delete ${driver.name}? This can't be undone.`;
        }
        deleteModal.classList.add("show");
    }
});

document.getElementById("delete-modal-close").addEventListener("click", () => {
    deleteModal.classList.remove("show");
});

document.getElementById("delete-cancel-btn").addEventListener("click", () => {
    deleteModal.classList.remove("show");
});

deleteModal.addEventListener("click", (e) => {
    if (e.target === deleteModal) deleteModal.classList.remove("show");
});

document.getElementById("delete-confirm-btn").addEventListener("click", async () => {
    try {
        await apiFetch(`/api/drivers/${deleteTargetId}`, { method: "DELETE" });
        deleteModal.classList.remove("show");
        await loadDrivers();
        showToast("Driver deleted.", "success");
    } catch (err) {
        showToast(err.message);
    }
});

loadDrivers();