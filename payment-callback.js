// =========================
// PAYMENT CALLBACK
// =========================
// Either Paystack or Flutterwave sends the customer here after
// checkout — each uses different URL parameter names, so this
// figures out which one just happened. Either way, this page's whole
// job is to ask OUR server "did this actually succeed?" — never
// trusting the redirect itself, since that's just a browser
// navigating and proves nothing on its own.

const verifyingView = document.getElementById("verifying-view");
const successView = document.getElementById("success-view");
const failureView = document.getElementById("failure-view");
const confirmedReference = document.getElementById("confirmed-reference");
const trackBtn = document.getElementById("track-btn");
const failureMessage = document.getElementById("failure-message");

async function verifyPayment() {
    const params = new URLSearchParams(window.location.search);

    // Paystack sends ?reference= or ?trxref=. Flutterwave sends
    // ?tx_ref= (and ?transaction_id=, which we don't need since our
    // own tx_ref is what verify_by_reference looks up).
    const paystackReference = params.get("reference") || params.get("trxref");
    const flutterwaveRef = params.get("tx_ref");

    if (!paystackReference && !flutterwaveRef) {
        verifyingView.style.display = "none";
        failureMessage.textContent = "No payment reference was found in the link. If you completed a payment, contact support with your bank receipt.";
        failureView.style.display = "block";
        return;
    }

    const verifyUrl = flutterwaveRef
        ? `/api/payments/flutterwave/verify/${encodeURIComponent(flutterwaveRef)}`
        : `/api/payments/verify/${encodeURIComponent(paystackReference)}`;

    try {
        const result = await apiFetch(verifyUrl, { asCustomer: true });

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