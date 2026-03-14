/* Daily Aggregate Panel */
const DailyPanel = (() => {
  const TYPE_CONFIG = {
    subway: { icon: '🚇', label: '지하철', color: '#00A84D' },
    crypto: { icon: '₿', label: '암호화폐', color: '#f7931a' },
    weather: { icon: '🌡', label: '기상', color: '#2196f3' },
    population: { icon: '👥', label: '유동인구', color: '#00bcd4' },
  };

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

  function showLoading() {
    document.getElementById('dailyLoading').classList.add('active');
  }

  function destroy() {}

  return { render, showLoading, destroy };
})();
