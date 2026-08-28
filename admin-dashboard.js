// =========================
// DASHBOARD OVERVIEW — real backend
// =========================
// Every number here now comes from the real database, not the old
// browser-storage demo system. Analytics revenue only counts
// bookings still 'confirmed' — a cancelled or refunded booking isn't
// money you actually kept.

const statRoutes = document.getElementById("stat-routes");
const statTrips = document.getElementById("stat-trips");
const statTerminals = document.getElementById("stat-terminals");
const statBookings = document.getElementById("stat-bookings");
const recentBookingsBody = document.getElementById("recent-bookings-body");

function money(kobo) {
    return `₦${(Number(kobo) / 100).toLocaleString()}`;
}

async function loadOverviewStats() {
    if (!statRoutes) return;

    try {
        const [routes, trips, terminals, bookings] = await Promise.all([
            apiFetch("/api/routes"),
            apiFetch("/api/trips"),
            apiFetch("/api/terminals"),
            apiFetch("/api/bookings")
        ]);

        statRoutes.textContent = routes.filter(r => r.status === "active").length;
        statTrips.textContent = trips.filter(t => t.status === "active").length;
        statTerminals.textContent = terminals.filter(t => t.status === "active").length;
        statBookings.textContent = bookings.length;

        if (bookings.length === 0) {
            recentBookingsBody.innerHTML = `
                <tr>
                    <td colspan="5">
                        <div class="admin-empty">No bookings yet — they'll show up here as customers pay on the courier and passenger pages.</div>
                    </td>
                </tr>
            `;
            return;
        }

        const recent = [...bookings]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5);

        recentBookingsBody.innerHTML = recent.map(b => {
            const isParcel = b.type === "parcel";
            const customer = isParcel ? b.sender_name : b.passenger_name;
            const route = isParcel ? `${b.from_city} → ${b.to_city}` : "—";

            return `
                <tr>
                    <td>${b.reference}</td>
                    <td><span class="status-badge ${isParcel ? "inactive" : "active"}">${isParcel ? "Parcel" : "Passenger"}</span></td>
                    <td>${customer}</td>
                    <td>${route}</td>
                    <td>${money(b.price_kobo)}</td>
                </tr>
            `;
        }).join("");
    } catch (err) {
        showToast(err.message);
    }
}

// =========================
// ANALYTICS
// =========================

const rangeSelect = document.getElementById("analytics-range");
const revenueChart = document.getElementById("revenue-chart");
const topRoutesBody = document.getElementById("top-routes-body");

async function loadAnalytics() {
    if (!rangeSelect) return;

    try {
        const data = await apiFetch(`/api/analytics?days=${rangeSelect.value}`);

        document.getElementById("an-revenue").textContent = money(data.summary.totalRevenueKobo);
        document.getElementById("an-confirmed").textContent = data.summary.confirmedCount;
        document.getElementById("an-cancelled").textContent = data.summary.cancelledCount;
        document.getElementById("an-refunded").textContent = money(data.summary.refundedKobo);

        renderChart(data.daily);
        renderTopRoutes(data.topRoutes);
    } catch (err) {
        showToast(err.message);
    }
}

function renderChart(daily) {
    if (daily.length === 0) {
        revenueChart.innerHTML = `<p class="admin-empty">No bookings in this range yet.</p>`;
        return;
    }

    const maxRevenue = Math.max(...daily.map(d => d.revenueKobo), 1);

    revenueChart.innerHTML = daily.map(d => {
        const heightPercent = Math.max((d.revenueKobo / maxRevenue) * 100, 2);
        const label = new Date(d.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

        return `
            <div class="admin-chart-bar-col" title="${label}: ${money(d.revenueKobo)} (${d.bookingsCount} booking${d.bookingsCount === 1 ? "" : "s"})">
                <div class="admin-chart-bar" style="height:${heightPercent}%;"></div>
                <span class="admin-chart-bar-label">${label}</span>
            </div>
        `;
    }).join("");
}

function renderTopRoutes(topRoutes) {
    if (topRoutes.length === 0) {
        topRoutesBody.innerHTML = `
            <tr>
                <td colspan="3">
                    <div class="admin-empty">No confirmed passenger bookings in this range yet.</div>
                </td>
            </tr>
        `;
        return;
    }

    topRoutesBody.innerHTML = topRoutes.map(r => `
        <tr>
            <td>${r.route}</td>
            <td>${r.bookingsCount}</td>
            <td>${money(r.revenueKobo)}</td>
        </tr>
    `).join("");
}

if (rangeSelect) {
    rangeSelect.addEventListener("change", loadAnalytics);
}

loadOverviewStats();
loadAnalytics();