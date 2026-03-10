const { Router } = require('express');
const { readJsonl, availableDates, VALID_TYPES } = require('../services/dataReader');
const { aggregate, aggregateForTrend } = require('../services/aggregator');
const cache = require('../services/cache');

const router = Router();
const TODAY_TTL = 60 * 1000; // 1 minute

function today() {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

function isValidDate(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

router.get('/meta', (_req, res) => {
  const meta = {};
  for (const type of VALID_TYPES) {
    const dates = availableDates(type);
    meta[type] = { dates, first: dates[0] || null, last: dates[dates.length - 1] || null };
  }
  res.json(meta);
});

router.get('/:type/today', async (req, res) => {
  const { type } = req.params;
  if (!VALID_TYPES.includes(type)) return res.status(400).json({ error: 'Invalid type' });

  const date = today();
  const cacheKey = `${type}:${date}:today`;
  let data = cache.get(cacheKey);

  if (!data) {
    const rows = await readJsonl(type, date);
    data = { date, lastUpdated: new Date().toISOString(), data: aggregate(type, rows) };
    cache.set(cacheKey, data, TODAY_TTL);
  }

  res.json(data);
});

router.get('/:type/date/:date', async (req, res) => {
  const { type, date } = req.params;
  if (!VALID_TYPES.includes(type)) return res.status(400).json({ error: 'Invalid type' });
  if (!isValidDate(date)) return res.status(400).json({ error: 'Invalid date format' });

  const isToday = date === today();
  const cacheKey = `${type}:${date}:day`;
  let data = cache.get(cacheKey);

  if (!data) {
    const rows = await readJsonl(type, date);
    if (rows.length === 0) return res.status(404).json({ error: 'No data' });
    data = { date, data: aggregate(type, rows) };
    cache.set(cacheKey, data, isToday ? TODAY_TTL : 0); // 0 = no expiry for past
  }

  if (!isToday) {
    const etag = `"${type}-${date}"`;
    res.set('ETag', etag);
    if (req.headers['if-none-match'] === etag) return res.status(304).end();
  }

  res.json(data);
});

router.get('/:type/trend', async (req, res) => {
  const { type } = req.params;
  if (!VALID_TYPES.includes(type)) return res.status(400).json({ error: 'Invalid type' });

  const to = req.query.to || today();
  const from = req.query.from || daysAgo(7);

  if (!isValidDate(from) || !isValidDate(to)) return res.status(400).json({ error: 'Invalid date' });

  const dates = dateRange(from, to);
  if (dates.length > 90) return res.status(400).json({ error: 'Max 90 days' });

  const trend = [];
  for (const date of dates) {
    const cacheKey = `${type}:${date}:trend`;
    let summary = cache.get(cacheKey);
    if (!summary) {
      const rows = await readJsonl(type, date);
      summary = aggregateForTrend(type, rows);
      const isToday = date === today();
      cache.set(cacheKey, summary, isToday ? TODAY_TTL : 0);
    }
    trend.push({ date, summary });
  }

  res.json({ type, from, to, trend });
});

function daysAgo(n) {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function dateRange(from, to) {
  const dates = [];
  const d = new Date(from);
  const end = new Date(to);
  while (d <= end) {
    dates.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

module.exports = router;
