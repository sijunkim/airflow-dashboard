/* Main Application Logic */
(() => {
  const API = '/api/v1';
  let autoRefreshInterval = null;
  let isAutoRefresh = false;

  // ---- Init ----
  function init() {
    setTodayDate();
    setupDatePicker();
    setupAutoRefresh();
    setupTrendTabs();
    loadAllData();
    document.getElementById('footerDate').textContent = new Date().toISOString().slice(0, 10);
  }

  function setTodayDate() {
    const picker = document.getElementById('datePicker');
    picker.value = todayStr();
  }

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
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
  }

  // ---- Auto Refresh ----
  function setupAutoRefresh() {
    const btn = document.getElementById('autoRefreshBtn');
    btn.addEventListener('click', () => {
      isAutoRefresh = !isAutoRefresh;
      btn.classList.toggle('active', isAutoRefresh);

      if (isAutoRefresh) {
        autoRefreshInterval = setInterval(() => {
          const picker = document.getElementById('datePicker');
          if (picker.value === todayStr()) {
            loadAllData();
          }
        }, 5 * 60 * 1000);
      } else {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
      }
    });

    // Auto-enable on load
    btn.click();
  }

  // ---- Trend Tabs ----
  function setupTrendTabs() {
    document.getElementById('trendTabs').addEventListener('click', (e) => {
      const tab = e.target.closest('.trend-tab');
      if (!tab) return;
      document.querySelectorAll('.trend-tab').forEach(t => t.classList.remove('trend-tab--active'));
      tab.classList.add('trend-tab--active');
      loadTrend(tab.dataset.type);
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

    // Fetch all in parallel
    const [crypto, population, weather, subway] = await Promise.all([
      fetchJSON(`${API}/crypto/${endpoint}`),
      fetchJSON(`${API}/population/${endpoint}`),
      fetchJSON(`${API}/weather/${endpoint}`),
      fetchJSON(`${API}/subway/${endpoint}`),
    ]);

    // Render
    CryptoPanel.render(crypto?.data || {});
    PopulationPanel.render(population?.data || {});
    WeatherPanel.render(weather?.data || {});
    SubwayPanel.render(subway?.data || {});

    // Update timestamp
    updateTimestamp(crypto?.lastUpdated || population?.lastUpdated);

    // Load trend
    const activeTab = document.querySelector('.trend-tab--active');
    if (activeTab) loadTrend(activeTab.dataset.type);
  }

  async function loadTrend(type) {
    const to = todayStr();
    const from = daysAgo(7);
    const data = await fetchJSON(`${API}/${type}/trend?from=${from}&to=${to}`);
    TrendPanel.renderChart(type, data?.trend || []);
  }

  function updateTimestamp(iso) {
    const el = document.getElementById('lastUpdatedTime');
    if (iso) {
      const d = new Date(iso);
      el.textContent = d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } else {
      el.textContent = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  }

  function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  }

  // ---- Start ----
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
