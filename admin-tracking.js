// =========================
// TRACKING (admin)
// =========================
// Bookings table: GET /api/bookings (admin-only, read-only — bookings
// only get created by real customer checkouts, never invented here).
// Timeline Events table: full CRUD via /api/events, but every event
// must belong to a real, existing booking reference — no more typing
// any reference you like.

let events = [];
let deleteTargetId = null;

const bookingsTableBody = document.getElementById("bookings-table-body");

function money(kobo) {
    return "₦" + (Number(kobo) / 100).toLocaleString();
}

async function loadBookings() {
    try {
        const bookings = await apiFetch("/api/bookings");

        if (bookings.length === 0) {
            bookingsTableBody.innerHTML = `
                <tr>
                    <td colspan="10">
                        <div class="admin-empty">No bookings yet — they'll show up here as customers pay on the courier and passenger pages.</div>
                    </td>
                </tr>
            `;
            return;
        }

        const sorted = [...bookings].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        bookingsTableBody.innerHTML = sorted.map(b => {
            const isParcel = b.type === "parcel";

            const customer = isParcel ? b.sender_name : b.passenger_name;
            const phone = isParcel ? b.sender_phone : b.passenger_phone;
            const recipient = isParcel ? `${b.receiver_name}<br><span style="color:var(--color-text-muted); font-size:.8rem;">${b.receiver_phone}</span>` : "—";
            const route = isParcel ? `${b.from_city} → ${b.to_city}` : "—";
            const seats = isParcel ? "—" : (b.seat_numbers || "—");

            const statusLabel = b.status.charAt(0).toUpperCase() + b.status.slice(1);
            const statusClass = b.status === "confirmed" ? "active" : "inactive";

            let actions = `<button class="admin-btn-secondary" data-manage="${b.reference}" style="white-space:nowrap;">Manage Timeline</button>`;

            if (b.status === "confirmed") {
                actions += ` <button class="admin-btn-secondary" data-cancel="${b.reference}" style="white-space:nowrap;">Cancel</button>`;
            }
            if (b.status !== "refunded") {
                actions += ` <button class="admin-btn-secondary" data-refund="${b.reference}" style="white-space:nowrap;">Refund</button>`;
            }

            return `
                <tr>
                    <td>${b.reference}</td>
                    <td><span class="status-badge ${isParcel ? "inactive" : "active"}">${isParcel ? "Parcel" : "Passenger"}</span></td>
                    <td>${customer}</td>
                    <td>${phone}</td>
                    <td>${recipient}</td>
                    <td>${route}</td>
                    <td>${seats}</td>
                    <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                    <td>${money(b.price_kobo)}</td>
                    <td>${actions}</td>
                </tr>
            `;
        }).join("");
    } catch (err) {
        showToast(err.message);
        bookingsTableBody.innerHTML = `<tr><td colspan="10"><div class="admin-empty">Couldn't load bookings.</div></td></tr>`;
    }
}

const bookingActionModal = document.getElementById("booking-action-modal-overlay");
const bookingActionTitle = document.getElementById("booking-action-modal-title");
const bookingActionText = document.getElementById("booking-action-modal-text");
const bookingActionConfirmBtn = document.getElementById("booking-action-confirm-btn");
const bookingActionCancelBtn = document.getElementById("booking-action-cancel-btn");
const bookingActionModalClose = document.getElementById("booking-action-modal-close");

let pendingBookingAction = null; // { type: "cancel" | "refund", reference, triggerBtn }

function openBookingActionModal(type, reference, triggerBtn) {
    pendingBookingAction = { type, reference, triggerBtn };

    if (type === "cancel") {
        bookingActionTitle.textContent = "Cancel this booking?";
        bookingActionText.textContent = `This releases any held seats for ${reference} immediately. This can't be undone.`;
        bookingActionConfirmBtn.textContent = "Cancel Booking";
        bookingActionConfirmBtn.style.background = "#fee2e2";
        bookingActionConfirmBtn.style.color = "#dc2626";
    } else {
        bookingActionTitle.textContent = "Refund this booking?";
        bookingActionText.textContent = `This issues a REAL refund through Paystack for ${reference}, reversing the actual charge. This can't be undone.`;
        bookingActionConfirmBtn.textContent = "Refund";
        bookingActionConfirmBtn.style.background = "#fee2e2";
        bookingActionConfirmBtn.style.color = "#dc2626";
    }

    bookingActionModal.classList.add("show");
}

function closeBookingActionModal() {
    bookingActionModal.classList.remove("show");
    pendingBookingAction = null;
}

bookingActionModalClose.addEventListener("click", closeBookingActionModal);
bookingActionCancelBtn.addEventListener("click", closeBookingActionModal);
bookingActionModal.addEventListener("click", (e) => {
    if (e.target === bookingActionModal) closeBookingActionModal();
});

bookingActionConfirmBtn.addEventListener("click", async () => {
    if (!pendingBookingAction) return;

    const { type, reference, triggerBtn } = pendingBookingAction;
    bookingActionConfirmBtn.disabled = true;

    try {
        await apiFetch(`/api/bookings/${reference}/${type}`, { method: "POST" });
        showToast(type === "cancel" ? "Booking cancelled." : "Refund processed.", "success");
        closeBookingActionModal();
        loadBookings();
    } catch (err) {
        showToast(err.message);
        bookingActionConfirmBtn.disabled = false;
    }
});

bookingsTableBody.addEventListener("click", (e) => {
    const manageBtn = e.target.closest("[data-manage]");
    const cancelBtn = e.target.closest("[data-cancel]");
    const refundBtn = e.target.closest("[data-refund]");

    if (manageBtn) {
        openEventModal(null);
        eventReferenceField.value = manageBtn.dataset.manage;

        // Suggest the next order number for this reference automatically
        const existingForRef = events.filter(ev => ev.reference === manageBtn.dataset.manage);
        eventOrderField.value = existingForRef.length
            ? Math.max(...existingForRef.map(ev => ev.order)) + 1
            : 1;
        return;
    }

    if (cancelBtn) {
        openBookingActionModal("cancel", cancelBtn.dataset.cancel, cancelBtn);
        return;
    }

    if (refundBtn) {
        openBookingActionModal("refund", refundBtn.dataset.refund, refundBtn);
    }
});

const tableBody = document.getElementById("events-table-body");

const eventModal = document.getElementById("event-modal-overlay");
const eventModalTitle = document.getElementById("event-modal-title");
const eventForm = document.getElementById("event-form");

const eventIdField = document.getElementById("event-id");
const eventReferenceField = document.getElementById("event-reference");
const eventOrderField = document.getElementById("event-order");
const eventTitleField = document.getElementById("event-title");
const eventTimeField = document.getElementById("event-time");
const eventStatusField = document.getElementById("event-status");
const eventIconField = document.getElementById("event-icon");

const deleteModal = document.getElementById("delete-modal-overlay");
const deleteConfirmText = document.getElementById("delete-confirm-text");

function statusLabel(status) {
    if (status === "completed") return "Completed";
    if (status === "active") return "Active";
    return "Pending";
}

async function loadEvents() {
    try {
        events = await apiFetch("/api/events");
        renderEvents();
    } catch (err) {
        showToast(err.message);
        tableBody.innerHTML = `<tr><td colspan="6"><div class="admin-empty">Couldn't load events.</div></td></tr>`;
    }
}

function renderEvents() {
    if (events.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="admin-empty">No tracking events yet. Click "Add Event" to create one.</div>
                </td>
            </tr>
        `;
        return;
    }

    const sorted = [...events].sort((a, b) =>
        a.reference === b.reference ? a.order - b.order : a.reference.localeCompare(b.reference)
    );

    tableBody.innerHTML = sorted.map(ev => `
        <tr>
            <td>${ev.reference}</td>
            <td>${ev.order}</td>
            <td>${ev.title}</td>
            <td>${ev.time}</td>
            <td><span class="status-badge ${ev.status === "completed" ? "active" : "inactive"}">${statusLabel(ev.status)}</span></td>
            <td>
                <div class="admin-table-actions">
                    <button class="admin-icon-btn" data-edit="${ev.id}" aria-label="Edit event">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"></path></svg>
                    </button>
                    <button class="admin-icon-btn danger" data-delete="${ev.id}" aria-label="Delete event">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

function openEventModal(event) {
    if (event) {
        eventModalTitle.textContent = "Edit Event";
        eventIdField.value = event.id;
        eventReferenceField.value = event.reference;
        eventReferenceField.disabled = true; // which booking an event belongs to can't be changed once created
        eventOrderField.value = event.order;
        eventTitleField.value = event.title;
        eventTimeField.value = event.time;
        eventStatusField.value = event.status;
        eventIconField.value = event.icon || "location";
    } else {
        eventModalTitle.textContent = "Add Event";
        eventForm.reset();
        eventIdField.value = "";
        eventReferenceField.disabled = false;
        eventIconField.value = "location";
    }

    eventModal.classList.add("show");
}

function closeEventModal() {
    eventModal.classList.remove("show");
}

document.getElementById("add-event-btn").addEventListener("click", () => openEventModal(null));
document.getElementById("event-modal-close").addEventListener("click", closeEventModal);
document.getElementById("event-cancel-btn").addEventListener("click", closeEventModal);

eventModal.addEventListener("click", (e) => {
    if (e.target === eventModal) closeEventModal();
});

eventForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (
        eventReferenceField.value.trim() === "" ||
        eventOrderField.value.trim() === "" ||
        eventTitleField.value.trim() === "" ||
        eventTimeField.value.trim() === ""
    ) {
        showToast("Please fill in every field.");
        return;
    }

    const editingId = eventIdField.value || null;

    const eventData = {
        reference: eventReferenceField.value.trim(),
        order: Number(eventOrderField.value),
        title: eventTitleField.value.trim(),
        time: eventTimeField.value.trim(),
        status: eventStatusField.value,
        icon: eventIconField.value
    };

    try {
        if (editingId) {
            // reference can't change on an edit — leave it out of the PUT body
            const { reference, ...editableFields } = eventData;
            await apiFetch(`/api/events/${editingId}`, {
                method: "PUT",
                body: JSON.stringify(editableFields)
            });
            showToast("Event updated.", "success");
        } else {
            await apiFetch("/api/events", {
                method: "POST",
                body: JSON.stringify(eventData)
            });
            showToast("Event added.", "success");
        }

        await loadEvents();
        closeEventModal();
    } catch (err) {
        showToast(err.message);
    }
});

// Edit / delete buttons (event delegation)
tableBody.addEventListener("click", (e) => {
    const editBtn = e.target.closest("[data-edit]");
    const deleteBtn = e.target.closest("[data-delete]");

    if (editBtn) {
        const event = events.find(ev => ev.id === editBtn.dataset.edit);
        if (event) openEventModal(event);
    }

    if (deleteBtn) {
        deleteTargetId = deleteBtn.dataset.delete;
        const event = events.find(ev => ev.id === deleteTargetId);
        if (event) {
            deleteConfirmText.textContent =
                `Delete "${event.title}" from ${event.reference}? This can't be undone.`;
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
        await apiFetch(`/api/events/${deleteTargetId}`, { method: "DELETE" });
        deleteModal.classList.remove("show");
        await loadEvents();
        showToast("Event deleted.", "success");
    } catch (err) {
        showToast(err.message);
    }
});

loadBookings();
loadEvents();