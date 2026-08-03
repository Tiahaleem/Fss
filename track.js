const trackBtn = document.getElementById("track-btn");
const trackingInput = document.getElementById("tracking-number");
const trackingResult = document.getElementById("tracking-result");
const trackError = document.getElementById("track-error");

trackBtn.addEventListener("click", function () {
    const code = trackingInput.value.trim();

    // Hide previous error state
    trackError.style.display = "none";
    trackingInput.classList.remove("input-error");

    if (code === "") {
        trackError.style.display = "block";
        trackingInput.classList.add("input-error");
        trackingInput.focus();
        return;
    }

    // TEMP DEMO: always shows the same static timeline regardless of
    // the code entered. Once GET /api/tracking/:code exists, fetch
    // the real timeline here and render it instead.
    document.getElementById("tracking-id").textContent = code;

    trackingResult.style.display = "block";

    trackingResult.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
});