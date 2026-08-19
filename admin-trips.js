// =========================
// TRIPS & SCHEDULE (admin)
// =========================
// Now talks to the real backend (GET/POST/PUT/DELETE /api/trips)
// instead of localStorage. Each trip belongs to a real route via
// routeId — the form now uses a dropdown of actual existing routes
// instead of free-text From/To boxes, so there's no way to create a
// trip for a route that doesn't exist or has a typo.

let trips = [];
let availableRoutes = [];
let deleteTargetId = null;

const tableBody = document.getElementById("trips-table-body");

const tripModal = document.getElementById("trip-modal-overlay");
const tripModalTitle = document.getElementById("trip-modal-title");
const tripForm = document.getElementById("trip-form");

const tripIdField = document.getElementById("trip-id");
const tripRouteField = document.getElementById("trip-route");
const tripTimeField = document.getElementById("trip-time");
const tripVehicleField = document.getElementById("trip-vehicle");
const tripSeatsField = document.getElementById("trip-seats");
const tripStatusField = document.getElementById("trip-status");

const deleteModal = document.getElementById("delete-modal-overlay");
const deleteConfirmText = document.getElementById("delete-confirm-text");

async function loadRoutesForDropdown() {
    try {
        availableRoutes = await apiFetch("/api/routes");

        if (availableRoutes.length === 0) {
            tripRouteField.innerHTML = `<option value="">No routes exist yet — add one first</option>`;
            return;
        }

        tripRouteField.innerHTML = availableRoutes
            .map(r => `<option value="${r.id}">${r.from} → ${r.to}</option>`)
            .join("");
    } catch (err) {
        tripRouteField.innerHTML = `<option value="">Couldn't load routes</option>`;
        showToast(err.message);
    }
}

async function loadTrips() {
    try {
        trips = await apiFetch("/api/trips");
        renderTrips();
    } catch (err) {
        showToast(err.message);
        tableBody.innerHTML = `<tr><td colspan="6"><div class="admin-empty">Couldn't load trips.</div></td></tr>`;
    }
}

function renderTrips() {
    if (trips.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="admin-empty">No trips yet. Click "Add Trip" to create one.</div>
                </td>
            </tr>
        `;
        return;
    }

    const sorted = [...trips].sort((a, b) => {
        const routeA = `${a.from}-${a.to}`;
        const routeB = `${b.from}-${b.to}`;
        if (routeA !== routeB) return routeA.localeCompare(routeB);
        return a.time.localeCompare(b.time);
    });

    tableBody.innerHTML = sorted.map(trip => `
        <tr>
            <td>${trip.from} → ${trip.to}</td>
            <td>${trip.time}</td>
            <td>${trip.vehicle}</td>
            <td>${trip.seats}</td>
            <td><span class="status-badge ${trip.status}">${trip.status === "active" ? "Active" : "Inactive"}</span></td>
            <td>
                <div class="admin-table-actions">
                    <button class="admin-icon-btn" data-edit="${trip.id}" aria-label="Edit trip">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"></path></svg>
                    </button>
                    <button class="admin-icon-btn danger" data-delete="${trip.id}" aria-label="Delete trip">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

function openTripModal(trip) {
    if (trip) {
        tripModalTitle.textContent = "Edit Trip";
        tripIdField.value = trip.id;
        tripRouteField.value = trip.routeId;
        tripTimeField.value = trip.time;
        tripVehicleField.value = trip.vehicle;
        tripSeatsField.value = trip.seats;
        tripStatusField.value = trip.status;
    } else {
        tripModalTitle.textContent = "Add Trip";
        tripForm.reset();
        tripIdField.value = "";
        tripVehicleField.value = "Honda Odyssey";
        tripSeatsField.value = 7;
    }

    tripModal.classList.add("show");
}

function closeTripModal() {
    tripModal.classList.remove("show");
}

document.getElementById("add-trip-btn").addEventListener("click", () => openTripModal(null));
document.getElementById("trip-modal-close").addEventListener("click", closeTripModal);
document.getElementById("trip-cancel-btn").addEventListener("click", closeTripModal);

tripModal.addEventListener("click", (e) => {
    if (e.target === tripModal) closeTripModal();
});

tripForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (
        !tripRouteField.value ||
        tripTimeField.value.trim() === "" ||
        tripVehicleField.value.trim() === "" ||
        tripSeatsField.value.trim() === ""
    ) {
        showToast("Please fill in every field.");
        return;
    }

    const editingId = tripIdField.value || null;

    const tripData = {
        routeId: tripRouteField.value,
        time: tripTimeField.value,
        vehicle: tripVehicleField.value.trim(),
        seats: Number(tripSeatsField.value),
        status: tripStatusField.value
    };

    try {
        if (editingId) {
            await apiFetch(`/api/trips/${editingId}`, {
                method: "PUT",
                body: JSON.stringify(tripData)
            });
            showToast("Trip updated.", "success");
        } else {
            await apiFetch("/api/trips", {
                method: "POST",
                body: JSON.stringify(tripData)
            });
            showToast("Trip added.", "success");
        }

        await loadTrips();
        closeTripModal();
    } catch (err) {
        showToast(err.message);
    }
});

// Edit / delete buttons (event delegation)
tableBody.addEventListener("click", (e) => {
    const editBtn = e.target.closest("[data-edit]");
    const deleteBtn = e.target.closest("[data-delete]");

    if (editBtn) {
        const trip = trips.find(t => t.id === editBtn.dataset.edit);
        if (trip) openTripModal(trip);
    }

    if (deleteBtn) {
        deleteTargetId = deleteBtn.dataset.delete;
        const trip = trips.find(t => t.id === deleteTargetId);
        if (trip) {
            deleteConfirmText.textContent =
                `Delete the ${trip.from} → ${trip.to} departure at ${trip.time}? This can't be undone.`;
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
        await apiFetch(`/api/trips/${deleteTargetId}`, { method: "DELETE" });
        deleteModal.classList.remove("show");
        await loadTrips();
        showToast("Trip deleted.", "success");
    } catch (err) {
        showToast(err.message);
    }
});

loadRoutesForDropdown();
loadTrips();