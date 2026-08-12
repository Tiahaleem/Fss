// =========================
// TRACK PAGE
// =========================
// Renders the timeline dynamically from the shared tracking store
// (see getTrackingEvents()/saveTrackingEvents() in index.js), which
// the admin Tracking panel writes to. Within the same browser, admin
// edits now actually show up here. Once a backend exists, replace
// getTrackingEvents() with fetch(`/api/tracking?ref=${code}`).

const trackBtn = document.getElementById("track-btn");
const trackingInput = document.getElementById("tracking-number");
const trackingResult = document.getElementById("tracking-result");
const trackError = document.getElementById("track-error");

const notFoundState = document.getElementById("tracking-not-found");
const resultState = document.getElementById("tracking-found");

const statusBadge = document.getElementById("tracking-status-badge");
const progressFill = document.getElementById("tracking-progress-fill");
const timelineList = document.getElementById("tracking-timeline");

// Icon set — matches the stroke-icon style used across the rest of
// the site (admin panel, services section) instead of the old
// mismatched filled icons.
const icons = {
    boarding: '<rect x="3" y="6" width="18" height="10" rx="2"></rect><circle cx="7.5" cy="19" r="1.5"></circle><circle cx="16.5" cy="19" r="1.5"></circle><path d="M3 11h18"></path>',
    departed: '<line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>',
    checkpoint: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line>',
    location: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle>',
    arrival: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>',
    delivered: '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"></path><path d="M12 22V12"></path><polyline points="3.29 7 12 12 20.71 7"></polyline><path d="m7.5 4.27 9 5.15"></path>'
};

function iconSvg(type) {
    const paths = icons[type] || icons.location;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

function renderTimeline(code) {
    const events = getTrackingEvents()
        .filter(ev => ev.reference.trim().toUpperCase() === code.trim().toUpperCase())
        .sort((a, b) => a.order - b.order);

    if (events.length === 0) {
        notFoundState.style.display = "block";
        resultState.style.display = "none";
        return;
    }

    notFoundState.style.display = "none";
    resultState.style.display = "block";

    document.getElementById("tracking-id").textContent = code.toUpperCase();

    // Overall status
    const hasActive = events.some(ev => ev.status === "active");
    const allCompleted = events.every(ev => ev.status === "completed");

    let overallLabel = "Scheduled";
    let overallClass = "pending";

    if (allCompleted) {
        overallLabel = "Delivered";
        overallClass = "completed";
    } else if (hasActive) {
        overallLabel = "In Transit";
        overallClass = "active";
    }

    statusBadge.textContent = overallLabel;
    statusBadge.className = `tracking-status-badge ${overallClass}`;

    // Progress bar — % of steps completed (an "active" step counts
    // as half-done, since it's in progress rather than finished)
    const completedCount = events.filter(ev => ev.status === "completed").length;
    const activeCount = events.filter(ev => ev.status === "active").length;
    const progress = Math.round(((completedCount + activeCount * 0.5) / events.length) * 100);
    progressFill.style.width = `${progress}%`;

    // Timeline — the fill line is the first element so it sits
    // behind the dots (both share z-index:1, dots use z-index:2)
    timelineList.innerHTML = `<div class="timeline-progress-fill-line" id="timeline-fill-line"></div>` +
        events.map(ev => `
        <div class="timeline-item ${ev.status}">
            <div class="timeline-dot">
                ${iconSvg(ev.icon)}
            </div>
            <div class="timeline-content">
                <h4>${ev.title}</h4>
                <span>${ev.time}</span>
            </div>
        </div>
    `).join("");

    updateTimelineFillLine(events);
}

// Fills the connecting line up to the middle of the last completed
// step (or the active step, if there is one) — measured in real
// pixels via getBoundingClientRect so it lines up exactly with the
// dots regardless of how tall each step's text happens to be.
function updateTimelineFillLine(events) {
    const fillLine = document.getElementById("timeline-fill-line");
    const dots = timelineList.querySelectorAll(".timeline-dot");

    if (!fillLine || dots.length === 0) return;

    const activeIndex = events.findIndex(ev => ev.status === "active");

    let targetIndex = -1;
    events.forEach((ev, i) => {
        if (ev.status === "completed") targetIndex = i;
    });

    // An in-progress step takes priority over the last completed one
    const indexToFillTo = activeIndex !== -1 ? activeIndex : targetIndex;

    if (indexToFillTo === -1) {
        fillLine.style.height = "0px";
        return;
    }

    const containerTop = timelineList.getBoundingClientRect().top;
    const dotRect = dots[indexToFillTo].getBoundingClientRect();
    const dotCenter = (dotRect.top - containerTop) + dotRect.height / 2;

    fillLine.style.height = `${Math.max(dotCenter - 4, 0)}px`;
}

if (trackBtn) {
    trackBtn.addEventListener("click", function () {
        const code = trackingInput.value.trim();

        trackError.style.display = "none";
        trackingInput.classList.remove("input-error");

        if (code === "") {
            trackError.style.display = "block";
            trackingInput.classList.add("input-error");
            trackingInput.focus();
            return;
        }

        renderTimeline(code);

        trackingResult.style.display = "block";

        trackingResult.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });

    // If arriving with ?ref=CODE (e.g. from the courier confirmation
    // screen or a "departed" email), pre-fill and run the lookup
    // automatically instead of making the user retype it.
    const refParam = new URLSearchParams(window.location.search).get("ref");

    if (refParam) {
        trackingInput.value = refParam;
        trackBtn.click();
    }
}

// "Try the demo" link inside the not-found state
const tryDemoLink = document.getElementById("try-demo-link");

if (tryDemoLink) {
    tryDemoLink.addEventListener("click", (e) => {
        e.preventDefault();
        trackingInput.value = "FSS-DEMO";
        trackBtn.click();
    });
}
