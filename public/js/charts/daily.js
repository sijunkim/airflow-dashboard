/* Daily Aggregate Panel */
const DailyPanel = (() => {
  const TYPE_CONFIG = {
    subway: { icon: '🚇', label: '지하철', color: '#00A84D' },
    crypto: { icon: '₿', label: '암호화폐', color: '#f7931a' },
    weather: { icon: '🌡', label: '기상', color: '#2196f3' },
    population: { icon: '👥', label: '유동인구', color: '#00bcd4' },
  };

  let trendChart = null;

  function formatNum(v) {
    if (v == null) return '--';
    return Number(v).toLocaleString('ko-KR');
  }

  function buildSummaryText(type, summary) {
    if (!summary) return '';
    switch (type) {
      case 'subway':
        return `${summary.unique_stations || 0}개 역 · ${summary.unique_lines || 0}개 노선`;
      case 'crypto':
        return `${summary.unique_coins || 0}개 코인`;
      case 'weather':
        return `${summary.unique_locations || 0}개 지역`;
      case 'population':
        return `${summary.unique_areas || 0}개 지역`;
      default:
        return '';
    }
  }

  function render(data) {
    document.getElementById('dailyLoading').classList.remove('active');
    const noData = document.getElementById('dailyNoData');
    const container = document.getElementById('dailyCards');

    if (!data || !data.types || data.types.length === 0) {
      noData.classList.add('active');
      container.innerHTML = '';
      return;
    }

    noData.classList.remove('active');
    container.innerHTML = '';

    document.getElementById('dailyTotal').textContent = `${formatNum(data.total_records)}건`;

    for (const agg of data.types) {
      const config = TYPE_CONFIG[agg.type] || { icon: '📊', label: agg.type, color: '#888' };
      const card = document.createElement('div');
      card.className = 'daily-card';
      card.style.borderTop = `2px solid ${config.color}`;
      card.innerHTML = `
        <div class="daily-card__header">
          <span class="daily-card__icon">${config.icon}</span>
          <span class="daily-card__label">${config.label}</span>
        </div>
        <div class="daily-card__records">${formatNum(agg.total_records)}건</div>
        <div class="daily-card__summary">${buildSummaryText(agg.type, agg.summary)}</div>
        <div class="daily-card__time">${agg.first_collected_at?.slice(11, 16) || '--:--'} ~ ${agg.last_collected_at?.slice(11, 16) || '--:--'}</div>
      `;
      container.appendChild(card);
    }
  }

  function renderTrend(trendData) {
    const wrap = document.getElementById('dailyTrendWrap');
    if (!trendData || trendData.length === 0) {
      wrap.style.display = 'none';
      return;
    }

    wrap.style.display = '';
    const labels = trendData.map(t => t.date.slice(5));
    const typeKeys = new Set();
    trendData.forEach(t => t.types?.forEach(tp => typeKeys.add(tp.type)));

    const datasets = [];
    for (const type of typeKeys) {
      const config = TYPE_CONFIG[type] || { color: '#888', label: type };
      datasets.push({
        label: config.label,
        data: trendData.map(t => {
          const found = t.types?.find(tp => tp.type === type);
          return found ? found.total_records : 0;
        }),
        borderColor: config.color,
        backgroundColor: config.color + '18',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: config.color,
        pointBorderColor: '#0f1a2e',
        pointBorderWidth: 1,
        tension: 0.3,
        fill: false,
      });
    }

    const ctx = document.getElementById('dailyTrendChart').getContext('2d');

    if (trendChart) {
      trendChart.data.labels = labels;
      trendChart.data.datasets = datasets;
      trendChart.update('none');
      return;
    }

    trendChart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              color: '#8899b4',
              font: { family: "'JetBrains Mono'", size: 10 },
              boxWidth: 12, boxHeight: 2, padding: 12,
            },
          },
          tooltip: {
            backgroundColor: '#0f1a2e',
            borderColor: '#1e3a5f',
            borderWidth: 1,
            bodyFont: { family: "'JetBrains Mono'", size: 11 },
            titleFont: { family: "'JetBrains Mono'", size: 11 },
            titleColor: '#8899b4',
            bodyColor: '#e8edf5',
            callbacks: {
              label: ctx => `${ctx.dataset.label}: ${formatNum(ctx.parsed.y)}건`,
            },
          },
        },
        scales: {
          x: {
            ticks: { color: '#5a6e8a', font: { family: "'JetBrains Mono'", size: 9 } },
            grid: { color: 'rgba(30,58,95,0.3)' },
          },
          y: {
            ticks: {
              color: '#5a6e8a',
              font: { family: "'JetBrains Mono'", size: 9 },
              callback: v => formatNum(v),
            },
            grid: { color: 'rgba(30,58,95,0.3)' },
          },
        },
      },
    });
  }

  function showLoading() {
    document.getElementById('dailyLoading').classList.add('active');
  }

  function destroy() {
    if (trendChart) { trendChart.destroy(); trendChart = null; }
  }

  return { render, renderTrend, showLoading, destroy };
})();
