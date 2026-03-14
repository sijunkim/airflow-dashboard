const fs = require('fs');
const path = require('path');
const readline = require('readline');

const DATA_DIR = process.env.DATA_DIR || '/data';
const VALID_TYPES = ['subway', 'crypto', 'weather', 'population'];

function filePath(type, date) {
  return path.join(DATA_DIR, type, `${date}.jsonl`);
}

async function readJsonl(type, date) {
  const fp = filePath(type, date);
  if (!fs.existsSync(fp)) return [];

  const lines = [];
  const rl = readline.createInterface({
    input: fs.createReadStream(fp),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (line.trim()) {
      try {
        lines.push(JSON.parse(line));
      } catch (_) { /* skip malformed */ }
    }
  }
  return lines;
}

function readDailyJson(date) {
  const fp = path.join(DATA_DIR, 'daily', `${date}.json`);
  if (!fs.existsSync(fp)) return null;
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf-8'));
  } catch (_) {
    return null;
  }
}

function availableDates(type) {
  const dir = path.join(DATA_DIR, type);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.jsonl'))
    .map(f => f.replace('.jsonl', ''))
    .sort();
}

module.exports = { readJsonl, readDailyJson, availableDates, VALID_TYPES, DATA_DIR };
