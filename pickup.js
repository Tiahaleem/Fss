// =========================
// PICKUP CENTERS PAGE
// =========================
// Renders every active terminal, grouped by city, from the REAL
// backend now (GET /api/terminals). Adding/removing a terminal in
// admin-pickup.html now actually changes this page for a real customer.

const pickupCentersSection = document.getElementById("pickup-centers");

const pinIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" /><path fill="#a9dae1" d="M16 10c0-2.21-1.79-4-4-4s-4 1.79-4 4s1.79 4 4 4s4-1.79 4-4m-6 0c0-1.1.9-2 2-2s2 .9 2 2s-.9 2-2 2s-2-.9-2-2" /><path fill="#a9dae1" d="M11.42 21.81c.17.12.38.19.58.19s.41-.06.58-.19c.3-.22 7.45-5.37 7.42-11.82c0-4.41-3.59-8-8-8s-8 3.59-8 8c-.03 6.44 7.12 11.6 7.42 11.82M12 4c3.31 0 6 2.69 6 6c.02 4.44-4.39 8.43-6 9.74c-1.61-1.31-6.02-5.29-6-9.74c0-3.31 2.69-6 6-6" /></svg>';
const phoneIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" /><path fill="#61d1d5" d="M19.95 21q-3.125 0-6.175-1.362t-5.55-3.863t-3.862-5.55T3 4.05q0-.45.3-.75t.75-.3H8.1q.35 0 .625.238t.325.562l.65 3.5q.05.4-.025.675T9.4 8.45L6.975 10.9q.5.925 1.187 1.787t1.513 1.663q.775.775 1.625 1.438T13.1 17l2.35-2.35q.225-.225.588-.337t.712-.063l3.45.7q.35.1.575.363T21 15.9v4.05q0 .45-.3.75t-.75.3M6.025 9l1.65-1.65L7.25 5H5.025q.125 1.025.35 2.025T6.025 9m8.95 8.95q.975.425 1.988.675T19 18.95v-2.2l-2.35-.475zm0 0" /></svg>';
const clockIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" /><path fill="#61d1d5" d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2m0 2a8 8 0 1 0 0 16a8 8 0 0 0 0-16m0 2a1 1 0 0 1 .993.883L13 7v4.586l2.707 2.707a1 1 0 0 1-1.32 1.497l-.094-.083l-3-3a1 1 0 0 1-.284-.576L11 12V7a1 1 0 0 1 1-1" /></svg>';

async function loadTerminals() {
    if (!pickupCentersSection) return;

    try {
        const terminals = (await apiFetch("/api/terminals")).filter(t => t.status === "active");

        if (terminals.length === 0) {
            pickupCentersSection.innerHTML = `
                <div class="admin-empty">No pickup centers are published right now — check back soon.</div>
            `;
            return;
        }

        const cities = [...new Set(terminals.map(t => t.city))];

        pickupCentersSection.innerHTML = cities.map(city => {
            const cityTerminals = terminals.filter(t => t.city === city);

            return `
                <div class="city-block">

                    <h2>${city}</h2>

                    <div class="pickup-grid">
                        ${cityTerminals.map(t => `
                            <div class="pickup-card">

                                <div class="pickup-icon">${pinIcon}</div>

                                <h3>${t.name}</h3>
                                <p>${t.address}</p>

                                <div class="pickup-divider"></div>

                                <div class="pickup-info">${phoneIcon} ${t.phone}</div>
                                <div class="pickup-info">${clockIcon} ${t.hours}</div>

                            </div>
                        `).join("")}
                    </div>

                </div>
            `;
        }).join("");
    } catch (err) {
        pickupCentersSection.innerHTML = `
            <div class="admin-empty">Couldn't load pickup centers right now. Please try again shortly.</div>
        `;
    }
}

loadTerminals();