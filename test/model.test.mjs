import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createData, migrate, growth, weekDots, currentRun, longestRun, nextRung, parseBackup, makeBackup,
  therapistSummary, calendarCells, urgeShift, unlockedLessonCount, actionCounts,
} from '../src/lib/model.js';
import { toKey, addDays } from '../src/lib/dates.js';
import { looksLikeCrisis } from '../src/content/crisis.js';

const day = (key, h = 12) => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d, h).getTime(); };
const entry = (key, action = 'resist', extra = {}) => ({ id: Math.random().toString(), ts: day(key), date: key, compulsion: 'checking-locks', action, ...extra });
const NOW = new Date(2026, 9, 10, 15); // 10 Oct 2026, 3pm local
const TODAY = toKey(NOW);

test('missing days pauses growth but never shrinks the plant', () => {
  const d = createData(day(addDays(TODAY, -30)));
  d.plant.startedAt = day(addDays(TODAY, -30), 0);
  // 6 watered days spread out with gaps
  [-30, -28, -20, -19, -5, 0].forEach(o => d.log.push(entry(addDays(TODAY, o))));
  const g = growth(d);
  assert.equal(g.days, 6);
  assert.equal(g.stage, 2); // 5+ water days = sapling, regardless of gaps
});

test('multiple waterings on one day count once for growth', () => {
  const d = createData();
  d.plant.startedAt = 0;
  for (let i = 0; i < 10; i++) d.log.push(entry(TODAY));
  assert.equal(growth(d).days, 1);
});

test('slips are logged but do not water', () => {
  const d = createData();
  d.plant.startedAt = 0;
  d.log.push(entry(TODAY, 'slip'));
  assert.equal(growth(d).days, 0);
  assert.equal(actionCounts(d.log).slip, 1);
});

test('bloom at 14 water days', () => {
  const d = createData();
  d.plant.startedAt = 0;
  for (let i = 0; i < 14; i++) d.log.push(entry(addDays(TODAY, -i * 2)));
  const g = growth(d);
  assert.equal(g.stage, 4);
  assert.equal(g.bloomed, true);
});

test('only waterings after the current plant started count', () => {
  const d = createData();
  d.log.push(entry(addDays(TODAY, -3)));
  d.plant.startedAt = day(addDays(TODAY, -1));
  d.log.push(entry(TODAY));
  assert.equal(growth(d).days, 1);
});

test('runs and week dots', () => {
  const d = createData();
  [-6, -2, -1].forEach(o => d.log.push(entry(addDays(TODAY, o))));
  assert.equal(currentRun(d, NOW), 2); // yesterday counts when today isn't watered yet
  assert.equal(longestRun(d), 2);
  const dots = weekDots(d, NOW);
  assert.equal(dots.length, 7);
  assert.deepEqual(dots.map(x => x.watered), [true, false, false, false, true, true, false]);
  assert.equal(dots[6].isToday, true);
});

test('migrates v1 data', () => {
  const v1 = {
    active: ['checking-locks', 'c-1'], custom: [{ id: 'c-1', name: 'Tapping', cat: 'Custom' }],
    log: [{ date: addDays(TODAY, -1), compulsion: 'checking-locks', ts: day(addDays(TODAY, -1)) }],
    streak: 1, lastDate: addDays(TODAY, -1), best: 1, total: 1, stage: 0, forest: 0, trees: [],
    erp: [{ date: TODAY, trigger: 'checking-locks', fear: 'break in', preAnxiety: 7, duration: 300, anxietyCurve: [{ time: 0, val: 7 }, { time: 60, val: 8 }], postAnxiety: 4, fearedHappened: false, learned: 'ok', ts: day(TODAY) }],
  };
  const d = migrate(v1, { onboardedFlag: true });
  assert.equal(d.version, 2);
  assert.equal(d.onboarded, true);
  assert.deepEqual(d.compulsions.active, ['checking-locks', 'c-1']);
  assert.equal(d.log[0].action, 'resist');
  assert.equal(d.exposures[0].sudsBefore, 70);
  assert.equal(d.exposures[0].sudsPeak, 80);
  assert.equal(d.exposures[0].predictionCameTrue, 'no');
  assert.equal(d.settings.calmMode, false);
});

test('backup round trip and rejection', () => {
  const d = createData();
  d.onboarded = true;
  d.log.push(entry(TODAY));
  const back = parseBackup(makeBackup(d));
  assert.equal(back.log.length, 1);
  assert.throws(() => parseBackup('not json'));
  assert.throws(() => parseBackup('{"hello":1}'));
});

test('next ladder rung is the easiest one not yet mastered', () => {
  const ladder = [
    { id: 'a', text: 'hard', suds: 80, practiced: 0 },
    { id: 'b', text: 'easy', suds: 20, practiced: 3 },
    { id: 'c', text: 'medium', suds: 40, practiced: 1 },
  ];
  assert.equal(nextRung(ladder).id, 'c');
  assert.equal(nextRung([]), null);
});

test('calendar is aligned to weeks and ends on today', () => {
  const cells = calendarCells(createData(), 5, NOW);
  assert.equal(cells.length, 35);
  assert.equal(new Date(day(cells[0].key)).getDay(), 0);
  assert.equal(cells.filter(c => c.isToday).length, 1);
});

test('urge shift needs at least two rated urges', () => {
  assert.equal(urgeShift([entry(TODAY, 'resist', { urgeBefore: 8, urgeAfter: 3 })]), null);
  const s = urgeShift([entry(TODAY, 'resist', { urgeBefore: 8, urgeAfter: 3 }), entry(TODAY, 'delay', { urgeBefore: 6, urgeAfter: 5 })]);
  assert.equal(s.before, 7);
  assert.equal(s.after, 4);
});

test('lessons unlock one per day', () => {
  const d = createData(day(addDays(TODAY, -2), 23));
  assert.equal(unlockedLessonCount(d, 7, NOW), 3);
  assert.equal(unlockedLessonCount(createData(day(TODAY)), 7, NOW), 1);
});

test('therapist summary includes key sections', () => {
  const d = createData();
  d.log.push(entry(TODAY, 'resist', { urgeBefore: 8, urgeAfter: 3 }), entry(TODAY, 'delay', { urgeBefore: 6, urgeAfter: 4 }));
  const txt = therapistSummary(d, { now: NOW });
  assert.match(txt, /Days practised: 1 of 14/);
  assert.match(txt, /Urges resisted: 1/);
  assert.match(txt, /Not a clinical assessment/);
});

test('crisis detection catches self-harm intent but not common ocd harm themes', () => {
  ['i want to kill myself', 'thinking about suicide', 'i dont want to be alive anymore', 'i keep hurting myself', 'everyone would be better off dead without me'].forEach(t =>
    assert.equal(looksLikeCrisis(t), true, t));
  ['i had a thought about stabbing my partner and i hate it', 'what if i hit someone with my car', 'i need to end my shift early', 'checking the stove'].forEach(t =>
    assert.equal(looksLikeCrisis(t), false, t));
});
