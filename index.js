   const hamburger = document.querySelector(".hamburger");
    const navLinks = document.querySelector(".nav-links");
    const navButtons = document.querySelector(".nav-buttons");

    hamburger.addEventListener("click", () => {
        navLinks.classList.toggle("show");
        navButtons.classList.toggle("show");
    });
// F&Q JS
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {

    const question = item.querySelector('.faq-question');

    question.addEventListener('click', () => {

        item.classList.toggle('active');

    });

});