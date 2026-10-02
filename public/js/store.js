// fitin data store: everything lives in this browser's localStorage.

const KEY = 'fitin:v1';

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

// ---------- dates (always local time, never UTC) ----------
export const ymd = (d = new Date()) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
export const parseYmd = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (s, n) => {
  const d = parseYmd(s);
  d.setDate(d.getDate() + n);
  return ymd(d);
};
export const weekStart = (s) => {
  // Monday-based week
  const d = parseYmd(s);
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow);
  return ymd(d);
};
export const fmtDate = (s, opts = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) =>
  parseYmd(s).toLocaleDateString('en-GB', opts);

// ---------- defaults ----------
export const defaultState = () => ({
  version: 1,
  onboarded: false,
  profile: {
    name: '',
    sex: 'male',
    age: 21,
    heightCm: 172,
    weightKg: 70,
    bodyFat: '',
    activity: 'moderate',
    goals: ['armwrestling', 'calisthenics', 'fatloss', 'strength'],
    experience: 'intermediate',
    equipment: ['none', 'bar', 'dip', 'db', 'band', 'handle'],
    daysPerWeek: 4,
    defaultMinutes: 45,
    // profile page
    handle: '',
    bio: '',
    location: '',
    photo: '', // small JPEG data URL
    joinedAt: '', // YYYY-MM-DD
    // goal weight
    goalWeight: '',
    goalStartWeight: '',
    goalSetAt: '',
    // schedule
    trainingDays: [1, 2, 4, 5], // 0 = Sunday ... 6 = Saturday
    workoutTime: '18:00',
  },
  targets: { override: false, kcal: 2200, protein: 150, carbs: 250, fat: 65 },
  settings: { accessCode: '', engine: 'rules' },
  days: {}, // 'YYYY-MM-DD' -> { meals: [], plan: null, workout: null }
  body: [], // [{ date, weight, bodyFat }]
  foods: [], // custom + scanned foods saved by the user
  recentFoods: [], // food ids / snapshots
  badgeLog: {}, // badge id -> date first unlocked (kept once earned)
  seenBadges: [], // badge ids already celebrated
});

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const base = defaultState();
    return {
      ...base,
      ...parsed,
      profile: { ...base.profile, ...(parsed.profile || {}) },
      targets: { ...base.targets, ...(parsed.targets || {}) },
      settings: { ...base.settings, ...(parsed.settings || {}) },
    };
  } catch {
    return defaultState();
  }
}

let saveTimer = null;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked: keep working in memory */
    }
  }, 120);
}

export const getState = () => state;

/** Mutate state inside fn, then save and notify. */
export function update(fn, { silent = false } = {}) {
  fn(state);
  persist();
  if (!silent) listeners.forEach((l) => l(state));
}

export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export function replaceState(next) {
  const base = defaultState();
  state = {
    ...base,
    ...next,
    profile: { ...base.profile, ...(next.profile || {}) },
    targets: { ...base.targets, ...(next.targets || {}) },
    settings: { ...base.settings, ...(next.settings || {}) },
  };
  persist();
  listeners.forEach((l) => l(state));
}

export function resetState() {
  state = defaultState();
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  listeners.forEach((l) => l(state));
}

export function day(date, create = false) {
  let d = state.days[date];
  if (!d && create) {
    d = state.days[date] = { meals: [], plan: null, workout: null };
  }
  return d || { meals: [], plan: null, workout: null };
}

// ---------- derived values ----------
export function dayTotals(date) {
  const d = day(date);
  const t = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  for (const m of d.meals || []) {
    t.kcal += m.kcal || 0;
    t.protein += m.protein || 0;
    t.carbs += m.carbs || 0;
    t.fat += m.fat || 0;
  }
  return t;
}

export function mealTotals(date, meal) {
  const t = { kcal: 0, protein: 0, carbs: 0, fat: 0, count: 0 };
  for (const m of day(date).meals || []) {
    if (m.meal !== meal) continue;
    t.kcal += m.kcal || 0;
    t.protein += m.protein || 0;
    t.carbs += m.carbs || 0;
    t.fat += m.fat || 0;
    t.count++;
  }
  return t;
}

export function workoutStats(w) {
  let sets = 0, volume = 0, total = 0;
  for (const ex of w?.exercises || []) {
    for (const s of ex.sets || []) {
      total++;
      if (!s.done) continue;
      sets++;
      const kg = parseFloat(s.kg) || 0;
      const reps = parseFloat(s.reps) || 0;
      if (ex.unit !== 'sec') volume += kg * reps;
    }
  }
  return { sets, total, volume: Math.round(volume) };
}

export const isWorkoutDone = (w) => Boolean(w && (w.finishedAt || (workoutStats(w).total > 0 && workoutStats(w).sets === workoutStats(w).total)));

/** All logged workouts, newest first: [{date, workout}] */
export function workoutHistory() {
  return Object.entries(state.days)
    .filter(([, d]) => d.workout && workoutStats(d.workout).sets > 0)
    .map(([date, d]) => ({ date, workout: d.workout }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function latestBody(beforeOrOn) {
  const list = [...state.body].filter((b) => !beforeOrOn || b.date <= beforeOrOn).sort((a, b) => (a.date < b.date ? -1 : 1));
  return list;
}

export function exportJson() {
  return JSON.stringify(state, null, 2);
}
