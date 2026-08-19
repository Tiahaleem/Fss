// =========================
// ROUTES PAGE
// =========================
// Renders every active route from the REAL backend now
// (GET /api/routes) — editing a route's price/status in
// admin-routes.html now actually changes what a real customer sees
// here, since both talk to the same Supabase database.

const routesGrid = document.getElementById("routes-grid");

const distanceIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" /><path fill="#81dade" d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2zm-7.2 2l1.2-1.2V4h4v8.8l1.2 1.2z" /></svg>';
const clockIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" /><path fill="#81dade" d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2m0 2a8 8 0 1 0 0 16a8 8 0 0 0 0-16m0 2a1 1 0 0 1 .993.883L13 7v4.586l2.707 2.707a1 1 0 0 1-1.32 1.497l-.094-.083l-3-3a1 1 0 0 1-.284-.576L11 12V7a1 1 0 0 1 1-1" /></svg>';

async function loadRoutes() {
    if (!routesGrid) return;

    try {
        const routes = (await apiFetch("/api/routes")).filter(r => r.status === "active");

        if (routes.length === 0) {
            routesGrid.innerHTML = `
                <div class="admin-empty" style="grid-column: 1 / -1;">
                    No routes are published right now — check back soon.
                </div>
            `;
            return;
        }

        routesGrid.innerHTML = routes.map(route => `
            <div class="route-card">

                <div class="route-top">
                    <span>${distanceIcon} ${route.distance} KM • ${route.duration.toUpperCase()}</span>
                </div>

                <div class="route-cities">
                    <h3>${route.from}</h3>
                    <h3>${route.to}</h3>
                </div>

                <div class="route-bottom">
                    <span>${clockIcon} Multiple daily</span>
                    <strong>₦${Number(route.price).toLocaleString()}</strong>
                </div>

                <a href="schedule.html?from=${encodeURIComponent(route.from)}&to=${encodeURIComponent(route.to)}" class="route-btn">
                    See Schedule →
                </a>

            </div>
        `).join("");
    } catch (err) {
        routesGrid.innerHTML = `
            <div class="admin-empty" style="grid-column: 1 / -1;">
                Couldn't load routes right now. Please try again shortly.
            </div>
        `;
    }
}

loadRoutes();