/* Subway Panel */
const SubwayPanel = (() => {
  let allData = null;

  const LINE_COLORS = {
    '1호선': '#0052A4', '2호선': '#00A84D', '3호선': '#EF7C1C', '4호선': '#00A4E3',
    '5호선': '#996CAC', '6호선': '#CD7C2F', '7호선': '#747F00', '8호선': '#E6186C',
    '9호선': '#BDB092', '경의중앙선': '#77C4A3', '공항철도': '#0090D2',
    '경춘선': '#0C8E72', '수인분당선': '#FABE00', '신분당선': '#D4003B',
  };

  function getLineColor(line) {
    return LINE_COLORS[line] || '#5a6e8a';
  }

  function populateSelect(data) {
    const select = document.getElementById('subwayStationSelect');
    const stations = Object.keys(data);
    if (select.options.length === stations.length) return;
    select.innerHTML = '';
    stations.forEach(st => {
      const opt = document.createElement('option');
      opt.value = st;
      opt.textContent = st;
      select.appendChild(opt);
    });
    select.onchange = () => renderTable(select.value);
  }

  function renderTable(station) {
    if (!allData) return;
    const arrivals = allData[station] || [];
    const tbody = document.getElementById('subwayTableBody');

    if (arrivals.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="subway-empty">도착 정보 없음</td></tr>';
      return;
    }

    // Sort by arrival seconds
    const sorted = [...arrivals].sort((a, b) => a.arrivalSeconds - b.arrivalSeconds);

    tbody.innerHTML = sorted.map(a => {
      const color = getLineColor(a.line);
      const isSoon = a.arrivalSeconds <= 120;
      const arrivalClass = isSoon ? 'subway-arrival subway-arrival--soon' : 'subway-arrival';

      return `<tr>
        <td><span class="subway-line-badge" style="background:${color}">${a.line}</span></td>
        <td>${a.direction}</td>
        <td>${a.destination}</td>
        <td><span class="${arrivalClass}">${a.arrivalMessage}</span></td>
      </tr>`;
    }).join('');
  }

  function render(data) {
    document.getElementById('subwayLoading').classList.remove('active');
    const noData = document.getElementById('subwayNoData');
    const isEmpty = !data || Object.keys(data).length === 0;
    noData.classList.toggle('active', isEmpty);
    document.getElementById('subwayTableWrap').style.display = isEmpty ? 'none' : '';
    if (isEmpty) return;
    allData = data;
    populateSelect(data);
    const selected = document.getElementById('subwayStationSelect').value || Object.keys(data)[0];
    renderTable(selected);
  }

  function showLoading() {
    document.getElementById('subwayLoading').classList.add('active');
  }

  function destroy() {}

  return { render, showLoading, destroy };
})();
