/**
 * One-time migration: UTC → KST
 *
 * - JSONL 파일의 collected_at(UTC)을 KST(+9h)로 변환
 * - KST 날짜 기준으로 파일 재배치
 * - /data/daily/ 삭제 (배치가 재생성)
 * - 완료 후 /data/.migrated-kst 마커 파일 생성
 *
 * 배포 2에서 이 파일 전체를 삭제하면 됩니다.
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || '/data';
const MARKER_FILE = path.join(DATA_DIR, '.migrated-kst');
const TYPES = ['subway', 'crypto', 'weather', 'population'];
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function toKST(utcStr) {
  const utc = new Date(utcStr + 'Z');
  const kst = new Date(utc.getTime() + KST_OFFSET_MS);
  return kst.toISOString().slice(0, 19); // "YYYY-MM-DDTHH:mm:ss"
}

function deleteDirRecursive(dir) {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count += deleteDirRecursive(fullPath);
      fs.rmdirSync(fullPath);
    } else {
      fs.unlinkSync(fullPath);
      count++;
    }
  }
  return count;
}

function migrateType(type) {
  const typeDir = path.join(DATA_DIR, type);
  if (!fs.existsSync(typeDir)) {
    return { files: 0, newFiles: 0, records: 0, moved: 0 };
  }

  const files = fs.readdirSync(typeDir).filter(f => f.endsWith('.jsonl'));
  if (files.length === 0) {
    return { files: 0, newFiles: 0, records: 0, moved: 0 };
  }

  // Read all records from all files
  const allRecords = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(typeDir, file), 'utf-8');
    for (const line of content.split('\n')) {
      if (!line.trim()) continue;
      try {
        allRecords.push(JSON.parse(line));
      } catch (_) { /* skip malformed */ }
    }
  }

  // Convert collected_at UTC → KST and group by KST date
  const byDate = {};
  let movedCount = 0;

  for (const record of allRecords) {
    if (!record.collected_at) continue;

    const origDate = record.collected_at.slice(0, 10);
    const kstTimestamp = toKST(record.collected_at);
    const kstDate = kstTimestamp.slice(0, 10);

    if (origDate !== kstDate) movedCount++;

    record.collected_at = kstTimestamp;

    if (!byDate[kstDate]) byDate[kstDate] = [];
    byDate[kstDate].push(record);
  }

  // Delete old files
  for (const file of files) {
    fs.unlinkSync(path.join(typeDir, file));
  }

  // Write new KST-dated files
  for (const [date, records] of Object.entries(byDate)) {
    const fp = path.join(typeDir, `${date}.jsonl`);
    const content = records.map(r => JSON.stringify(r)).join('\n') + '\n';
    fs.writeFileSync(fp, content);
  }

  return {
    files: files.length,
    newFiles: Object.keys(byDate).length,
    records: allRecords.length,
    moved: movedCount,
  };
}

async function migrate() {
  if (fs.existsSync(MARKER_FILE)) {
    console.log('[Migration] Already completed, skipping.');
    return;
  }

  if (!fs.existsSync(DATA_DIR)) {
    console.log('[Migration] Data directory not found, skipping.');
    return;
  }

  console.log('[Migration] Starting UTC → KST migration...');
  const result = { startedAt: new Date().toISOString(), types: {} };

  for (const type of TYPES) {
    const stats = migrateType(type);
    result.types[type] = stats;
    console.log(`[Migration] ${type}: ${stats.records} records, ${stats.moved} moved to different date`);
  }

  // Delete daily aggregates (batch will re-generate with KST data)
  const dailyDir = path.join(DATA_DIR, 'daily');
  const deletedFiles = deleteDirRecursive(dailyDir);
  result.dailyFilesDeleted = deletedFiles;
  console.log(`[Migration] Deleted ${deletedFiles} daily aggregate files`);

  result.completedAt = new Date().toISOString();
  fs.writeFileSync(MARKER_FILE, JSON.stringify(result, null, 2));
  console.log('[Migration] Completed successfully.');
}

function getStatus() {
  if (!fs.existsSync(MARKER_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(MARKER_FILE, 'utf-8'));
  } catch (_) {
    return null;
  }
}

module.exports = { migrate, getStatus, MARKER_FILE };
