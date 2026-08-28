// =========================
// TICKET PAGE
// =========================
// Reads ?ref=CODE from the URL, loads the real booking's full
// details, and shows them as a clean, printable ticket.

const loadingEl = document.getElementById("ticket-loading");
const notFoundEl = document.getElementById("ticket-not-found");
const ticketCard = document.getElementById("ticket-card");
const ticketActions = document.getElementById("ticket-actions");

async function loadTicket() {
    const reference = new URLSearchParams(window.location.search).get("ref");

    if (!reference) {
        loadingEl.style.display = "none";
        notFoundEl.style.display = "block";
        return;
    }

    try {
        const ticket = await apiFetch(`/api/bookings/${encodeURIComponent(reference)}/ticket`);

        const travelDate = new Date(ticket.travelDate).toLocaleDateString("en-GB", {
            weekday: "long", day: "numeric", month: "long", year: "numeric"
        });

        document.getElementById("ticket-route").textContent = ticket.route;
        document.getElementById("ticket-datetime").textContent = `${travelDate} · ${ticket.departureTime}`;
        document.getElementById("ticket-passenger").textContent = ticket.passengerName;
        document.getElementById("ticket-seats").textContent = ticket.seatNumbers;
        document.getElementById("ticket-vehicle").textContent = ticket.vehicle;
        document.getElementById("ticket-duration").textContent = ticket.duration;
        document.getElementById("ticket-terminal").textContent = ticket.terminalName;
        document.getElementById("ticket-terminal-address").textContent = ticket.terminalAddress;
        document.getElementById("ticket-price").textContent = ticket.price;
        document.getElementById("ticket-reference").textContent = ticket.reference;

        const statusBadge = document.getElementById("ticket-status-badge");
        statusBadge.textContent = ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1);
        statusBadge.className = `ticket-status-badge ${ticket.status}`;

        loadingEl.style.display = "none";
        ticketCard.style.display = "block";
        ticketActions.style.display = "block";

        document.title = `Ticket ${ticket.reference} | FSS Transport`;
    } catch (err) {
        loadingEl.style.display = "none";
        notFoundEl.style.display = "block";
    }
}

document.getElementById("print-ticket-btn").addEventListener("click", () => {
    window.print();
});

loadTicket();