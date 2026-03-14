/* Main Application Logic */
(() => {
  const API = '/api/v1';
  let refreshTimer = null;
  let isAutoRefresh = false;
  let trendDays = 7;

  // ---- Init ----
  function init() {
    setTodayDate();
    setupDatePicker();
    setupAutoRefresh();
    setupVisibilityHandler();
    setupTrendTabs();
    loadAllData();
    checkMigrationStatus();
    document.getElementById('footerDate').textContent = todayStr();
  }

  function setTodayDate() {
    const picker = document.getElementById('datePicker');
    picker.value = todayStr();
  }

  // KST (UTC+9) 기준 오늘 날짜 — 서버와 동일한 로직
  function todayStr() {
    const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  }

  // ---- Date Picker ----
  function setupDatePicker() {
    document.getElementById('datePicker').addEventListener('change', (e) => {
      destroyCharts();
      loadAllData(e.target.value);
    });
  }

  function destroyCharts() {
    CryptoPanel.destroy();
    PopulationPanel.destroy();
    WeatherPanel.destroy();
    TrendPanel.destroy();
    DailyPanel.destroy();
  }

  // ---- Auto Refresh (at :02, :07, :12, ... :57) ----
  // +2분 오프셋: DAG 완료 대기 후 갱신
  function scheduleNextRefresh() {
    clearTimeout(refreshTimer);
    const now = new Date();
    const min = now.getMinutes();
    const sec = now.getSeconds();
    const ms = now.getMilliseconds();
    const offset = 2;
    const slotMin = Math.floor(min / 5) * 5 + offset;
    const nextSlot = slotMin > min || (slotMin === min && sec === 0 && ms === 0) ? slotMin : slotMin + 5;
    const delayMs = ((nextSlot - min) * 60 - sec) * 1000 - ms;
    refreshTimer = setTimeout(() => {
      const picker = document.getElementById('datePicker');
      if (picker.value === todayStr()) {
        loadAllData();
      }
      if (isAutoRefresh) scheduleNextRefresh();
    }, delayMs);
  }

  function setupAutoRefresh() {
    const btn = document.getElementById('autoRefreshBtn');
    btn.addEventListener('click', () => {
      isAutoRefresh = !isAutoRefresh;
      btn.classList.toggle('active', isAutoRefresh);

      if (isAutoRefresh) {
        scheduleNextRefresh();
      } else {
        clearTimeout(refreshTimer);
        refreshTimer = null;
      }
    });

    // Auto-enable on load
    btn.click();
  }

  // ---- Visibility Handler ----
  // 브라우저 탭이 백그라운드 → 포그라운드 전환 시 타이머 복구
  function setupVisibilityHandler() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden || !isAutoRefresh) return;
      // 탭 복귀 시: 즉시 데이터 갱신 + 타이머 체인 재시작
      const picker = document.getElementById('datePicker');
      if (picker.value === todayStr()) {
        loadAllData();
      }
      scheduleNextRefresh();
    });
  }

  // ---- Trend Tabs ----
  function setupTrendTabs() {
    document.getElementById('trendTabs').addEventListener('click', (e) => {
      const tab = e.target.closest('.trend-tab');
      if (!tab) return;
      document.querySelectorAll('.trend-tab').forEach(t => t.classList.remove('trend-tab--active'));
      tab.classList.add('trend-tab--active');

      const subtabs = document.getElementById('trendSubtabs');
      if (tab.dataset.type === 'crypto') {
        subtabs.style.display = '';
      } else {
        subtabs.style.display = 'none';
        TrendPanel.setCoinFilter('ALL');
      }

      loadTrend(tab.dataset.type);
    });

    document.getElementById('trendSubtabs').addEventListener('click', (e) => {
      const tab = e.target.closest('.trend-subtab');
      if (!tab) return;
      document.querySelectorAll('.trend-subtab').forEach(t => t.classList.remove('trend-subtab--active'));
      tab.classList.add('trend-subtab--active');
      TrendPanel.setCoinFilter(tab.dataset.coin);
      loadTrend('crypto');
    });

    // Show subtabs initially since crypto is the default active tab
    document.getElementById('trendSubtabs').style.display = '';
    TrendPanel.setCoinFilter('BTC');

    // Period selector
    document.getElementById('trendPeriod').addEventListener('click', (e) => {
      const btn = e.target.closest('.trend-period__btn');
      if (!btn) return;
      document.querySelectorAll('.trend-period__btn').forEach(b => b.classList.remove('trend-period__btn--active'));
      btn.classList.add('trend-period__btn--active');
      trendDays = parseInt(btn.dataset.days, 10);
      const activeTab = document.querySelector('.trend-tab--active');
      if (activeTab) loadTrend(activeTab.dataset.type);
      loadDailyTrend();
    });
  }

  // ---- Data Loading ----
  async function fetchJSON(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async function loadAllData(date) {
    const isToday = !date || date === todayStr();
    const endpoint = isToday ? 'today' : `date/${date}`;

    // Show loading states
    CryptoPanel.showLoading();
    PopulationPanel.showLoading();
    WeatherPanel.showLoading();
    SubwayPanel.showLoading();
    DailyPanel.showLoading();

    // Fetch all in parallel
    const [crypto, population, weather, subway, daily] = await Promise.all([
      fetchJSON(`${API}/crypto/${endpoint}`),
      fetchJSON(`${API}/population/${endpoint}`),
      fetchJSON(`${API}/weather/${endpoint}`),
      fetchJSON(`${API}/subway/${endpoint}`),
      fetchJSON(`${API}/daily/${endpoint}`),
    ]);

    // Render
    CryptoPanel.render(crypto?.data || {});
    PopulationPanel.render(population?.data || {});
    WeatherPanel.render(weather?.data || {});
    SubwayPanel.render(subway?.data || {});
    DailyPanel.render(daily?.data || null);

    // Update timestamp to current browser time
    updateTimestamp();

    // Load trends
    const activeTab = document.querySelector('.trend-tab--active');
    if (activeTab) loadTrend(activeTab.dataset.type);
    loadDailyTrend();
  }

  async function loadTrend(type) {
    const to = todayStr();
    const from = daysAgo(trendDays);
    const data = await fetchJSON(`${API}/${type}/trend?from=${from}&to=${to}`);
    TrendPanel.renderChart(type, data?.trend || []);
  }

  async function loadDailyTrend() {
    const to = todayStr();
    const from = daysAgo(trendDays);
    const data = await fetchJSON(`${API}/daily/trend?from=${from}&to=${to}`);
    DailyPanel.renderTrend(data?.trend || []);
  }

  function updateTimestamp() {
    document.getElementById('lastUpdatedTime').textContent =
      new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function daysAgo(n) {
    const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  }

  // ---- Migration Status ----
  async function checkMigrationStatus() {
    const data = await fetchJSON(`${API}/migration/status`);
    if (!data) return;

    const banner = document.getElementById('migrationBanner');
    const text = document.getElementById('migrationText');

    if (data.migrated) {
      const total = Object.values(data.types || {}).reduce((sum, t) => sum + (t.records || 0), 0);
      const moved = Object.values(data.types || {}).reduce((sum, t) => sum + (t.moved || 0), 0);
      const time = data.completedAt?.slice(0, 19).replace('T', ' ') || '';
      text.textContent = `KST 마이그레이션 완료 | ${total}건 처리, ${moved}건 날짜 이동 | ${time}`;
      banner.classList.add('migration-banner--success');
    } else {
      text.textContent = 'KST 마이그레이션 미완료';
      banner.classList.add('migration-banner--warning');
    }

    banner.style.display = '';
    document.getElementById('migrationClose').addEventListener('click', () => {
      banner.style.display = 'none';
    });
  }

  // ---- Start ----
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
