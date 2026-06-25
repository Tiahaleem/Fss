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

        alert("Please complete all required fields.");

        return;

    }

    alert(

        "Courier booking created successfully!\n\nNext step: Payment."

    );

    // Later

    // window.location.href = "payment.html";

});


/* =====================================
   LOAD
===================================== */

updateQuote();