/* =====================================
   FSS COURIER QUOTE
===================================== */

// Routes (Later this will come from MySQL)

const routes = {

    "Lagos-Abuja": {
        base: 2500,
        perKg: 850
    },

    "Lagos-Ibadan": {
        base: 1800,
        perKg: 450
    },

    "Lagos-Port Harcourt": {
        base: 3000,
        perKg: 950
    },

    "Lagos-Benin City": {
        base: 2200,
        perKg: 650
    },

    "Abuja-Lagos": {
        base: 2500,
        perKg: 850
    },

    "Abuja-Port Harcourt": {
        base: 2800,
        perKg: 900
    },

    "Ibadan-Lagos": {
        base: 1800,
        perKg: 450
    },

    "Port Harcourt-Lagos": {
        base: 3000,
        perKg: 950
    },

    "Benin City-Lagos": {
        base: 2200,
        perKg: 650
    }

};


/* =====================================
   ELEMENTS
===================================== */

const from = document.getElementById("from");
const to = document.getElementById("to");
const weight = document.getElementById("weight");
const declaredValue = document.getElementById("declared-value");

const summaryRoute = document.getElementById("summary-route");
const summaryWeight = document.getElementById("summary-weight");
const summaryBase = document.getElementById("summary-base");
const summaryKg = document.getElementById("summary-kg");
const summaryInsurance = document.getElementById("summary-insurance");
const summaryTotal = document.getElementById("summary-total");

const buttonTotal = document.getElementById("button-total");

const form = document.getElementById("quote-form");

let appliedPromoCode = null;

const promoInput = document.getElementById("promo-code-input");
const promoApplyBtn = document.getElementById("promo-apply-btn");
const promoMessage = document.getElementById("promo-message");


/* =====================================
   FORMAT MONEY
===================================== */

function money(value){

    return "₦" + value.toLocaleString();

}


/* =====================================
   UPDATE QUOTE
===================================== */

let lastQuoteTotal = 0;

function updateQuote(){

    const key = `${from.value}-${to.value}`;

    const route = routes[key];

    if(!route){

        summaryRoute.textContent = "Unavailable Route";

        summaryBase.textContent = "₦0";

        summaryKg.textContent = "₦0";

        summaryInsurance.textContent = "₦0";

        summaryTotal.textContent = "₦0";

        buttonTotal.textContent = "₦0";

        lastQuoteTotal = 0;

        return;

    }

    let kg = Number(weight.value);

    if(kg < 1){

        kg = 1;

        weight.value = 1;

    }

    const declared = Number(declaredValue.value);

    // Insurance

    let insurance = 0;

    if(declared > 50000){

        insurance = declared * 0.01;

    }

    const total =
        route.base +
        (kg * route.perKg) +
        insurance;

    summaryRoute.textContent =
        `${from.value} → ${to.value}`;

    summaryWeight.textContent =
        `${kg} kg`;

    summaryBase.textContent =
        money(route.base);

    summaryKg.textContent =
        money(route.perKg);

    summaryInsurance.textContent =
        money(insurance);

    summaryTotal.textContent =
        money(total);

    buttonTotal.textContent =
        money(total);

    lastQuoteTotal = total;

    // The quote just changed, so any previously-applied discount was
    // calculated against a now-outdated amount — reset it and let
    // the customer re-apply if they still want it.
    if (appliedPromoCode) {
        appliedPromoCode = null;
        if (promoInput) {
            promoInput.disabled = false;
            promoInput.value = "";
        }
        if (promoApplyBtn) {
            promoApplyBtn.disabled = false;
            promoApplyBtn.textContent = "Apply";
        }
        if (promoMessage) {
            promoMessage.textContent = "";
            promoMessage.className = "";
        }
    }

}


/* =====================================
   EVENTS
===================================== */

from.addEventListener("change", updateQuote);

to.addEventListener("change", updateQuote);

weight.addEventListener("input", updateQuote);

declaredValue.addEventListener("input", updateQuote);


/* =====================================
   VIEW REFERENCES
===================================== */

const quoteFormView = document.getElementById("quote-form-view");
const quoteConfirmationView = document.getElementById("quote-confirmation-view");
const generatedTrackingCode = document.getElementById("generated-tracking-code");
const trackParcelBtn = document.getElementById("track-parcel-btn");
const bookAnotherBtn = document.getElementById("book-another-btn");

/* =====================================
   PROMO CODE
===================================== */

promoApplyBtn?.addEventListener("click", async () => {
    const code = promoInput.value.trim();
    if (!code) {
        promoMessage.textContent = "Enter a code first.";
        promoMessage.className = "error";
        return;
    }

    if (lastQuoteTotal <= 0) {
        promoMessage.textContent = "Get a quote first before applying a code.";
        promoMessage.className = "error";
        return;
    }

    promoApplyBtn.disabled = true;
    promoMessage.textContent = "Checking…";
    promoMessage.className = "";

    try {
        const amountKobo = Math.round(lastQuoteTotal * 100);
        const result = await apiFetch(`/api/promo-codes/validate?code=${encodeURIComponent(code)}&amountKobo=${amountKobo}`);

        appliedPromoCode = code;
        buttonTotal.textContent = money(result.finalAmountKobo / 100);

        promoMessage.textContent = `Promo applied — you save ${money(result.discountKobo / 100)}!`;
        promoMessage.className = "success";
        promoInput.disabled = true;
        promoApplyBtn.textContent = "Applied";
    } catch (err) {
        appliedPromoCode = null;
        promoMessage.textContent = err.message;
        promoMessage.className = "error";
        promoApplyBtn.disabled = false;
    }
});

/* =====================================
   FORM VALIDATION
===================================== */

form.addEventListener("submit", async function(e){

    e.preventDefault();

    const senderName =
        document.getElementById("sender-name");

    const senderPhone =
        document.getElementById("sender-phone");

    const senderEmail =
        document.getElementById("sender-email");

    const receiverName =
        document.getElementById("recipient-name");

    const receiverPhone =
        document.getElementById("recipient-phone");

    const description =
        document.getElementById("description");

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if(

        senderName.value.trim() === "" ||

        senderPhone.value.trim() === "" ||

        senderEmail.value.trim() === "" ||

        receiverName.value.trim() === "" ||

        receiverPhone.value.trim() === "" ||

        description.value.trim() === ""

    ){

        showToast("Please complete all required fields.");

        return;

    }

    if (!emailPattern.test(senderEmail.value.trim())) {
        showToast("Please enter a valid email address.");
        return;
    }

    if (!routes[`${from.value}-${to.value}`]) {
        showToast("Please choose a valid route.");
        return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
        // Starts a real Flutterwave transaction — no booking exists
        // yet. Details ride along as metadata, handed back once
        // payment is verified on payment-callback.html.
        const result = await apiFetch("/api/payments/flutterwave/initialize-parcel", {
            method: "POST",
            asCustomer: true,
            body: JSON.stringify({
                fromCity: from.value,
                toCity: to.value,
                senderName: senderName.value.trim(),
                senderPhone: senderPhone.value.trim(),
                senderEmail: senderEmail.value.trim(),
                receiverName: receiverName.value.trim(),
                receiverPhone: receiverPhone.value.trim(),
                description: description.value.trim(),
                weightKg: Number(weight.value),
                declaredValueKobo: Math.round(Number(declaredValue.value) * 100),
                priceKobo: Math.round(lastQuoteTotal * 100),
                promoCode: appliedPromoCode
            })
        });

        // Send the customer to Flutterwave's real checkout page
        window.location.href = result.authorizationUrl;
    } catch (err) {
        showToast(err.message);
        if (submitBtn) submitBtn.disabled = false;
    }

});

if (bookAnotherBtn) {
    bookAnotherBtn.addEventListener("click", () => {
        form.reset();
        updateQuote();
        quoteConfirmationView.style.display = "none";
        quoteFormView.style.display = "block";
    });
}


/* =====================================
   LOAD
===================================== */

updateQuote();