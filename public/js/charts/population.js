/* Population Panel */
const PopulationPanel = (() => {
  let areaChart = null;
  let donutChart = null;
  let allData = null;

  const AREA_COLORS = [
    { line: '#00bcd4', bg: 'rgba(0,188,212,0.12)' },
    { line: '#ff9800', bg: 'rgba(255,152,0,0.12)' },
    { line: '#ab47bc', bg: 'rgba(171,71,188,0.12)' },
    { line: '#4caf50', bg: 'rgba(76,175,80,0.12)' },
    { line: '#ef5350', bg: 'rgba(239,83,80,0.12)' },
  ];

  function formatPop(v) {
    if (v == null) return '--';
    if (v >= 10000) return (v / 10000).toFixed(1) + '만';
    return v.toLocaleString('ko-KR');
  }

  function updateBadge(areaData) {
    const badge = document.getElementById('congestionBadge');
    if (!areaData || !areaData.current) {
      badge.dataset.level = '';
      badge.querySelector('.congestion-badge__level').textContent = '--';
      badge.querySelector('.congestion-badge__count').textContent = '--';
      return;
    }
    const c = areaData.current;
    badge.dataset.level = c.level;
    badge.querySelector('.congestion-badge__level').textContent = c.level;
    badge.querySelector('.congestion-badge__count').textContent =
      `${formatPop(c.min)} ~ ${formatPop(c.max)}명`;
  }

  function renderDonut(areaData) {
    const ctx = document.getElementById('ageDonutChart').getContext('2d');
    if (!areaData || !areaData.current) return;

    const ages = areaData.current.ages;
    const labels = Object.keys(ages);
    const values = Object.values(ages);
    const colors = ['#1a237e', '#283593', '#3949ab', '#5c6bc0', '#7986cb', '#9fa8da', '#c5cae9', '#e8eaf6'];

    if (donutChart) {
      donutChart.data.labels = labels;
      donutChart.data.datasets[0].data = values;
      donutChart.update('none');
      return;
    }

    donutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderColor: '#0f1a2e',
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f1a2e',
            borderColor: '#1e3a5f',
            borderWidth: 1,
            bodyFont: { family: "'JetBrains Mono'", size: 10 },
            titleFont: { family: "'IBM Plex Sans KR'", size: 11 },
            titleColor: '#8899b4',
            bodyColor: '#e8edf5',
            callbacks: {
              label: ctx => ` ${ctx.label}: ${ctx.parsed}%`,
            },
          },
        },
      },
    });
  }

  function renderAreaChart(selectedArea) {
    if (!allData) return;
    const ctx = document.getElementById('populationChart').getContext('2d');
    const areaData = allData[selectedArea];
    if (!areaData) return;

    const history = areaData.history;
    const datasets = [
      {
        label: '최대',
        data: history.map(h => ({ x: h.time, y: h.max })),
        borderColor: 'rgba(0,188,212,0.8)',
        backgroundColor: 'rgba(0,188,212,0.08)',
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.3,
        fill: '+1',
      },
      {
        label: '최소',
        data: history.map(h => ({ x: h.time, y: h.min })),
        borderColor: 'rgba(0,188,212,0.4)',
        backgroundColor: 'rgba(0,188,212,0.04)',
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.3,
        fill: false,
      },
    ];

    if (areaChart) {
      areaChart.data.datasets = datasets;
      areaChart.update('none');
      return;
    }

    areaChart = new Chart(ctx, {
      type: 'line',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f1a2e',
            borderColor: '#1e3a5f',
            borderWidth: 1,
            bodyFont: { family: "'JetBrains Mono'", size: 11 },
            titleFont: { family: "'JetBrains Mono'", size: 11 },
            titleColor: '#8899b4',
            bodyColor: '#e8edf5',
            callbacks: { label: ctx => `${ctx.dataset.label}: ${formatPop(ctx.parsed.y)}명` },
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
              callback: v => formatPop(v),
            },
            grid: { color: 'rgba(30,58,95,0.3)' },
          },
        },
      },
    });
  }

  function populateSelect(data) {
    const select = document.getElementById('populationAreaSelect');
    const areas = Object.keys(data);
    if (select.options.length === areas.length) return;
    select.innerHTML = '';
    areas.forEach(area => {
      const opt = document.createElement('option');
      opt.value = area;
      opt.textContent = area;
      select.appendChild(opt);
    });
    select.addEventListener('change', () => {
      const selected = select.value;
      updateBadge(data[selected]);
      renderDonut(data[selected]);
      renderAreaChart(selected);
    });
  }

  function render(data) {
    document.getElementById('populationLoading').classList.remove('active');
    if (!data || Object.keys(data).length === 0) {
      document.querySelector('#populationPanel .panel__body').innerHTML = '<div class="no-data">데이터 없음</div>';
      return;
    }
    allData = data;
    populateSelect(data);
    const selected = document.getElementById('populationAreaSelect').value || Object.keys(data)[0];
    updateBadge(data[selected]);
    renderDonut(data[selected]);
    renderAreaChart(selected);
  }

  function showLoading() {
    document.getElementById('populationLoading').classList.add('active');
  }

  function destroy() {
    if (areaChart) { areaChart.destroy(); areaChart = null; }
    if (donutChart) { donutChart.destroy(); donutChart = null; }
  }

  return { render, showLoading, destroy };
})();
