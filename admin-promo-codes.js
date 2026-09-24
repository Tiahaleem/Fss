// =========================
// PROMO CODES (admin)
// =========================

let promoCodes = [];
let deleteTargetId = null;

const tableBody = document.getElementById("promo-codes-table-body");

const promoModal = document.getElementById("promo-modal-overlay");
const promoModalTitle = document.getElementById("promo-modal-title");
const promoForm = document.getElementById("promo-form");

const promoIdField = document.getElementById("promo-id");
const promoCodeField = document.getElementById("promo-code");
const promoDiscountTypeField = document.getElementById("promo-discount-type");
const promoDiscountValueField = document.getElementById("promo-discount-value");
const promoMaxUsesField = document.getElementById("promo-max-uses");
const promoExpiresAtField = document.getElementById("promo-expires-at");
const promoStatusField = document.getElementById("promo-status");

const deleteModal = document.getElementById("delete-modal-overlay");
const deleteConfirmText = document.getElementById("delete-confirm-text");

function formatDiscount(p) {
    return p.discountType === "percentage"
        ? `${p.discountValue}% off`
        : `₦${(p.discountValue / 100).toLocaleString()} off`;
}

function formatExpiry(expiresAt) {
    if (!expiresAt) return "Never";
    return new Date(expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

async function loadPromoCodes() {
    try {
        promoCodes = await apiFetch("/api/promo-codes");
        renderPromoCodes();
    } catch (err) {
        showToast(err.message);
        tableBody.innerHTML = `<tr><td colspan="6"><div class="admin-empty">Couldn't load promo codes.</div></td></tr>`;
    }
}

function renderPromoCodes() {
    if (promoCodes.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="admin-empty">No promo codes yet. Click "Add Promo Code" to create your first one.</div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = promoCodes.map(p => `
        <tr>
            <td><strong>${escapeHtml(p.code)}</strong></td>
            <td>${formatDiscount(p)}</td>
            <td>${p.timesUsed}${p.maxUses !== null ? ` / ${p.maxUses}` : ""}</td>
            <td>${formatExpiry(p.expiresAt)}</td>
            <td><span class="status-badge ${p.status}">${p.status === "active" ? "Active" : "Inactive"}</span></td>
            <td>
                <div class="admin-table-actions">
                    <button class="admin-icon-btn" data-edit="${p.id}" aria-label="Edit promo code">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"></path></svg>
                    </button>
                    <button class="admin-icon-btn danger" data-delete="${p.id}" aria-label="Delete promo code">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

function openPromoModal(promo) {
    if (promo) {
        promoModalTitle.textContent = "Edit Promo Code";
        promoIdField.value = promo.id;
        promoCodeField.value = promo.code;
        promoDiscountTypeField.value = promo.discountType;
        promoDiscountValueField.value = promo.discountType === "fixed" ? promo.discountValue / 100 : promo.discountValue;
        promoMaxUsesField.value = promo.maxUses ?? "";
        promoExpiresAtField.value = promo.expiresAt ? promo.expiresAt.split("T")[0] : "";
        promoStatusField.value = promo.status;
    } else {
        promoModalTitle.textContent = "Add Promo Code";
        promoForm.reset();
        promoIdField.value = "";
    }

    promoModal.classList.add("show");
}

function closePromoModal() {
    promoModal.classList.remove("show");
}

document.getElementById("add-promo-btn").addEventListener("click", () => openPromoModal(null));
document.getElementById("promo-modal-close").addEventListener("click", closePromoModal);
document.getElementById("promo-cancel-btn").addEventListener("click", closePromoModal);

promoModal.addEventListener("click", (e) => {
    if (e.target === promoModal) closePromoModal();
});

promoForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (promoCodeField.value.trim() === "" || !promoDiscountValueField.value) {
        showToast("Please fill in the code and discount value.");
        return;
    }

    const discountType = promoDiscountTypeField.value;
    const rawValue = Number(promoDiscountValueField.value);

    if (discountType === "percentage" && (rawValue < 1 || rawValue > 100)) {
        showToast("A percentage discount must be between 1 and 100.");
        return;
    }

    const editingId = promoIdField.value || null;

    const promoData = {
        code: promoCodeField.value.trim(),
        discountType,
        // Admin enters Naira for a fixed discount — stored as kobo, same as every other price in the system.
        discountValue: discountType === "fixed" ? Math.round(rawValue * 100) : rawValue,
        maxUses: promoMaxUsesField.value ? Number(promoMaxUsesField.value) : null,
        expiresAt: promoExpiresAtField.value || null,
        status: promoStatusField.value
    };

    try {
        if (editingId) {
            await apiFetch(`/api/promo-codes/${editingId}`, {
                method: "PUT",
                body: JSON.stringify(promoData)
            });
            showToast("Promo code updated.", "success");
        } else {
            await apiFetch("/api/promo-codes", {
                method: "POST",
                body: JSON.stringify(promoData)
            });
            showToast("Promo code created.", "success");
        }

        await loadPromoCodes();
        closePromoModal();
    } catch (err) {
        showToast(err.message);
    }
});

// Edit / delete buttons (event delegation)
tableBody.addEventListener("click", (e) => {
    const editBtn = e.target.closest("[data-edit]");
    const deleteBtn = e.target.closest("[data-delete]");

    if (editBtn) {
        const promo = promoCodes.find(p => p.id === editBtn.dataset.edit);
        if (promo) openPromoModal(promo);
    }

    if (deleteBtn) {
        deleteTargetId = deleteBtn.dataset.delete;
        const promo = promoCodes.find(p => p.id === deleteTargetId);
        if (promo) {
            deleteConfirmText.textContent =
                `Delete ${promo.code}? This can't be undone.`;
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
        await apiFetch(`/api/promo-codes/${deleteTargetId}`, { method: "DELETE" });
        deleteModal.classList.remove("show");
        await loadPromoCodes();
        showToast("Promo code deleted.", "success");
    } catch (err) {
        showToast(err.message);
    }
});

loadPromoCodes();