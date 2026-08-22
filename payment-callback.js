// =========================
// PAYMENT CALLBACK
// =========================
// Paystack sends the customer here after checkout, with ?reference=
// in the URL. This page's whole job is to ask OUR server "did this
// actually succeed?" — never trusting the redirect itself, since
// that's just a browser navigating and proves nothing on its own.

const verifyingView = document.getElementById("verifying-view");
const successView = document.getElementById("success-view");
const failureView = document.getElementById("failure-view");
const confirmedReference = document.getElementById("confirmed-reference");
const trackBtn = document.getElementById("track-btn");
const failureMessage = document.getElementById("failure-message");

async function verifyPayment() {
    const reference = new URLSearchParams(window.location.search).get("reference") || new URLSearchParams(window.location.search).get("trxref");

    if (!reference) {
        verifyingView.style.display = "none";
        failureMessage.textContent = "No payment reference was found in the link. If you completed a payment, contact support with your bank receipt.";
        failureView.style.display = "block";
        return;
    }

    try {
        const result = await apiFetch(`/api/payments/verify/${encodeURIComponent(reference)}`, { asCustomer: true });

        confirmedReference.textContent = result.reference;
        trackBtn.href = `track.html?ref=${encodeURIComponent(result.reference)}`;

        verifyingView.style.display = "none";
        successView.style.display = "block";
    } catch (err) {
        verifyingView.style.display = "none";
        failureMessage.textContent = err.message || "This payment wasn't successful, so no booking was created — nothing was charged.";
        failureView.style.display = "block";
    }
}

verifyPayment();