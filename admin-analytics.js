// =========================
// ANALYTICS (admin)
// =========================

let currentDays = 30;

const rangeButtons = document.querySelectorAll(".analytics-range-btn");
const revenueChart = document.getElementById("revenue-chart");
const topRoutesBody = document.getElementById("top-routes-body");

function money(kobo) {
    return "₦" + Math.round(kobo / 100).toLocaleString();
}

async function loadAnalytics() {
    try {
        const data = await apiFetch(`/api/analytics?days=${currentDays}`);
        renderStats(data.summary);
        renderRevenueChart(data.daily);
        renderTopRoutes(data.topRoutes);
    } catch (err) {
        showToast(err.message);
    }
}

function renderStats(summary) {
    document.getElementById("stat-revenue").textContent = money(summary.totalRevenueKobo);
    document.getElementById("stat-confirmed").textContent = summary.confirmedCount;
    document.getElementById("stat-cancelled").textContent = summary.cancelledCount;
    document.getElementById("stat-refunded").textContent = summary.refundedCount;
}

function renderRevenueChart(daily) {
    if (daily.length === 0) {
        revenueChart.innerHTML = `<div class="analytics-empty">No confirmed bookings in this period yet.</div>`;
        return;
    }

    const maxRevenue = Math.max(...daily.map(d => d.revenueKobo), 1); // avoid divide-by-zero when everything is 0

    revenueChart.innerHTML = daily.map(d => {
        const heightPercent = Math.max((d.revenueKobo / maxRevenue) * 100, 1);
        const dateLabel = new Date(d.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
        return `
            <div class="revenue-bar-wrap">
                <span class="revenue-bar-tooltip">${dateLabel}: ${money(d.revenueKobo)}</span>
                <div class="revenue-bar" style="height:${heightPercent}%;"></div>
            </div>
        `;
    }).join("");
}

function renderTopRoutes(topRoutes) {
    if (topRoutes.length === 0) {
        topRoutesBody.innerHTML = `<tr><td colspan="3"><div class="analytics-empty">No confirmed passenger trips in this period yet.</div></td></tr>`;
        return;
    }

    topRoutesBody.innerHTML = topRoutes.map(r => `
        <tr>
            <td>${escapeHtml(r.route)}</td>
            <td>${r.bookingsCount}</td>
            <td>${money(r.revenueKobo)}</td>
        </tr>
    `).join("");
}

rangeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        rangeButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentDays = Number(btn.dataset.days);
        loadAnalytics();
    });
});

loadAnalytics();