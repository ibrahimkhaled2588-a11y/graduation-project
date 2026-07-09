// --- Interactive Analysis Dashboard (Stroke / CHD) ---
// Fetches live stats from the Flask API and renders Chart.js charts with
// real percentage labels. Polls on an interval so the dashboard behaves like
// an actual live BI dashboard, not a one-shot page render.

(function () {
    const root = document.getElementById('dashboardRoot');
    if (!root || typeof Chart === 'undefined') return;

    if (window.ChartDataLabels) {
        Chart.register(window.ChartDataLabels);
    }

    const centerTextPlugin = {
        id: 'centerText',
        afterDraw(chart) {
            const opts = chart.config.options.plugins && chart.config.options.plugins.centerText;
            if (!opts || !opts.text) return;
            const { ctx, chartArea } = chart;
            if (!chartArea) return;
            const centerX = (chartArea.left + chartArea.right) / 2;
            const centerY = (chartArea.top + chartArea.bottom) / 2;
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = opts.color || '#fff';
            ctx.font = "800 26px 'Cairo', sans-serif";
            ctx.fillText(opts.text, centerX, centerY - (opts.subtext ? 11 : 0));
            if (opts.subtext) {
                ctx.font = "700 11px 'Cairo', sans-serif";
                ctx.fillStyle = opts.subColor || '#a0a0b8';
                ctx.fillText(opts.subtext, centerX, centerY + 14);
            }
            ctx.restore();
        },
    };
    Chart.register(centerTextPlugin);

    const PALETTE = ['#6c63ff', '#08de9d', '#ec4899', '#0ea5e9', '#f59e0b', '#a855f7', '#f43f5e', '#22d3ee'];
    const REFRESH_MS = 45000;

    const KPI_ICONS = {
        'Total People': 'fa-users',
        Male: 'fa-mars',
        Female: 'fa-venus',
        Healthy: 'fa-heart-circle-check',
        'Stroke Cases': 'fa-triangle-exclamation',
        'Stroke Rate': 'fa-percent',
        'CHD Cases': 'fa-triangle-exclamation',
        'CHD Rate': 'fa-percent',
        'Avg Age': 'fa-cake-candles',
        'Max Heart Rate': 'fa-heart-pulse',
        'Min Heart Rate': 'fa-heart-pulse',
    };

    const CHART_ICONS = {
        outcome: 'fa-chart-pie',
        gender: 'fa-venus-mars',
        residence: 'fa-city',
        married: 'fa-ring',
        hypertension: 'fa-heart-pulse',
        heart_disease: 'fa-heart-circle-exclamation',
        smoking: 'fa-smoking',
        work_type: 'fa-briefcase',
        smoker: 'fa-smoking',
        diabetes: 'fa-syringe',
        bp_meds: 'fa-pills',
        prevalent_hyp: 'fa-gauge-high',
        prevalent_stroke: 'fa-house-medical',
        age_ranges: 'fa-chart-column',
    };

    const endpoint = root.dataset.endpoint;
    const type = root.dataset.type;
    const kpiGrid = document.getElementById('kpiGrid');
    const chartGrid = document.getElementById('chartGrid');
    const charts = {};
    let currentGender = '';
    let pollTimer = null;

    function toSeries(list) {
        return { labels: list.map((x) => x.label), values: list.map((x) => x.count) };
    }

    const CONFIGS = {
        stroke: {
            outcomeLabel: 'Stroke Rate',
            kpis: (d) => [
                { label: 'Total People', value: d.total },
                { label: 'Male', value: d.gender.find((g) => g.label === 'Male')?.count ?? 0 },
                { label: 'Female', value: d.gender.find((g) => g.label === 'Female')?.count ?? 0 },
                { label: 'Healthy', value: d.healthy },
                { label: 'Stroke Cases', value: d.positive, highlight: true },
                { label: 'Stroke Rate', value: d.positive_rate + '%', highlight: true },
                { label: 'Avg Age', value: d.avg_age },
            ],
            charts: [
                { id: 'outcome', title: 'Stroke vs Healthy', type: 'doughnut', center: (d) => ({ text: d.positive_rate + '%', subtext: 'Stroke Rate' }), data: (d) => ({ labels: ['Healthy', 'Stroke'], values: [d.healthy, d.positive] }) },
                { id: 'gender', title: 'Gender Split', type: 'doughnut', data: (d) => toSeries(d.gender) },
                { id: 'residence', title: 'Residence Type', type: 'doughnut', data: (d) => toSeries(d.residence) },
                { id: 'married', title: 'Marital Status', type: 'doughnut', data: (d) => toSeries(d.married) },
                { id: 'hypertension', title: 'Hypertension', type: 'doughnut', data: (d) => toSeries(d.hypertension) },
                { id: 'heart_disease', title: 'Heart Disease', type: 'doughnut', data: (d) => toSeries(d.heart_disease) },
                { id: 'smoking', title: 'Smoking Status', type: 'bar', data: (d) => toSeries(d.smoking) },
                { id: 'work_type', title: 'Work Type', type: 'bar', data: (d) => toSeries(d.work_type) },
                { id: 'age_ranges', title: 'Stroke Rate by Age Range', type: 'bar', wide: true, isRate: true, data: (d) => ({ labels: d.age_ranges.labels, values: d.age_ranges.rate }) },
            ],
        },
        chd: {
            outcomeLabel: 'CHD Rate',
            kpis: (d) => [
                { label: 'Total People', value: d.total },
                { label: 'Male', value: d.gender.find((g) => g.label === 'Male')?.count ?? 0 },
                { label: 'Female', value: d.gender.find((g) => g.label === 'Female')?.count ?? 0 },
                { label: 'Healthy', value: d.healthy },
                { label: 'CHD Cases', value: d.positive, highlight: true },
                { label: 'CHD Rate', value: d.positive_rate + '%', highlight: true },
                { label: 'Avg Age', value: d.avg_age },
                { label: 'Max Heart Rate', value: d.max_heart_rate },
                { label: 'Min Heart Rate', value: d.min_heart_rate },
            ],
            charts: [
                { id: 'outcome', title: 'CHD vs Healthy', type: 'doughnut', center: (d) => ({ text: d.positive_rate + '%', subtext: 'CHD Rate' }), data: (d) => ({ labels: ['Healthy', 'CHD'], values: [d.healthy, d.positive] }) },
                { id: 'gender', title: 'Gender Split', type: 'doughnut', data: (d) => toSeries(d.gender) },
                { id: 'smoker', title: 'Smoking Status', type: 'doughnut', data: (d) => toSeries(d.smoker) },
                { id: 'diabetes', title: 'Diabetes', type: 'doughnut', data: (d) => toSeries(d.diabetes) },
                { id: 'bp_meds', title: 'On BP Medication', type: 'doughnut', data: (d) => toSeries(d.bp_meds) },
                { id: 'prevalent_hyp', title: 'Prevalent Hypertension', type: 'doughnut', data: (d) => toSeries(d.prevalent_hyp) },
                { id: 'prevalent_stroke', title: 'Prevalent Stroke', type: 'doughnut', data: (d) => toSeries(d.prevalent_stroke) },
                { id: 'age_ranges', title: 'CHD Rate by Age Range', type: 'bar', wide: true, isRate: true, data: (d) => ({ labels: d.age_ranges.labels, values: d.age_ranges.rate }) },
            ],
        },
    };

    const config = CONFIGS[type];
    if (!config) return;

    function buildSkeleton() {
        kpiGrid.innerHTML = '';
        chartGrid.innerHTML = '';

        const blank = { gender: [], total: 0, healthy: 0, positive: 0, positive_rate: 0, avg_age: 0, max_heart_rate: 0, min_heart_rate: 0 };
        config.kpis(blank).forEach((kpi, i) => {
            const tile = document.createElement('div');
            tile.className = 'kpi-tile' + (kpi.highlight ? ' kpi-highlight' : '');
            tile.style.setProperty('--i', i);
            const icon = KPI_ICONS[kpi.label] || 'fa-chart-simple';
            tile.innerHTML = `
                <div class="kpi-icon"><i class="fa-solid ${icon}"></i></div>
                <div class="kpi-value" data-kpi="${kpi.label}">--</div>
                <div class="kpi-label">${kpi.label}</div>`;
            kpiGrid.appendChild(tile);
        });

        config.charts.forEach((chartCfg, i) => {
            const panel = document.createElement('div');
            panel.className = 'chart-panel' + (chartCfg.wide ? ' chart-panel-wide' : '');
            panel.style.setProperty('--i', i);
            const icon = CHART_ICONS[chartCfg.id] || 'fa-chart-simple';
            panel.innerHTML = `
                <h3><i class="fa-solid ${icon}"></i> ${chartCfg.title}</h3>
                <div class="chart-canvas-wrap"><canvas id="chart-${chartCfg.id}"></canvas></div>
                <div class="chart-legend" id="legend-${chartCfg.id}"></div>`;
            chartGrid.appendChild(panel);
        });
    }

    function percentOf(values, index) {
        const total = values.reduce((a, b) => a + b, 0);
        if (!total) return '0.0';
        return (values[index] / total * 100).toFixed(1);
    }

    function renderLegend(chartCfg, series) {
        const legendEl = document.getElementById(`legend-${chartCfg.id}`);
        if (!legendEl) return;
        legendEl.innerHTML = series.labels.map((label, i) => `
            <div class="legend-item">
                <span class="legend-dot" style="background:${PALETTE[i % PALETTE.length]}"></span>
                <span class="legend-label">${label}</span>
                <span class="legend-value">${percentOf(series.values, i)}%</span>
            </div>`).join('');
    }

    function renderChart(chartCfg, series, fullData) {
        const canvas = document.getElementById(`chart-${chartCfg.id}`);
        if (!canvas) return;

        const isDoughnut = chartCfg.type === 'doughnut';

        const dataset = {
            data: series.values,
            backgroundColor: series.labels.map((_, i) => PALETTE[i % PALETTE.length]),
            borderColor: isDoughnut ? 'rgba(15,15,35,0.9)' : PALETTE[0],
            borderWidth: isDoughnut ? 2 : 0,
            borderRadius: isDoughnut ? 0 : 6,
            hoverOffset: isDoughnut ? 6 : 0,
        };

        const centerText = isDoughnut && chartCfg.center ? chartCfg.center(fullData) : null;

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            cutout: isDoughnut ? '68%' : undefined,
            animation: { duration: 600, easing: 'easeOutQuart' },
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(15,15,35,0.95)',
                    borderColor: 'rgba(255,255,255,0.12)',
                    borderWidth: 1,
                    padding: 10,
                    titleFont: { family: 'Cairo' },
                    bodyFont: { family: 'Cairo' },
                },
                datalabels: isDoughnut
                    ? { display: false }
                    : chartCfg.isRate
                        ? { color: '#a0a0b8', anchor: 'end', align: 'top', font: { weight: 700, size: 10 }, formatter: (v) => v + '%' }
                        : { display: false },
                centerText: centerText || undefined,
            },
            scales: isDoughnut ? {} : {
                x: { ticks: { color: '#a0a0b8', font: { size: 10 } }, grid: { display: false } },
                y: { ticks: { color: '#a0a0b8', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.06)' }, beginAtZero: true },
            },
        };

        renderLegend(chartCfg, series);

        if (charts[chartCfg.id]) {
            charts[chartCfg.id].data.labels = series.labels;
            charts[chartCfg.id].data.datasets[0].data = series.values;
            charts[chartCfg.id].options.plugins.centerText = centerText || undefined;
            charts[chartCfg.id].update();
            return;
        }

        charts[chartCfg.id] = new Chart(canvas, {
            type: isDoughnut ? 'doughnut' : 'bar',
            data: { labels: series.labels, datasets: [dataset] },
            options,
        });
    }

    function animateValue(el, target) {
        const isPercent = typeof target === 'string' && target.endsWith('%');
        const numeric = parseFloat(target);
        if (Number.isNaN(numeric)) {
            el.textContent = target;
            return;
        }
        const start = parseFloat(el.dataset.rawValue || '0') || 0;
        const duration = 700;
        const startTime = performance.now();

        function tick(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            const current = Math.round(start + (numeric - start) * progress);
            el.textContent = current.toLocaleString() + (isPercent ? '%' : '');
            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                el.dataset.rawValue = String(numeric);
            }
        }
        requestAnimationFrame(tick);
    }

    function setUpdatedText(seconds) {
        const el = root.querySelector('.chart-updated-text');
        if (!el) return;
        el.textContent = seconds < 60 ? 'Updated just now' : `Updated ${Math.floor(seconds / 60)}m ago`;
    }

    let lastLoadedAt = Date.now();
    setInterval(() => setUpdatedText(Math.floor((Date.now() - lastLoadedAt) / 1000)), 1000);

    function pulseLiveDot() {
        const dot = root.querySelector('.chart-live-dot');
        const badge = root.querySelector('.chart-live-badge');
        if (!badge) return;
        badge.classList.add('pulse-refresh');
        setTimeout(() => badge.classList.remove('pulse-refresh'), 700);
    }

    async function load(gender, { silent } = {}) {
        if (!silent) chartGrid.classList.add('is-loading');
        try {
            const url = gender ? `${endpoint}?gender=${encodeURIComponent(gender)}` : endpoint;
            const res = await fetch(url);
            const data = await res.json();

            config.kpis(data).forEach((kpi) => {
                const el = kpiGrid.querySelector(`[data-kpi="${kpi.label}"]`);
                if (el) animateValue(el, kpi.value);
            });

            config.charts.forEach((chartCfg) => renderChart(chartCfg, chartCfg.data(data), data));

            lastLoadedAt = Date.now();
            setUpdatedText(0);
            pulseLiveDot();
        } catch (err) {
            if (!silent) {
                chartGrid.innerHTML = `<div class="dash-loading"><i class="fa-solid fa-triangle-exclamation"></i>Could not load live dashboard data.</div>`;
            }
        } finally {
            chartGrid.classList.remove('is-loading');
        }
    }

    function schedulePoll() {
        if (pollTimer) clearInterval(pollTimer);
        pollTimer = setInterval(() => load(currentGender, { silent: true }), REFRESH_MS);
    }

    buildSkeleton();
    load(currentGender);
    schedulePoll();

    root.querySelectorAll('.dash-pill').forEach((pill) => {
        pill.addEventListener('click', () => {
            root.querySelectorAll('.dash-pill').forEach((p) => p.classList.remove('active'));
            pill.classList.add('active');
            currentGender = pill.dataset.gender;
            load(currentGender);
            schedulePoll();
        });
    });
})();
