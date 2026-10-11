// Pure data model: shape, migrations and derived stats. No React Native imports here,
// so everything in this file is covered by `npm test`.
import { STAGE_DAYS } from '../content/copy.js';
import { PRESETS, CUSTOM_CAT, GENERIC } from '../content/compulsions.js';
import { toKey, todayKey, addDays, parseKey, daysBetween, timeBucket } from './dates.js';

export const DATA_VERSION = 2;
export const WATERING_ACTIONS = ['resist', 'delay', 'shrink', 'exposure'];

export const uid = (prefix = 'id') => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const createData = (now = Date.now()) => ({
  version: DATA_VERSION,
  createdAt: now,
  onboarded: false,
  plant: { name: 'sprout', startedAt: now },
  forest: [],
  compulsions: { active: [], custom: [] },
  log: [],
  ladder: [],
  exposures: [],
  settings: {
    calmMode: false,
    analytics: false,
    aiConsent: false,
    reminder: { enabled: false, hour: 20, minute: 0 },
    reminderAsked: false,
  },
  lessons: { read: [] },
});

// ── Migration ────────────────────────────────────────────────────────────────
// v1 (the original single-file app) stored: { active, custom, log:[{date,compulsion,ts}], streak,
// lastDate, best, total, stage, forest, trees:[{date,streak}], erp:[...] } plus a separate
// 'abloom-onboarded' flag.
export function migrate(raw, { onboardedFlag = false, now = Date.now() } = {}) {
  if (!raw || typeof raw !== 'object') return createData(now);
  if (raw.version === DATA_VERSION) return fillDefaults(raw, now);

  const base = createData(now);
  const log = Array.isArray(raw.log) ? raw.log : [];
  const trees = Array.isArray(raw.trees) ? raw.trees : [];
  const lastTree = trees.length ? trees[trees.length - 1] : null;
  const plantStart = lastTree ? parseKey(lastTree.date).getTime() + 864e5 - 1 : (log[0]?.ts ?? now);

  return fillDefaults({
    ...base,
    createdAt: log[0]?.ts ?? now,
    onboarded: onboardedFlag || log.length > 0 || (raw.active || []).length > 0,
    plant: { name: 'sprout', startedAt: Math.min(plantStart, now) },
    forest: trees.map((t, i) => ({ id: `tree-${i}`, name: 'sprout', days: t.streak || STAGE_DAYS[4], completedAt: parseKey(t.date).getTime() })),
    compulsions: {
      active: Array.isArray(raw.active) ? raw.active : [],
      custom: (raw.custom || []).map(c => ({ ...c, cat: CUSTOM_CAT })),
    },
    log: log.map((l, i) => ({
      id: `log-v1-${i}`,
      ts: l.ts || parseKey(l.date).getTime(),
      date: l.date,
      compulsion: l.compulsion,
      action: 'resist',
    })),
    exposures: (raw.erp || []).map((e, i) => ({
      id: `exp-v1-${i}`,
      ts: e.ts,
      date: e.date,
      rungId: null,
      label: e.trigger,
      compulsion: e.trigger,
      prediction: e.fear || '',
      sudsBefore: e.preAnxiety != null ? e.preAnxiety * 10 : null,
      sudsPeak: Math.max(...(e.anxietyCurve || []).map(r => r.val * 10), (e.preAnxiety || 0) * 10),
      sudsAfter: e.postAnxiety != null ? e.postAnxiety * 10 : null,
      seconds: e.duration || 0,
      ratings: (e.anxietyCurve || []).map(r => ({ t: r.time, v: r.val * 10 })),
      predictionCameTrue: e.fearedHappened === true ? 'yes' : e.fearedHappened === false ? 'no' : 'unsure',
      learned: e.learned || '',
    })),
  }, now);
}

function fillDefaults(d, now) {
  const base = createData(now);
  return {
    ...base,
    ...d,
    plant: { ...base.plant, ...(d.plant || {}) },
    compulsions: { ...base.compulsions, ...(d.compulsions || {}) },
    settings: { ...base.settings, ...(d.settings || {}), reminder: { ...base.settings.reminder, ...(d.settings?.reminder || {}) } },
    lessons: { ...base.lessons, ...(d.lessons || {}) },
    version: DATA_VERSION,
  };
}

// Validates a backup file before it replaces the user's data.
export function parseBackup(text) {
  let obj;
  try { obj = JSON.parse(text); } catch { throw new Error('that doesn’t look like an abloom backup.'); }
  const payload = obj && obj.app === 'abloom' && obj.data ? obj.data : obj;
  if (!payload || typeof payload !== 'object' || !Array.isArray(payload.log)) {
    throw new Error('that doesn’t look like an abloom backup.');
  }
  return migrate(payload, { onboardedFlag: true });
}

export const makeBackup = (data, now = Date.now()) =>
  JSON.stringify({ app: 'abloom', exportedAt: new Date(now).toISOString(), data }, null, 2);

// ── Compulsions ──────────────────────────────────────────────────────────────
export const allCompulsions = data => [...(data.compulsions.custom || []), ...PRESETS];
export const activeCompulsions = data => {
  const all = allCompulsions(data);
  return data.compulsions.active.map(id => all.find(c => c.id === id)).filter(Boolean);
};
export const compulsionName = (data, id) => {
  if (!id) return 'something else';
  if (id === GENERIC.id) return GENERIC.name;
  return allCompulsions(data).find(c => c.id === id)?.name || id;
};

// ── Plant growth ─────────────────────────────────────────────────────────────
export const isWatering = entry => WATERING_ACTIONS.includes(entry.action);

export const wateredDates = (log, sinceTs = 0) =>
  new Set(log.filter(l => isWatering(l) && l.ts >= sinceTs).map(l => l.date));

export const plantWaterDays = data => wateredDates(data.log, data.plant.startedAt).size;

export const stageFor = days => {
  for (let i = STAGE_DAYS.length - 1; i >= 0; i--) if (days >= STAGE_DAYS[i]) return i;
  return 0;
};

export function growth(data) {
  const days = plantWaterDays(data);
  const stage = stageFor(days);
  const bloomed = stage >= STAGE_DAYS.length - 1;
  if (bloomed) return { days, stage, bloomed, pct: 1, daysToNext: 0 };
  const from = STAGE_DAYS[stage];
  const to = STAGE_DAYS[stage + 1];
  return { days, stage, bloomed, pct: (days - from) / (to - from), daysToNext: to - days };
}

export const wateredToday = (data, now = new Date()) => data.log.some(l => isWatering(l) && l.date === todayKey(now));
export const countToday = (data, now = new Date()) => data.log.filter(l => isWatering(l) && l.date === todayKey(now)).length;

// The last seven days, oldest first, for the gentle week dots.
export function weekDots(data, now = new Date()) {
  const dates = wateredDates(data.log);
  const today = todayKey(now);
  return Array.from({ length: 7 }, (_, i) => {
    const key = addDays(today, i - 6);
    return { key, watered: dates.has(key), isToday: key === today, dow: parseKey(key).getDay() };
  });
}

// Consecutive watered days ending today (or yesterday, so the morning doesn't read as "0").
export function currentRun(data, now = new Date()) {
  const dates = wateredDates(data.log);
  let key = todayKey(now);
  if (!dates.has(key)) key = addDays(key, -1);
  let run = 0;
  while (dates.has(key)) { run++; key = addDays(key, -1); }
  return run;
}

export function longestRun(data) {
  const keys = [...wateredDates(data.log)].sort();
  let best = 0, run = 0, prev = null;
  for (const k of keys) {
    run = prev && daysBetween(prev, k) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = k;
  }
  return best;
}

// ── Insights ─────────────────────────────────────────────────────────────────
export function actionCounts(log) {
  const out = { resist: 0, delay: 0, shrink: 0, exposure: 0, slip: 0 };
  log.forEach(l => { if (out[l.action] != null) out[l.action]++; });
  return out;
}

export function topCompulsions(log, n = 5) {
  const ct = {};
  log.filter(l => l.action !== 'exposure').forEach(l => { ct[l.compulsion] = (ct[l.compulsion] || 0) + 1; });
  const total = Object.values(ct).reduce((a, b) => a + b, 0);
  return Object.entries(ct).sort((a, b) => b[1] - a[1]).slice(0, n).map(([id, count]) => ({ id, count, share: total ? count / total : 0 }));
}

export function timeOfDay(log) {
  const out = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  log.filter(l => l.action !== 'exposure').forEach(l => { out[timeBucket(l.ts)]++; });
  return out;
}

// How strong urges were before vs after riding them out (urge flow entries only).
export function urgeShift(log) {
  const rows = log.filter(l => typeof l.urgeBefore === 'number' && typeof l.urgeAfter === 'number');
  if (rows.length < 2) return null;
  const avg = k => rows.reduce((a, r) => a + r[k], 0) / rows.length;
  return { count: rows.length, before: avg('urgeBefore'), after: avg('urgeAfter') };
}

export function calendarCells(data, weeks = 5, now = new Date()) {
  const counts = {};
  data.log.filter(isWatering).forEach(l => { counts[l.date] = (counts[l.date] || 0) + 1; });
  const today = todayKey(now);
  const todayDow = parseKey(today).getDay();
  const start = addDays(today, -(weeks - 1) * 7 - todayDow);
  const cells = [];
  for (let i = 0; i < weeks * 7; i++) {
    const key = addDays(start, i);
    cells.push({ key, day: parseKey(key).getDate(), count: counts[key] || 0, future: key > today, isToday: key === today });
  }
  return cells;
}

// ── Exposure ladder ──────────────────────────────────────────────────────────
export const MASTERED_AFTER = 3;

export const sortedLadder = ladder => [...ladder].sort((a, b) => a.suds - b.suds);

export function nextRung(ladder) {
  return sortedLadder(ladder).find(r => !r.mastered && (r.practiced || 0) < MASTERED_AFTER) || null;
}

// ── Lessons ──────────────────────────────────────────────────────────────────
// One lesson unlocks per calendar day since the user started.
export const unlockedLessonCount = (data, total, now = new Date()) =>
  Math.min(total, Math.max(1, daysBetween(toKey(new Date(data.createdAt)), todayKey(now)) + 1));

// ── Therapist summary ────────────────────────────────────────────────────────
export function therapistSummary(data, { days = 14, now = new Date() } = {}) {
  const since = addDays(todayKey(now), -(days - 1));
  const log = data.log.filter(l => l.date >= since);
  const exps = data.exposures.filter(e => e.date >= since);
  const counts = actionCounts(log);
  const shift = urgeShift(log);
  const lines = [];
  lines.push(`Abloom summary — last ${days} days (${since} to ${todayKey(now)})`);
  lines.push('Self-reported practice log. Not a clinical assessment.');
  lines.push('');
  lines.push(`Days practised: ${wateredDates(log).size} of ${days}`);
  lines.push(`Urges resisted: ${counts.resist} · delayed: ${counts.delay} · ritual shrunk: ${counts.shrink} · slips noted: ${counts.slip}`);
  if (shift) lines.push(`Urge strength (0–10), average across ${shift.count} urges: ${shift.before.toFixed(1)} at start → ${shift.after.toFixed(1)} at end`);
  const top = topCompulsions(log, 5);
  if (top.length) {
    lines.push('');
    lines.push('Most-logged compulsions:');
    top.forEach(t => lines.push(`  • ${compulsionName(data, t.id)}: ${t.count}`));
  }
  const tod = timeOfDay(log);
  lines.push('');
  lines.push(`Time of day: morning ${tod.morning}, afternoon ${tod.afternoon}, evening ${tod.evening}, night ${tod.night}`);
  lines.push('');
  lines.push(`Exposures completed: ${exps.length}`);
  exps.forEach(e => {
    const mins = Math.round((e.seconds || 0) / 60);
    lines.push(`  • ${e.date}: ${e.label} — SUDS ${e.sudsBefore ?? '?'} → peak ${e.sudsPeak ?? '?'} → ${e.sudsAfter ?? '?'}, ${mins} min`);
    if (e.prediction) lines.push(`      predicted: ${e.prediction} (happened: ${e.predictionCameTrue})`);
    if (e.learned) lines.push(`      learned: ${e.learned}`);
  });
  if (data.ladder.length) {
    lines.push('');
    lines.push('Exposure ladder (SUDS 0–100):');
    sortedLadder(data.ladder).forEach(r => lines.push(`  • ${r.suds} — ${r.text}${r.mastered ? ' (done)' : r.practiced ? ` (practised ${r.practiced}x)` : ''}`));
  }
  return lines.join('\n');
}
