/* Trend Panel */
const TrendPanel = (() => {
  let chart = null;
  let activeType = 'crypto';

  const TYPE_COLORS = {
    crypto: ['#f7931a', '#627eea', '#9945ff'],
    population: ['#00bcd4', '#ff9800', '#ab47bc', '#4caf50', '#ef5350'],
    weather: ['#2196f3', '#00bcd4', '#ab47bc'],
    subway: ['#00A84D', '#0052A4', '#EF7C1C', '#00A4E3', '#D4003B'],
  };

  let coinFilter = null; // null = show all, or full coin name

  const COIN_ALIAS = {
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
    SOL: 'Solana',
  };

  function setCoinFilter(coin) {
    coinFilter = coin === 'ALL' ? null : (COIN_ALIAS[coin] || coin);
  }

  function formatDateLabel(dateStr, total) {
    // MM-DD for short periods, M/D for longer periods
    const mm = dateStr.slice(5, 7);
    const dd = dateStr.slice(8, 10);
    if (total > 60) return `${parseInt(mm)}/${parseInt(dd)}`;
    return `${mm}-${dd}`;
  }

  function buildDatasets(type, trendData) {
    const colors = TYPE_COLORS[type] || ['#888'];
    const datasets = [];

    if (!trendData || trendData.length === 0) return { labels: [], datasets: [] };

    const labels = trendData.map(t => formatDateLabel(t.date, trendData.length));
    const keys = new Set();
    trendData.forEach(t => {
      if (t.summary) Object.keys(t.summary).forEach(k => keys.add(k));
    });

    let idx = 0;
    for (const key of keys) {
      if (type === 'crypto' && coinFilter && key !== coinFilter) {
        idx++;
        continue;
      }

      const color = colors[idx % colors.length];
      const values = trendData.map(t => {
        const s = t.summary?.[key];
        if (s == null) return null;
        if (typeof s === 'number') return s;
        if (type === 'crypto') return s.last || s.avg || 0;
        if (type === 'population') return s.avg || 0;
        if (type === 'weather') return s.avg || 0;
        return s;
      });

      datasets.push({
        label: key,
        data: values,
        borderColor: color,
        backgroundColor: color + '18',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: color,
        pointBorderColor: '#0f1a2e',
        pointBorderWidth: 1,
        tension: 0.3,
        fill: false,
      });
      idx++;
    }

    return { labels, datasets };
  }

  function formatY(type, v) {
    if (v == null) return '';
    if (type === 'crypto') {
      if (v >= 1e8) return (v / 1e8).toFixed(1) + '억';
      if (v >= 1e4) return Math.round(v / 1e4) + '만';
      return v.toLocaleString('ko-KR');
    }
    if (type === 'population') {
      if (v >= 10000) return (v / 10000).toFixed(1) + '만';
      return Math.round(v).toLocaleString('ko-KR');
    }
    if (type === 'weather') return v + '°';
    return v.toLocaleString('ko-KR');
  }

  function renderChart(type, trendData) {
    activeType = type;
    const ctx = document.getElementById('trendChart').getContext('2d');
    const { labels, datasets } = buildDatasets(type, trendData);

    if (chart) {
      chart.data.labels = labels;
      chart.data.datasets = datasets;
      chart.options.scales.y.ticks.callback = v => formatY(type, v);
      chart.options.plugins.tooltip.callbacks.label = ctx =>
        `${ctx.dataset.label}: ${formatY(type, ctx.parsed.y)}`;
      chart.update('none');
      return;
    }

    chart = new Chart(ctx, {
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
              boxWidth: 12,
              boxHeight: 2,
              padding: 12,
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
              label: ctx => `${ctx.dataset.label}: ${formatY(type, ctx.parsed.y)}`,
            },
          },
        },
        scales: {
          x: {
            ticks: { color: '#5a6e8a', font: { family: "'JetBrains Mono'", size: 9 }, maxTicksLimit: 15 },
            grid: { color: 'rgba(30,58,95,0.3)' },
          },
          y: {
            ticks: {
              color: '#5a6e8a',
              font: { family: "'JetBrains Mono'", size: 9 },
              callback: v => formatY(type, v),
            },
            grid: { color: 'rgba(30,58,95,0.3)' },
          },
        },
      },
    });
  }

  function destroy() {
    if (chart) { chart.destroy(); chart = null; }
  }

  return { renderChart, destroy, getActiveType: () => activeType, setCoinFilter };
})();
