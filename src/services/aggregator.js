function aggregateCrypto(rows) {
  const coins = {};
  for (const r of rows) {
    const name = r.coin_name;
    if (!coins[name]) coins[name] = { current: null, history: [] };
    coins[name].history.push({
      time: extractTime(r.collected_at),
      price: r.current_price_krw,
    });
    coins[name].current = {
      price: r.current_price_krw,
      change24h: r.price_change_24h_pct,
      volume: r.total_volume,
      high24h: r.high_24h,
      low24h: r.low_24h,
    };
  }
  return coins;
}

function aggregatePopulation(rows) {
  const areas = {};
  for (const r of rows) {
    const name = r.area_name;
    if (!areas[name]) areas[name] = { current: null, history: [] };
    areas[name].history.push({
      time: extractTime(r.collected_at),
      min: r.population_min,
      max: r.population_max,
      level: r.congestion_level,
    });
    areas[name].current = {
      level: r.congestion_level,
      message: r.congestion_message,
      min: r.population_min,
      max: r.population_max,
      maleRate: r.male_rate,
      femaleRate: r.female_rate,
      ages: {
        '0-9': r.age_rate_0, '10대': r.age_rate_10, '20대': r.age_rate_20,
        '30대': r.age_rate_30, '40대': r.age_rate_40, '50대': r.age_rate_50,
        '60대': r.age_rate_60, '70+': r.age_rate_70,
      },
      residentRate: r.resident_rate,
      nonResidentRate: r.non_resident_rate,
      populationTime: r.population_time,
    };
  }
  return areas;
}

function aggregateWeather(rows) {
  const locations = {};
  for (const r of rows) {
    const name = r.location_name;
    if (!locations[name]) locations[name] = { current: null, history: [] };
    locations[name].history.push({
      time: extractTime(r.collected_at),
      temperature: r.temperature,
      humidity: r.humidity,
      windSpeed: r.wind_speed,
    });
    locations[name].current = {
      temperature: r.temperature,
      precipitation: r.precipitation,
      precipitationType: r.precipitation_type,
      humidity: r.humidity,
      windDirection: r.wind_direction,
      windSpeed: r.wind_speed,
    };
  }
  return locations;
}

function aggregateSubway(rows) {
  const stations = {};
  for (const r of rows) {
    const name = r.station_name;
    if (!stations[name]) stations[name] = [];
    stations[name].push({
      line: r.line,
      direction: r.direction,
      destination: r.destination,
      arrivalMessage: r.arrival_message,
      arrivalSeconds: r.arrival_seconds,
      currentPosition: r.current_position,
      collectedAt: r.collected_at,
    });
  }
  // keep only latest collection per station
  for (const name of Object.keys(stations)) {
    const arrivals = stations[name];
    if (arrivals.length === 0) continue;
    const latestTime = arrivals[arrivals.length - 1].collectedAt;
    const cutoff = new Date(new Date(latestTime).getTime() - 60_000).toISOString();
    stations[name] = arrivals.filter(a => a.collectedAt >= cutoff);
  }
  return stations;
}

function aggregateForTrend(type, rows) {
  switch (type) {
    case 'crypto': {
      const coins = {};
      for (const r of rows) {
        if (!coins[r.coin_name]) coins[r.coin_name] = [];
        coins[r.coin_name].push(r.current_price_krw);
      }
      const result = {};
      for (const [name, prices] of Object.entries(coins)) {
        result[name] = { avg: avg(prices), last: prices[prices.length - 1] };
      }
      return result;
    }
    case 'population': {
      const areas = {};
      for (const r of rows) {
        if (!areas[r.area_name]) areas[r.area_name] = [];
        areas[r.area_name].push((r.population_min + r.population_max) / 2);
      }
      const result = {};
      for (const [name, pops] of Object.entries(areas)) {
        result[name] = { avg: Math.round(avg(pops)) };
      }
      return result;
    }
    case 'weather': {
      const locs = {};
      for (const r of rows) {
        if (!locs[r.location_name]) locs[r.location_name] = [];
        if (r.temperature != null) locs[r.location_name].push(r.temperature);
      }
      const result = {};
      for (const [name, temps] of Object.entries(locs)) {
        result[name] = {
          avg: Math.round(avg(temps) * 10) / 10,
          high: Math.max(...temps),
          low: Math.min(...temps),
        };
      }
      return result;
    }
    case 'subway': {
      const stations = {};
      for (const r of rows) {
        stations[r.station_name] = (stations[r.station_name] || 0) + 1;
      }
      return stations;
    }
    default:
      return {};
  }
}

function aggregate(type, rows) {
  switch (type) {
    case 'crypto': return aggregateCrypto(rows);
    case 'population': return aggregatePopulation(rows);
    case 'weather': return aggregateWeather(rows);
    case 'subway': return aggregateSubway(rows);
    default: return {};
  }
}

function extractTime(collectedAt) {
  if (!collectedAt) return '';
  const s = String(collectedAt);
  const tIdx = s.indexOf('T');
  if (tIdx === -1) return s;
  return s.substring(tIdx + 1, tIdx + 6); // HH:mm
}

function avg(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

module.exports = { aggregate, aggregateForTrend };
