// =========================
// REVIEWS PAGE
// =========================
// Shows every real review, for prospective customers to browse
// before booking. Same data source as the homepage's smaller
// Testimonials section, just the fuller list.

const reviewsGrid = document.getElementById("reviews-grid");
const heroSummary = document.getElementById("reviews-hero-summary");

async function loadAllReviews() {
    try {
        const [reviews, summary] = await Promise.all([
            apiFetch("/api/reviews?limit=50"),
            apiFetch("/api/reviews/summary")
        ]);

        heroSummary.textContent = summary.reviewCount > 0
            ? `${summary.averageRating} ★ average from ${summary.reviewCount} real customer${summary.reviewCount === 1 ? "" : "s"}`
            : "No reviews yet — be the first to share your experience after your trip.";

        if (reviews.length === 0) {
            reviewsGrid.innerHTML = `
                <div class="admin-empty" style="grid-column: 1 / -1;">
                    No reviews yet. Check back soon, or book a trip and be the first to leave one.
                </div>
            `;
            return;
        }

        reviewsGrid.innerHTML = reviews.map(r => {
            const date = new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

            return `
                <div class="review-card">
                    <div class="review-card-stars">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</div>
                    <p class="review-card-comment">${r.comment ? r.comment : "Great experience overall."}</p>
                    <div class="review-card-footer">
                        <span class="review-card-name">${r.name}</span>
                        <span class="review-card-meta">${r.route}<br>${date}</span>
                    </div>
                </div>
            `;
        }).join("");
    } catch (err) {
        heroSummary.textContent = "Couldn't load reviews right now.";
        reviewsGrid.innerHTML = `
            <div class="admin-empty" style="grid-column: 1 / -1;">Please try again shortly.</div>
        `;
    }
}

loadAllReviews();