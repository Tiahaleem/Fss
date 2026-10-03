// =========================
// CONTACT FORM
// =========================
// TEMP DEMO: validates and shows a success toast, but doesn't
// actually send anything yet. Once a backend endpoint exists
// (e.g. POST /api/contact), replace the showToast success call
// with a real fetch() and only show the toast once that resolves.

const contactForm = document.getElementById("contact-form");

if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const name = document.getElementById("contact-name");
        const email = document.getElementById("contact-email");
        const subject = document.getElementById("contact-subject");
        const message = document.getElementById("contact-message");

        if (
            name.value.trim() === "" ||
            email.value.trim() === "" ||
            message.value.trim() === ""
        ) {
            showToast("Please fill in your name, email, and message.");
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email.value.trim())) {
            showToast("Please enter a valid email address.");
            return;
        }

        showToast("Message sent — we'll get back to you within 24 hours.", "success");

        contactForm.reset();
    });
}
