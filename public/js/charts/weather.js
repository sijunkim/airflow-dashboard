/* Weather Panel */
const WeatherPanel = (() => {
  let chart = null;

  const LOC_COLORS = {
    '서울': '#2196f3',
    '강남': '#00bcd4',
    '판교': '#ab47bc',
  };

  function renderCards(data) {
    const container = document.getElementById('weatherCards');
    container.innerHTML = '';

    for (const [name, info] of Object.entries(data)) {
      const c = info.current;
      if (!c) continue;
      const card = document.createElement('div');
      card.className = 'weather-card';
      card.innerHTML = `
        <div class="weather-card__location">${name}</div>
        <div class="weather-card__temp">${c.temperature != null ? c.temperature + '°' : '--'}<span>C</span></div>
        <div class="weather-card__details">
          <span>💧 ${c.humidity != null ? c.humidity + '%' : '--'}</span>
          <span>💨 ${c.windSpeed != null ? c.windSpeed + 'm/s' : '--'}</span>
          <span>${c.precipitationType || '맑음'}</span>
        </div>
      `;
      container.appendChild(card);
    }
  }

  function renderChart(data) {
    const ctx = document.getElementById('weatherChart').getContext('2d');
    const datasets = [];

    for (const [name, info] of Object.entries(data)) {
      const color = LOC_COLORS[name] || '#888';
      datasets.push({
        label: name,
        data: info.history.map(h => ({ x: h.time, y: h.temperature })),
        borderColor: color,
        backgroundColor: color + '15',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: color,
        pointBorderColor: '#0f1a2e',
        pointBorderWidth: 1,
        tension: 0.3,
        fill: false,
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
            bodyFont: { family: "'JetBrains Mono'", size: 11 },
            titleFont: { family: "'JetBrains Mono'", size: 11 },
            titleColor: '#8899b4',
            bodyColor: '#e8edf5',
            callbacks: {
              label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y}°C`,
            },
          },
        },
        scales: {
          x: {
            type: 'category',
            ticks: { color: '#5a6e8a', font: { family: "'JetBrains Mono'", size: 9 } },
            grid: { color: 'rgba(30,58,95,0.3)' },
          },
          y: {
            ticks: {
              color: '#5a6e8a',
              font: { family: "'JetBrains Mono'", size: 9 },
              callback: v => v + '°',
            },
            grid: { color: 'rgba(30,58,95,0.3)' },
          },
        },
      },
    });
  }

  function render(data) {
    document.getElementById('weatherLoading').classList.remove('active');
    const noData = document.getElementById('weatherNoData');
    const isEmpty = !data || Object.keys(data).length === 0;
    noData.classList.toggle('active', isEmpty);
    document.getElementById('weatherChartWrap').style.display = isEmpty ? 'none' : '';
    if (isEmpty) {
      document.getElementById('weatherCards').innerHTML = '';
      return;
    }
    renderCards(data);
    renderChart(data);
  }

  function showLoading() {
    document.getElementById('weatherLoading').classList.add('active');
  }

  function destroy() {
    if (chart) { chart.destroy(); chart = null; }
  }

  return { render, showLoading, destroy };
})();
