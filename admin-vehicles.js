// =========================
// VEHICLES (admin)
// =========================
// Real vehicles the business owns. Trips get assigned to one of
// these — the backend rejects any trip that would double-book a
// vehicle at an overlapping time.

let vehicles = [];
let deleteTargetId = null;

const tableBody = document.getElementById("vehicles-table-body");

const vehicleModal = document.getElementById("vehicle-modal-overlay");
const vehicleModalTitle = document.getElementById("vehicle-modal-title");
const vehicleForm = document.getElementById("vehicle-form");

const vehicleIdField = document.getElementById("vehicle-id");
const vehicleNameField = document.getElementById("vehicle-name");
const vehiclePlateField = document.getElementById("vehicle-plate");
const vehicleSeatsField = document.getElementById("vehicle-seats");
const vehicleStatusField = document.getElementById("vehicle-status");

const deleteModal = document.getElementById("delete-modal-overlay");
const deleteConfirmText = document.getElementById("delete-confirm-text");

async function loadVehicles() {
    try {
        vehicles = await apiFetch("/api/vehicles");
        renderVehicles();
    } catch (err) {
        showToast(err.message);
        tableBody.innerHTML = `<tr><td colspan="5"><div class="admin-empty">Couldn't load vehicles.</div></td></tr>`;
    }
}

function renderVehicles() {
    if (vehicles.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="admin-empty">No vehicles yet. Click "Add Vehicle" to add your first one.</div>
                </td>
            </tr>
        `;
        return;
    }

    const sorted = [...vehicles].sort((a, b) => a.name.localeCompare(b.name));

    tableBody.innerHTML = sorted.map(v => `
        <tr>
            <td>${escapeHtml(v.name)}</td>
            <td>${escapeHtml(v.plateNumber || "—")}</td>
            <td>${v.seats}</td>
            <td><span class="status-badge ${v.status}">${v.status === "active" ? "Active" : "Inactive"}</span></td>
            <td>
                <div class="admin-table-actions">
                    <button class="admin-icon-btn" data-edit="${v.id}" aria-label="Edit vehicle">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"></path></svg>
                    </button>
                    <button class="admin-icon-btn danger" data-delete="${v.id}" aria-label="Delete vehicle">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

function openVehicleModal(vehicle) {
    if (vehicle) {
        vehicleModalTitle.textContent = "Edit Vehicle";
        vehicleIdField.value = vehicle.id;
        vehicleNameField.value = vehicle.name;
        vehiclePlateField.value = vehicle.plateNumber || "";
        vehicleSeatsField.value = vehicle.seats;
        vehicleStatusField.value = vehicle.status;
    } else {
        vehicleModalTitle.textContent = "Add Vehicle";
        vehicleForm.reset();
        vehicleIdField.value = "";
    }

    vehicleModal.classList.add("show");
}

function closeVehicleModal() {
    vehicleModal.classList.remove("show");
}

document.getElementById("add-vehicle-btn").addEventListener("click", () => openVehicleModal(null));
document.getElementById("vehicle-modal-close").addEventListener("click", closeVehicleModal);
document.getElementById("vehicle-cancel-btn").addEventListener("click", closeVehicleModal);

vehicleModal.addEventListener("click", (e) => {
    if (e.target === vehicleModal) closeVehicleModal();
});

vehicleForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (vehicleNameField.value.trim() === "" || !vehicleSeatsField.value) {
        showToast("Please fill in the vehicle name and seats.");
        return;
    }

    const editingId = vehicleIdField.value || null;

    const vehicleData = {
        name: vehicleNameField.value.trim(),
        plateNumber: vehiclePlateField.value.trim(),
        seats: Number(vehicleSeatsField.value),
        status: vehicleStatusField.value
    };

    try {
        if (editingId) {
            await apiFetch(`/api/vehicles/${editingId}`, {
                method: "PUT",
                body: JSON.stringify(vehicleData)
            });
            showToast("Vehicle updated.", "success");
        } else {
            await apiFetch("/api/vehicles", {
                method: "POST",
                body: JSON.stringify(vehicleData)
            });
            showToast("Vehicle added.", "success");
        }

        await loadVehicles();
        closeVehicleModal();
    } catch (err) {
        showToast(err.message);
    }
});

// Edit / delete buttons (event delegation)
tableBody.addEventListener("click", (e) => {
    const editBtn = e.target.closest("[data-edit]");
    const deleteBtn = e.target.closest("[data-delete]");

    if (editBtn) {
        const vehicle = vehicles.find(v => v.id === editBtn.dataset.edit);
        if (vehicle) openVehicleModal(vehicle);
    }

    if (deleteBtn) {
        deleteTargetId = deleteBtn.dataset.delete;
        const vehicle = vehicles.find(v => v.id === deleteTargetId);
        if (vehicle) {
            deleteConfirmText.textContent =
                `Delete ${vehicle.name}? This can't be undone.`;
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
        await apiFetch(`/api/vehicles/${deleteTargetId}`, { method: "DELETE" });
        deleteModal.classList.remove("show");
        await loadVehicles();
        showToast("Vehicle deleted.", "success");
    } catch (err) {
        showToast(err.message);
    }
});

loadVehicles();