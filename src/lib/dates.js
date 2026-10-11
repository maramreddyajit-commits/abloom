// Dates are stored as local-calendar YYYY-MM-DD keys. (toISOString() would be UTC, which rolls
// "today" over in the evening for anyone west of Greenwich.)
export const toKey = d =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const parseKey = k => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const todayKey = (now = new Date()) => toKey(now);

export const addDays = (key, n) => {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
};

export const daysBetween = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 864e5);

export const fmtClock = secs => {
  const s = Math.max(0, Math.round(secs));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r < 10 ? '0' : ''}${r}`;
};

export const fmtMinutes = secs => {
  const m = Math.round(secs / 60);
  if (m < 1) return 'under a minute';
  return m === 1 ? '1 minute' : `${m} minutes`;
};

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
export const fmtShortDate = ts => {
  const d = new Date(ts);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
};

export const timeBucket = ts => {
  const h = new Date(ts).getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 22) return 'evening';
  return 'night';
};

export const greeting = (now = new Date()) => {
  const h = now.getHours();
  if (h >= 5 && h < 12) return 'good morning';
  if (h >= 12 && h < 17) return 'good afternoon';
  if (h >= 17 && h < 22) return 'good evening';
  return 'hey, night owl';
};
