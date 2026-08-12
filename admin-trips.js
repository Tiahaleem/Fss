// =========================
// TRIPS & SCHEDULE (admin)
// =========================
// Reads/writes the shared trips store in index.js (localStorage
// under the hood), so edits persist across page reloads within the
// same browser. Once a backend exists, getTrips()/saveTrips() there
// become real API calls instead.

let trips = getTrips();

let nextId = trips.length ? Math.max(...trips.map(t => t.id)) + 1 : 1;
let deleteTargetId = null;

const tableBody = document.getElementById("trips-table-body");

const tripModal = document.getElementById("trip-modal-overlay");
const tripModalTitle = document.getElementById("trip-modal-title");
const tripForm = document.getElementById("trip-form");

const tripIdField = document.getElementById("trip-id");
const tripFromField = document.getElementById("trip-from");
const tripToField = document.getElementById("trip-to");
const tripTimeField = document.getElementById("trip-time");
const tripVehicleField = document.getElementById("trip-vehicle");
const tripSeatsField = document.getElementById("trip-seats");
const tripStatusField = document.getElementById("trip-status");

const deleteModal = document.getElementById("delete-modal-overlay");
const deleteConfirmText = document.getElementById("delete-confirm-text");

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

    // Group visually by route order, then by time, for a readable table
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
        tripFromField.value = trip.from;
        tripToField.value = trip.to;
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

tripForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (
        tripFromField.value.trim() === "" ||
        tripToField.value.trim() === "" ||
        tripTimeField.value.trim() === "" ||
        tripVehicleField.value.trim() === "" ||
        tripSeatsField.value.trim() === ""
    ) {
        showToast("Please fill in every field.");
        return;
    }

    const editingId = tripIdField.value ? Number(tripIdField.value) : null;

    const tripData = {
        from: tripFromField.value.trim(),
        to: tripToField.value.trim(),
        time: tripTimeField.value,
        vehicle: tripVehicleField.value.trim(),
        seats: Number(tripSeatsField.value),
        status: tripStatusField.value
    };

    if (editingId) {
        trips = trips.map(t => t.id === editingId ? { ...t, ...tripData } : t);
        showToast("Trip updated.", "success");
    } else {
        trips.push({ id: nextId++, ...tripData });
        showToast("Trip added.", "success");
    }

    saveTrips(trips);
    renderTrips();
    closeTripModal();
});

// Edit / delete buttons (event delegation)
tableBody.addEventListener("click", (e) => {
    const editBtn = e.target.closest("[data-edit]");
    const deleteBtn = e.target.closest("[data-delete]");

    if (editBtn) {
        const trip = trips.find(t => t.id === Number(editBtn.dataset.edit));
        if (trip) openTripModal(trip);
    }

    if (deleteBtn) {
        deleteTargetId = Number(deleteBtn.dataset.delete);
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

document.getElementById("delete-confirm-btn").addEventListener("click", () => {
    trips = trips.filter(t => t.id !== deleteTargetId);
    saveTrips(trips);
    deleteModal.classList.remove("show");
    renderTrips();
    showToast("Trip deleted.", "success");
});

renderTrips();
