// =========================
// MY BOOKINGS — real backend
// =========================
// Only shows bookings genuinely tied to this account (owner_id in
// the real database) — not just "anything in this browser". Two
// different devices signed into the same account now see the same
// bookings, which was never possible with the old localStorage version.

const bookingsList = document.getElementById("bookings-list");
let currentCustomerName = "You";

async function loadCurrentCustomerName() {
    try {
        const user = await apiFetch("/api/auth/me", { asCustomer: true });
        currentCustomerName = user.name || "You";
    } catch (err) {
        // Not critical — falls back to "You" if this fails for any reason
    }
}

async function loadMyBookings() {
    if (!bookingsList) return;

    if (!getCustomerToken()) {
        window.location.href = "login.html";
        return;
    }

    let myBookings;
    try {
        myBookings = await apiFetch("/api/bookings/mine", { asCustomer: true });
    } catch (err) {
        window.location.href = "login.html";
        return;
    }

    if (myBookings.length === 0) {
        bookingsList.innerHTML = `
            <div class="bookings-empty">
                <div class="bookings-empty-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                </div>
                <h3>No bookings yet</h3>
                <p>Trips and parcels you book while signed in will show up here.</p>
                <div class="bookings-empty-actions">
                    <a href="book_a_trip.html" class="primary">Book a Trip</a>
                    <a href="courier.html" class="secondary">Send a Parcel</a>
                </div>
            </div>
        `;
        return;
    }

    const busIcon = '<rect x="3" y="6" width="18" height="10" rx="2"></rect><circle cx="7.5" cy="19" r="1.5"></circle><circle cx="16.5" cy="19" r="1.5"></circle><path d="M3 11h18"></path>';
    const packageIcon = '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"></path><path d="M12 22V12"></path><polyline points="3.29 7 12 12 20.71 7"></polyline><path d="m7.5 4.27 9 5.15"></path>';

    bookingsList.innerHTML = myBookings.map(b => {
        const isParcel = b.type === "parcel";
        const price = `₦${(Number(b.price_kobo) / 100).toLocaleString()}`;
        const bookedDate = new Date(b.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

        const title = isParcel ? `${b.from_city} → ${b.to_city}` : `${b.trip_from} → ${b.trip_to}`;
        const subtitle = isParcel
            ? `To ${b.receiver_name} · Booked ${bookedDate}`
            : `Seat${b.seat_numbers && b.seat_numbers.includes(',') ? 's' : ''} ${b.seat_numbers} · ${b.pickup_terminal_name} · Booked ${bookedDate}`;

        const statusLabel = b.status.charAt(0).toUpperCase() + b.status.slice(1);
        const canCancel = b.status === "confirmed";

        let reviewMarkup = "";
        if (!isParcel) {
            if (b.my_rating) {
                const stars = "★".repeat(b.my_rating) + "☆".repeat(5 - b.my_rating);
                reviewMarkup = `<span class="booking-review-given"><span class="star-filled">${stars}</span></span>`;
            } else if (b.canReview) {
                reviewMarkup = `<button type="button" class="booking-review-btn" data-review="${b.booking_id}" data-route="${title}">Leave a Review</button>`;
            }
        }

        return `
            <div class="booking-card">

                <div class="booking-card-main">

                    <div class="booking-type-icon ${isParcel ? "parcel" : "passenger"}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${isParcel ? packageIcon : busIcon}</svg>
                    </div>

                    <div class="booking-card-info">
                        <h3>${title}</h3>
                        <p><span class="booking-ref">${b.reference}</span> · ${subtitle}</p>
                        <span class="booking-status-badge ${b.status}">${statusLabel}</span>
                    </div>

                </div>

                <div class="booking-card-right">
                    <span class="booking-price">${price}</span>
                    <a href="track.html?ref=${encodeURIComponent(b.reference)}" class="booking-track-btn">
                        Track →
                    </a>
                    ${canCancel ? `<button type="button" class="booking-cancel-btn" data-cancel="${b.reference}">Cancel</button>` : ""}
                    ${reviewMarkup}
                </div>

            </div>
        `;
    }).join("");
}

const cancelModal = document.getElementById("cancel-modal-overlay");
const cancelModalText = document.getElementById("cancel-modal-text");
const cancelModalBackBtn = document.getElementById("cancel-modal-back-btn");
const cancelModalConfirmBtn = document.getElementById("cancel-modal-confirm-btn");

let pendingCancelReference = null;
let pendingCancelBtn = null;

function openCancelModal(reference, triggerBtn) {
    pendingCancelReference = reference;
    pendingCancelBtn = triggerBtn;
    cancelModalText.textContent = `Booking ${reference} will be cancelled and can't be restored.`;
    cancelModal.classList.add("show");
}

function closeCancelModal() {
    cancelModal.classList.remove("show");
    pendingCancelReference = null;
    pendingCancelBtn = null;
}

cancelModalBackBtn.addEventListener("click", closeCancelModal);
cancelModal.addEventListener("click", (e) => {
    if (e.target === cancelModal) closeCancelModal();
});

cancelModalConfirmBtn.addEventListener("click", async () => {
    if (!pendingCancelReference) return;

    cancelModalConfirmBtn.disabled = true;

    try {
        await apiFetch(`/api/bookings/${pendingCancelReference}/cancel`, {
            method: "POST",
            asCustomer: true
        });

        showToast("Booking cancelled.", "success");
        closeCancelModal();
        loadMyBookings();
    } catch (err) {
        showToast(err.message);
        cancelModalConfirmBtn.disabled = false;
    }
});

bookingsList.addEventListener("click", (e) => {
    const cancelBtn = e.target.closest("[data-cancel]");
    if (cancelBtn) {
        openCancelModal(cancelBtn.dataset.cancel, cancelBtn);
        return;
    }

    const reviewBtn = e.target.closest("[data-review]");
    if (reviewBtn) {
        openReviewModal(reviewBtn.dataset.review, reviewBtn.dataset.route);
    }
});

// =========================
// LEAVE A REVIEW
// =========================

const reviewModal = document.getElementById("review-modal-overlay");
const reviewModalClose = document.getElementById("review-modal-close");
const reviewModalName = document.getElementById("review-modal-name");
const reviewModalRoute = document.getElementById("review-modal-route");
const reviewStarHint = document.getElementById("review-star-hint");
const reviewQuickPicks = document.getElementById("review-quick-picks");
const reviewStarPicker = document.getElementById("review-star-picker");
const reviewCommentInput = document.getElementById("review-comment");
const reviewModalBackBtn = document.getElementById("review-modal-back-btn");
const reviewModalSubmitBtn = document.getElementById("review-modal-submit-btn");
const reviewPhotoInput = document.getElementById("review-photo-input");
const reviewPhotoUploadLabel = document.getElementById("review-photo-upload-label");
const reviewPhotoPreview = document.getElementById("review-photo-preview");
const reviewPhotoLabelText = document.getElementById("review-photo-label-text");

let selectedPhotoBase64 = null;

const cameraIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`;

reviewPhotoUploadLabel.addEventListener("click", (e) => {
    // The <input> itself is hidden and already inside the <label>,
    // so a native click would double-fire — this opens it manually instead.
    if (e.target !== reviewPhotoInput) {
        e.preventDefault();
        reviewPhotoInput.click();
    }
});

reviewPhotoInput.addEventListener("change", () => {
    const file = reviewPhotoInput.files[0];
    if (!file) return;

    // 2MB raw file — comfortably under the backend's base64 size guard
    if (file.size > 2 * 1024 * 1024) {
        showToast("That photo is too large — please pick one under 2MB.");
        reviewPhotoInput.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        selectedPhotoBase64 = reader.result;
        reviewPhotoPreview.innerHTML = `<img src="${selectedPhotoBase64}" alt="Your photo">`;
        reviewPhotoLabelText.textContent = "Photo added — tap to change";
    };
    reader.readAsDataURL(file);
});

function resetPhotoUpload() {
    selectedPhotoBase64 = null;
    reviewPhotoInput.value = "";
    reviewPhotoPreview.innerHTML = cameraIconSvg;
    reviewPhotoLabelText.textContent = "Add a photo (optional)";
}

reviewModalClose.addEventListener("click", closeReviewModal);

let pendingReviewBookingId = null;
let selectedRating = 0;

// Quick-pick feedback per star rating — lets someone leave a genuine
// review in one tap without needing to type anything, if they'd rather not.
const quickPicksByRating = {
    1: ["Bad experience", "Not satisfied", "Would not recommend"],
    2: ["Below expectations", "It was okay", "Needs improvement"],
    3: ["It was alright", "Decent trip", "Average experience"],
    4: ["Very good", "Good experience", "Comfortable trip"],
    5: ["Excellent!", "Satisfying", "Highly recommend"]
};

const starHints = {
    0: "Tap a star to rate your trip",
    1: "Poor",
    2: "Fair",
    3: "Good",
    4: "Very Good",
    5: "Excellent"
};

function openReviewModal(bookingId, route) {
    pendingReviewBookingId = bookingId;
    selectedRating = 0;

    reviewModalName.textContent = currentCustomerName;
    reviewModalRoute.textContent = route;
    reviewCommentInput.value = "";
    reviewQuickPicks.style.display = "none";
    reviewQuickPicks.innerHTML = "";
    resetPhotoUpload();

    updateStarDisplay();
    reviewModal.classList.add("show");
}

function closeReviewModal() {
    reviewModal.classList.remove("show");
    pendingReviewBookingId = null;
}

function updateStarDisplay() {
    document.querySelectorAll(".review-star").forEach(star => {
        star.classList.toggle("filled", Number(star.dataset.star) <= selectedRating);
    });

    reviewStarHint.textContent = starHints[selectedRating];

    if (selectedRating === 0) {
        reviewQuickPicks.style.display = "none";
        return;
    }

    reviewQuickPicks.style.display = "flex";
    reviewQuickPicks.innerHTML = quickPicksByRating[selectedRating]
        .map(text => `<button type="button" class="review-quick-pick-chip" data-pick="${text}">${text}</button>`)
        .join("");
}

reviewQuickPicks.addEventListener("click", (e) => {
    const chip = e.target.closest(".review-quick-pick-chip");
    if (!chip) return;

    document.querySelectorAll(".review-quick-pick-chip").forEach(c => c.classList.remove("selected"));
    chip.classList.add("selected");
    reviewCommentInput.value = chip.dataset.pick;
});

reviewStarPicker.addEventListener("click", (e) => {
    const star = e.target.closest(".review-star");
    if (!star) return;

    selectedRating = Number(star.dataset.star);
    updateStarDisplay();
});

reviewModalBackBtn.addEventListener("click", closeReviewModal);
reviewModal.addEventListener("click", (e) => {
    if (e.target === reviewModal) closeReviewModal();
});

reviewModalSubmitBtn.addEventListener("click", async () => {
    if (!pendingReviewBookingId) return;

    if (selectedRating === 0) {
        showToast("Please pick a star rating first.");
        return;
    }

    reviewModalSubmitBtn.disabled = true;

    try {
        await apiFetch("/api/reviews", {
            method: "POST",
            asCustomer: true,
            body: JSON.stringify({
                bookingId: pendingReviewBookingId,
                rating: selectedRating,
                comment: reviewCommentInput.value.trim(),
                photo: selectedPhotoBase64
            })
        });

        showToast("Thanks for your review!", "success");
        closeReviewModal();
        loadMyBookings();
    } catch (err) {
        showToast(err.message);
        reviewModalSubmitBtn.disabled = false;
    }
});

loadCurrentCustomerName();
loadMyBookings();