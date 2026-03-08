/* Crypto Panel */
const CryptoPanel = (() => {
  let chart = null;

  const COIN_COLORS = {
    Bitcoin: { line: '#f7931a', bg: 'rgba(247,147,26,0.08)' },
    Ethereum: { line: '#627eea', bg: 'rgba(98,126,234,0.08)' },
    Solana: { line: '#9945ff', bg: 'rgba(153,69,255,0.08)' },
  };

  function formatKRW(v) {
    if (v == null) return '--';
    if (v >= 1e8) return (v / 1e8).toFixed(2) + '억';
    if (v >= 1e4) return Math.round(v).toLocaleString('ko-KR');
    return Number(v).toLocaleString('ko-KR');
  }

  function renderCards(data) {
    const container = document.getElementById('cryptoCards');
    container.innerHTML = '';
    let count = 0;

    for (const [name, info] of Object.entries(data)) {
      count++;
      const c = info.current;
      if (!c) continue;
      const changeClass = c.change24h >= 0 ? 'positive' : 'negative';
      const changeSign = c.change24h >= 0 ? '+' : '';
      const shortName = name === 'Bitcoin' ? 'BTC' : name === 'Ethereum' ? 'ETH' : 'SOL';

      const card = document.createElement('div');
      card.className = 'crypto-card';
      card.style.borderTop = `2px solid ${COIN_COLORS[name]?.line || '#888'}`;
      card.innerHTML = `
        <div class="crypto-card__name">${shortName}</div>
        <div class="crypto-card__price">₩${formatKRW(c.price)}</div>
        <div class="crypto-card__change ${changeClass}">${changeSign}${Number(c.change24h).toFixed(2)}%</div>
        <div class="crypto-card__range">H ${formatKRW(c.high24h)} · L ${formatKRW(c.low24h)}</div>
      `;
      container.appendChild(card);
    }

    document.getElementById('cryptoCount').textContent = `${count}종`;
  }

  function renderChart(data) {
    const ctx = document.getElementById('cryptoChart').getContext('2d');
    const datasets = [];

    for (const [name, info] of Object.entries(data)) {
      const colors = COIN_COLORS[name] || { line: '#888', bg: 'rgba(136,136,136,0.08)' };
      datasets.push({
        label: name,
        data: info.history.map(h => ({ x: h.time, y: h.price })),
        borderColor: colors.line,
        backgroundColor: colors.bg,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.3,
        fill: true,
      });
    }

    if (chart) {
      chart.data.datasets = datasets;
      chart.update('none');
      return;
    }

    chart = new Chart(ctx, {
      type: 'line',
      data: { datasets },
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
            titleFont: { family: "'JetBrains Mono'", size: 11 },
            bodyFont: { family: "'JetBrains Mono'", size: 11 },
            titleColor: '#8899b4',
            bodyColor: '#e8edf5',
            padding: 10,
            callbacks: {
              label: ctx => `${ctx.dataset.label}: ₩${formatKRW(ctx.parsed.y)}`,
            },
          },
        },
        scales: {
          x: {
            type: 'category',
            ticks: { color: '#5a6e8a', font: { family: "'JetBrains Mono'", size: 9 }, maxTicksLimit: 8 },
            grid: { color: 'rgba(30,58,95,0.3)' },
          },
          y: {
            ticks: {
              color: '#5a6e8a',
              font: { family: "'JetBrains Mono'", size: 9 },
              callback: v => formatKRW(v),
            },
            grid: { color: 'rgba(30,58,95,0.3)' },
          },
        },
      },
    });
  }

  function render(data) {
    const loading = document.getElementById('cryptoLoading');
    loading.classList.remove('active');
    if (!data || Object.keys(data).length === 0) {
      document.querySelector('#cryptoPanel .panel__body').innerHTML = '<div class="no-data">데이터 없음</div>';
      return;
    }
    renderCards(data);
    renderChart(data);
  }

  function showLoading() {
    document.getElementById('cryptoLoading').classList.add('active');
  }

  function destroy() {
    if (chart) { chart.destroy(); chart = null; }
  }

  return { render, showLoading, destroy };
})();
