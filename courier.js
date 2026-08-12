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


/* =====================================
   FORMAT MONEY
===================================== */

function money(value){

    return "₦" + value.toLocaleString();

}


/* =====================================
   UPDATE QUOTE
===================================== */

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

}


/* =====================================
   EVENTS
===================================== */

from.addEventListener("change", updateQuote);

to.addEventListener("change", updateQuote);

weight.addEventListener("input", updateQuote);

declaredValue.addEventListener("input", updateQuote);


/* =====================================
   TRACKING CODE GENERATOR
===================================== */
// TEMP DEMO: generates a plausible-looking code client-side.
// Once a backend exists, the real code should come back from the
// booking API response instead of being invented here — this is
// just for showing the flow.

function generateTrackingCode() {

    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "FSS-";

    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return code;
}

const quoteFormView = document.getElementById("quote-form-view");
const quoteConfirmationView = document.getElementById("quote-confirmation-view");
const generatedTrackingCode = document.getElementById("generated-tracking-code");
const trackParcelBtn = document.getElementById("track-parcel-btn");
const bookAnotherBtn = document.getElementById("book-another-btn");

/* =====================================
   FORM VALIDATION
===================================== */

form.addEventListener("submit", function(e){

    e.preventDefault();

    const senderName =
        document.getElementById("sender-name");

    const senderPhone =
        document.getElementById("sender-phone");

    const receiverName =
        document.getElementById("recipient-name");

    const receiverPhone =
        document.getElementById("recipient-phone");

    const description =
        document.getElementById("description");

    if(

        senderName.value.trim() === "" ||

        senderPhone.value.trim() === "" ||

        receiverName.value.trim() === "" ||

        receiverPhone.value.trim() === "" ||

        description.value.trim() === ""

    ){

        showToast("Please complete all required fields.");

        return;

    }

    const trackingCode = generateTrackingCode();

    // Full booking details — this is what shows up in the admin
    // Bookings table, so support can actually see who's involved
    // and what's being shipped, not just a bare reference code.
    const bookings = getBookings();
    bookings.push({
        reference: trackingCode,
        type: "parcel",
        ownerEmail: getCurrentUser() ? getCurrentUser().email : null,
        senderName: senderName.value.trim(),
        senderPhone: senderPhone.value.trim(),
        receiverName: receiverName.value.trim(),
        receiverPhone: receiverPhone.value.trim(),
        description: description.value.trim(),
        from: from.value,
        to: to.value,
        weight: Number(weight.value),
        declaredValue: Number(declaredValue.value),
        price: summaryTotal.textContent.trim(),
        createdAt: new Date().toISOString()
    });
    saveBookings(bookings);

    // Seed a real starter event so tracking this code immediately
    // shows something, instead of "no results found".
    const allEvents = getTrackingEvents();
    allEvents.push({
        id: Date.now(),
        reference: trackingCode,
        order: 1,
        title: "Pickup scheduled",
        time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        status: "active",
        icon: "boarding"
    });
    saveTrackingEvents(allEvents);

    generatedTrackingCode.textContent = trackingCode;
    trackParcelBtn.href = `track.html?ref=${encodeURIComponent(trackingCode)}`;

    quoteFormView.style.display = "none";
    quoteConfirmationView.style.display = "block";

    showToast("Pickup booked — here's your tracking code.", "success");

    // Later
    // window.location.href = "payment.html";

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
