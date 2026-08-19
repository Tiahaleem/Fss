// =========================
// PICKUP CENTERS (admin)
// =========================
// Now talks to the real backend (GET/POST/PUT/DELETE /api/terminals)
// instead of localStorage. IDs are real UUIDs now.

let terminals = [];
let deleteTargetId = null;

const tableBody = document.getElementById("terminals-table-body");

const terminalModal = document.getElementById("terminal-modal-overlay");
const terminalModalTitle = document.getElementById("terminal-modal-title");
const terminalForm = document.getElementById("terminal-form");

const terminalIdField = document.getElementById("terminal-id");
const terminalCityField = document.getElementById("terminal-city");
const terminalNameField = document.getElementById("terminal-name");
const terminalAddressField = document.getElementById("terminal-address");
const terminalPhoneField = document.getElementById("terminal-phone");
const terminalHoursField = document.getElementById("terminal-hours");
const terminalStatusField = document.getElementById("terminal-status");

const deleteModal = document.getElementById("delete-modal-overlay");
const deleteConfirmText = document.getElementById("delete-confirm-text");

async function loadTerminals() {
    try {
        terminals = await apiFetch("/api/terminals");
        renderTerminals();
    } catch (err) {
        showToast(err.message);
        tableBody.innerHTML = `<tr><td colspan="7"><div class="admin-empty">Couldn't load terminals.</div></td></tr>`;
    }
}

function renderTerminals() {
    if (terminals.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="admin-empty">No terminals yet. Click "Add Terminal" to create one.</div>
                </td>
            </tr>
        `;
        return;
    }

    const sorted = [...terminals].sort((a, b) =>
        a.city === b.city ? a.name.localeCompare(b.name) : a.city.localeCompare(b.city)
    );

    tableBody.innerHTML = sorted.map(t => `
        <tr>
            <td>${t.city}</td>
            <td>${t.name}</td>
            <td>${t.address}</td>
            <td>${t.phone}</td>
            <td>${t.hours}</td>
            <td><span class="status-badge ${t.status}">${t.status === "active" ? "Active" : "Inactive"}</span></td>
            <td>
                <div class="admin-table-actions">
                    <button class="admin-icon-btn" data-edit="${t.id}" aria-label="Edit terminal">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"></path></svg>
                    </button>
                    <button class="admin-icon-btn danger" data-delete="${t.id}" aria-label="Delete terminal">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

function openTerminalModal(terminal) {
    if (terminal) {
        terminalModalTitle.textContent = "Edit Terminal";
        terminalIdField.value = terminal.id;
        terminalCityField.value = terminal.city;
        terminalNameField.value = terminal.name;
        terminalAddressField.value = terminal.address;
        terminalPhoneField.value = terminal.phone;
        terminalHoursField.value = terminal.hours;
        terminalStatusField.value = terminal.status;
    } else {
        terminalModalTitle.textContent = "Add Terminal";
        terminalForm.reset();
        terminalIdField.value = "";
    }

    terminalModal.classList.add("show");
}

function closeTerminalModal() {
    terminalModal.classList.remove("show");
}

document.getElementById("add-terminal-btn").addEventListener("click", () => openTerminalModal(null));
document.getElementById("terminal-modal-close").addEventListener("click", closeTerminalModal);
document.getElementById("terminal-cancel-btn").addEventListener("click", closeTerminalModal);

terminalModal.addEventListener("click", (e) => {
    if (e.target === terminalModal) closeTerminalModal();
});

terminalForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (
        terminalCityField.value.trim() === "" ||
        terminalNameField.value.trim() === "" ||
        terminalAddressField.value.trim() === "" ||
        terminalPhoneField.value.trim() === "" ||
        terminalHoursField.value.trim() === ""
    ) {
        showToast("Please fill in every field.");
        return;
    }

    const editingId = terminalIdField.value || null;

    const terminalData = {
        city: terminalCityField.value.trim(),
        name: terminalNameField.value.trim(),
        address: terminalAddressField.value.trim(),
        phone: terminalPhoneField.value.trim(),
        hours: terminalHoursField.value.trim(),
        status: terminalStatusField.value
    };

    try {
        if (editingId) {
            await apiFetch(`/api/terminals/${editingId}`, {
                method: "PUT",
                body: JSON.stringify(terminalData)
            });
            showToast("Terminal updated.", "success");
        } else {
            await apiFetch("/api/terminals", {
                method: "POST",
                body: JSON.stringify(terminalData)
            });
            showToast("Terminal added.", "success");
        }

        await loadTerminals();
        closeTerminalModal();
    } catch (err) {
        showToast(err.message);
    }
});

// Edit / delete buttons (event delegation)
tableBody.addEventListener("click", (e) => {
    const editBtn = e.target.closest("[data-edit]");
    const deleteBtn = e.target.closest("[data-delete]");

    if (editBtn) {
        const terminal = terminals.find(t => t.id === editBtn.dataset.edit);
        if (terminal) openTerminalModal(terminal);
    }

    if (deleteBtn) {
        deleteTargetId = deleteBtn.dataset.delete;
        const terminal = terminals.find(t => t.id === deleteTargetId);
        if (terminal) {
            deleteConfirmText.textContent =
                `Delete ${terminal.name} (${terminal.city})? This can't be undone.`;
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
        await apiFetch(`/api/terminals/${deleteTargetId}`, { method: "DELETE" });
        deleteModal.classList.remove("show");
        await loadTerminals();
        showToast("Terminal deleted.", "success");
    } catch (err) {
        showToast(err.message);
    }
});

loadTerminals();