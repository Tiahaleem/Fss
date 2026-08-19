// =========================
// ROUTES & PRICING (admin)
// =========================
// Now talks to the real backend (GET/POST/PUT/DELETE /api/routes)
// instead of localStorage. IDs are real UUIDs from the database now,
// not the old auto-incrementing numbers.

let routes = [];
let deleteTargetId = null;

const tableBody = document.getElementById("routes-table-body");

const routeModal = document.getElementById("route-modal-overlay");
const routeModalTitle = document.getElementById("route-modal-title");
const routeForm = document.getElementById("route-form");

const routeIdField = document.getElementById("route-id");
const routeFromField = document.getElementById("route-from");
const routeToField = document.getElementById("route-to");
const routeDistanceField = document.getElementById("route-distance");
const routeDurationField = document.getElementById("route-duration");
const routePriceField = document.getElementById("route-price");
const routeStatusField = document.getElementById("route-status");

const deleteModal = document.getElementById("delete-modal-overlay");
const deleteConfirmText = document.getElementById("delete-confirm-text");

function money(value) {
    return "₦" + Number(value).toLocaleString();
}

async function loadRoutes() {
    try {
        routes = await apiFetch("/api/routes");
        renderRoutes();
    } catch (err) {
        showToast(err.message);
        tableBody.innerHTML = `<tr><td colspan="7"><div class="admin-empty">Couldn't load routes.</div></td></tr>`;
    }
}

function renderRoutes() {
    if (routes.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="admin-empty">No routes yet. Click "Add Route" to create one.</div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = routes.map(route => `
        <tr>
            <td>${route.from}</td>
            <td>${route.to}</td>
            <td>${route.distance} km</td>
            <td>${route.duration}</td>
            <td>${money(route.price)}</td>
            <td><span class="status-badge ${route.status}">${route.status === "active" ? "Active" : "Inactive"}</span></td>
            <td>
                <div class="admin-table-actions">
                    <button class="admin-icon-btn" data-edit="${route.id}" aria-label="Edit route">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"></path></svg>
                    </button>
                    <button class="admin-icon-btn danger" data-delete="${route.id}" aria-label="Delete route">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

function openRouteModal(route) {
    if (route) {
        routeModalTitle.textContent = "Edit Route";
        routeIdField.value = route.id;
        routeFromField.value = route.from;
        routeToField.value = route.to;
        routeDistanceField.value = route.distance;
        routeDurationField.value = route.duration;
        routePriceField.value = route.price;
        routeStatusField.value = route.status;
    } else {
        routeModalTitle.textContent = "Add Route";
        routeForm.reset();
        routeIdField.value = "";
    }

    routeModal.classList.add("show");
}

function closeRouteModal() {
    routeModal.classList.remove("show");
}

document.getElementById("add-route-btn").addEventListener("click", () => openRouteModal(null));
document.getElementById("route-modal-close").addEventListener("click", closeRouteModal);
document.getElementById("route-cancel-btn").addEventListener("click", closeRouteModal);

routeModal.addEventListener("click", (e) => {
    if (e.target === routeModal) closeRouteModal();
});

routeForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (
        routeFromField.value.trim() === "" ||
        routeToField.value.trim() === "" ||
        routeDistanceField.value.trim() === "" ||
        routeDurationField.value.trim() === "" ||
        routePriceField.value.trim() === ""
    ) {
        showToast("Please fill in every field.");
        return;
    }

    const editingId = routeIdField.value || null;

    const routeData = {
        from: routeFromField.value.trim(),
        to: routeToField.value.trim(),
        distance: Number(routeDistanceField.value),
        duration: routeDurationField.value.trim(),
        price: Number(routePriceField.value),
        status: routeStatusField.value
    };

    try {
        if (editingId) {
            await apiFetch(`/api/routes/${editingId}`, {
                method: "PUT",
                body: JSON.stringify(routeData)
            });
            showToast("Route updated.", "success");
        } else {
            await apiFetch("/api/routes", {
                method: "POST",
                body: JSON.stringify(routeData)
            });
            showToast("Route added.", "success");
        }

        await loadRoutes();
        closeRouteModal();
    } catch (err) {
        showToast(err.message);
    }
});

// Edit / delete buttons (event delegation — works for rows added later too)
tableBody.addEventListener("click", (e) => {
    const editBtn = e.target.closest("[data-edit]");
    const deleteBtn = e.target.closest("[data-delete]");

    if (editBtn) {
        const route = routes.find(r => r.id === editBtn.dataset.edit);
        if (route) openRouteModal(route);
    }

    if (deleteBtn) {
        deleteTargetId = deleteBtn.dataset.delete;
        const route = routes.find(r => r.id === deleteTargetId);
        if (route) {
            deleteConfirmText.textContent =
                `Delete the ${route.from} → ${route.to} route? This can't be undone.`;
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
        await apiFetch(`/api/routes/${deleteTargetId}`, { method: "DELETE" });
        deleteModal.classList.remove("show");
        await loadRoutes();
        showToast("Route deleted.", "success");
    } catch (err) {
        showToast(err.message);
    }
});

loadRoutes();