import {
  getState, update, subscribe, ymd, addDays, parseYmd, weekStart, fmtDate, day, dayTotals, mealTotals,
  workoutStats, isWorkoutDone, workoutHistory, uid, exportJson, replaceState, resetState,
} from './store.js';
import { activeTargets, computeTargets } from './nutrition.js';
import { BUILTIN_FOODS, scaleFood, searchLocal, lookupBarcode, searchOff } from './foods.js';
import { EQUIPMENT, alternatives, searchExercises, findExercise } from './exercises.js';
import { FOCUS, buildPlan, nextFocus, rotation, focusTitle, suggestion } from './planner.js';
import { icon, esc, fmt, ring, sparkline, lineChart, bindLineCharts, toast } from './ui.js';
import { startScanner, scanImage } from './scanner.js';
import { askAi } from './ai.js';

const $ = (s, r = document) => r.querySelector(s);
const S = () => getState();

const MEALS = [
  { id: 'breakfast', label: 'Breakfast', icon: 'coffee' },
  { id: 'lunch', label: 'Lunch', icon: 'bowl' },
  { id: 'snack', label: 'Snack', icon: 'apple' },
  { id: 'dinner', label: 'Dinner', icon: 'moon' },
];
const GOALS = [
  { id: 'armwrestling', label: 'Armwrestling' },
  { id: 'calisthenics', label: 'Calisthenics' },
  { id: 'fatloss', label: 'Lose fat' },
  { id: 'strength', label: 'Get stronger' },
  { id: 'muscle', label: 'Build muscle' },
];
const NAV = [
  { id: 'dashboard', label: 'Dashboard', short: 'Home', icon: 'home' },
  { id: 'workouts', label: 'Workouts', short: 'Workouts', icon: 'dumbbell' },
  { id: 'nutrition', label: 'Nutrition', short: 'Nutrition', icon: 'apple' },
  { id: 'progress', label: 'Progress', short: 'Progress', icon: 'chart' },
  { id: 'settings', label: 'Settings', short: 'Settings', icon: 'sliders' },
];

const ui = {
  date: ymd(),
  progress: { metric: 'weight', range: 30 },
  planner: { minutes: null, focus: 'auto', engine: null, note: '', shuffle: 0, busy: false, draft: null, error: '' },
  sheet: null,
  scanStop: null,
  timer: null,
};

const route = () => (location.hash.replace(/^#\/?/, '') || 'dashboard').split('?')[0];
const go = (r) => { if (route() === r) renderMain(); else location.hash = '#/' + r; window.scrollTo(0, 0); };
const topNum = (reps) => { const m = String(reps).match(/\d+/g); return m ? Number(m[m.length - 1]) : ''; };
const defaultMeal = () => { const h = new Date().getHours(); return h < 11 ? 'breakfast' : h < 16 ? 'lunch' : h < 19 ? 'snack' : 'dinner'; };
const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening'; };
const plural = (n, w) => `${fmt(n)} ${w}${Number(n) === 1 ? '' : 's'}`;
const shortDate = (d) => fmtDate(d, { day: 'numeric', month: 'short' });
const targetText = (ex) => {
  if (ex.unit === 'min') return `${ex.reps} min`;
  const u = ex.unit === 'sec' ? ' s' : '';
  return `${ex.sets} × ${ex.reps}${u}${ex.side ? ' /side' : ''}`;
};

// ============ shell ============
function shell() {
  document.getElementById('app').innerHTML = `
  <aside class="side">
    <div class="brand">${icon('pulse', 24)}<span>fitin</span></div>
    <nav class="side-nav">${NAV.map((n) => `<a href="#/${n.id}" data-nav="${n.id}">${icon(n.icon, 19)}<span>${n.label}</span></a>`).join('')}</nav>
    <div class="side-quote">DISCIPLINE<br>BUILDS<br>FREEDOM.<i></i></div>
  </aside>
  <main class="main">
    <div class="mbar"><div class="brand">${icon('pulse', 22)}<span>fitin</span></div><button class="avatar" data-act="go" data-to="settings" aria-label="Settings" id="m-avatar"></button></div>
    <div id="view"></div>
  </main>
  <nav class="bnav">
    ${NAV.slice(0, 2).map((n) => `<a href="#/${n.id}" data-nav="${n.id}">${icon(n.icon, 21)}<span>${n.short}</span></a>`).join('')}
    <button class="bnav-log" data-act="food" aria-label="Log food">${icon('plus', 22)}<span>Log</span></button>
    ${NAV.slice(2, 4).map((n) => `<a href="#/${n.id}" data-nav="${n.id}">${icon(n.icon, 21)}<span>${n.short}</span></a>`).join('')}
  </nav>
  <div id="sheet-root"></div>
  <div id="rest"></div>`;
}

function renderMain() {
  const s = S();
  const r = route();
  document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('on', a.dataset.nav === r || (r === 'session' && a.dataset.nav === 'workouts')));
  $('#m-avatar').textContent = (s.profile.name || 'F')[0].toUpperCase();
  document.body.classList.toggle('onboarding', !s.onboarded);
  const view = $('#view');
  if (!s.onboarded) {
    view.innerHTML = onboardingView();
  } else {
    const views = { dashboard: dashboardView, workouts: workoutsView, nutrition: nutritionView, progress: progressView, settings: settingsView, session: sessionView };
    view.innerHTML = (views[r] || dashboardView)();
  }
  bindLineCharts(view);
}

// ============ header ============
function dateSwitcher() {
  const isToday = ui.date === ymd();
  return `<div class="datesw">
    <button data-act="date" data-d="-1" aria-label="Previous day">${icon('chevL', 18)}</button>
    <button class="datesw-label" data-act="date-today" title="Jump to today">${isToday ? '' : '<b>•</b> '}${fmtDate(ui.date)}</button>
    <button data-act="date" data-d="1" aria-label="Next day">${icon('chevR', 18)}</button>
  </div>`;
}

function header(title, sub = '', withDate = true) {
  const p = S().profile;
  return `<header class="head">
    <div class="head-text">${title}${sub ? `<p class="sub">${sub}</p>` : ''}</div>
    <div class="head-tools">${withDate ? dateSwitcher() : ''}<button class="avatar desk" data-act="go" data-to="settings" aria-label="Settings">${esc((p.name || 'F')[0].toUpperCase())}</button></div>
  </header>`;
}

// ============ dashboard ============
function dashboardView() {
  const p = S().profile;
  const title = `<p class="hello">${greeting()},</p><h1>${esc(p.name || 'Athlete')} <span class="wave" aria-hidden="true">👋</span></h1>`;
  return `${header(title, 'Keep showing up. Consistency wins.')}
    ${statCards()}
    <div class="grid-a">${planCard(ui.date, false)}${nutritionCard()}</div>
    <div class="grid-b">${weekCard()}${progressCard()}</div>`;
}

function bodySeries(field, upTo = ui.date) {
  return [...S().body]
    .filter((b) => b.date <= upTo && b[field] !== '' && b[field] != null && Number.isFinite(Number(b[field])))
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((b) => ({ date: b.date, v: Number(b[field]) }));
}

function deltaText(series, unit) {
  if (series.length < 2) return '<span class="muted">Log again to see change</span>';
  const last = series[series.length - 1];
  const cutoff = addDays(last.date, -14);
  const ref = [...series].reverse().find((x) => x.date <= cutoff) || series[0];
  const d = last.v - ref.v;
  const days = Math.round((parseYmd(last.date) - parseYmd(ref.date)) / 864e5);
  const span = days >= 14 ? `${Math.round(days / 7)} wks` : `${days} d`;
  const goodDown = S().profile.goals.includes('fatloss');
  const good = d === 0 ? '' : (d < 0) === goodDown ? 'good' : '';
  return `<span class="${good}">${d > 0 ? '+' : ''}${fmt(d, 1)}${unit} (${span})</span>`;
}

function weekWorkouts(date) {
  const start = weekStart(date);
  let done = 0;
  for (let i = 0; i < 7; i++) if (isWorkoutDone(day(addDays(start, i)).workout)) done++;
  return done;
}

function statCards() {
  const s = S();
  const t = activeTargets(s);
  const tot = dayTotals(ui.date);
  const w = bodySeries('weight');
  const bf = bodySeries('bodyFat');
  const done = weekWorkouts(ui.date);
  const target = Number(s.profile.daysPerWeek) || 4;
  const lastW = w.length ? w[w.length - 1].v : Number(s.profile.weightKg) || 0;
  const lastBf = bf.length ? bf[bf.length - 1].v : null;
  return `<section class="stats">
    <button class="stat card" data-act="body">
      <div class="stat-h"><span class="badge">${icon('scale', 16)}</span>Weight</div>
      <div class="stat-b"><div><div class="big">${fmt(lastW, 1)} <small>kg</small></div><div class="delta">${deltaText(w, ' kg')}</div></div>${sparkline(w.slice(-12).map((x) => x.v))}</div>
    </button>
    <button class="stat card" data-act="body">
      <div class="stat-h"><span class="badge">${icon('body', 16)}</span>Body Fat</div>
      <div class="stat-b"><div><div class="big">${lastBf != null ? fmt(lastBf, 1) : '–'}<small>%</small></div><div class="delta">${lastBf != null ? deltaText(bf, '%') : '<span class="muted">Tap to log</span>'}</div></div>${sparkline(bf.slice(-12).map((x) => x.v))}</div>
    </button>
    <a class="stat card" href="#/nutrition">
      <div class="stat-h"><span class="badge">${icon('flame', 16)}</span>Calories</div>
      <div class="stat-b"><div><div class="big">${fmt(tot.kcal)}</div><div class="delta muted">/ ${fmt(t.kcal)}</div></div>${ring(tot.kcal, t.kcal, 'var(--accent)', 54, 6, 'Calories')}</div>
    </a>
    <a class="stat card" href="#/nutrition">
      <div class="stat-h"><span class="badge">${icon('egg', 16)}</span>Protein</div>
      <div class="stat-b"><div><div class="big">${fmt(tot.protein)}</div><div class="delta muted">/ ${fmt(t.protein)} g</div></div>${ring(tot.protein, t.protein, 'var(--protein)', 54, 6, 'Protein')}</div>
    </a>
    <a class="stat card" href="#/workouts">
      <div class="stat-h"><span class="badge">${icon('dumbbell', 16)}</span>Workouts</div>
      <div class="stat-b"><div><div class="big">${done}<small> / ${target}</small></div><div class="delta muted">this week</div></div>${ring(done, target, 'var(--violet)', 54, 6, 'Workouts this week')}</div>
    </a>
  </section>`;
}

// ---------- plan card ----------
function exDone(workout, planEx) {
  const wex = workout?.exercises.find((e) => e.planExId === planEx.id);
  return Boolean(wex && wex.sets.length && wex.sets.every((x) => x.done));
}

function planHero(plan, extra = '') {
  return `<div class="hero">
    <div class="hero-ic">${icon('dumbbell', 28)}</div>
    <div class="hero-t"><span class="eyebrow">Workout${plan.source === 'ai' ? ' · AI coach' : ''}</span><h3>${esc(plan.title)}</h3><p>${(plan.tags || []).map(esc).join(' • ')}${plan.estMinutes ? ` · ~${plan.estMinutes} min` : ''}</p></div>
    ${extra}
  </div>`;
}

function workoutButton(date) {
  const d = day(date);
  const w = d.workout;
  if (!w) return `<button class="btn primary wide" data-act="start" >Start Workout ${icon('arrowR', 18)}</button>`;
  const st = workoutStats(w);
  if (w.finishedAt) return `<button class="btn ghost wide" data-act="go" data-to="session">${icon('check', 18)} Done · ${plural(st.sets, 'set')}${st.volume ? ` · ${fmt(st.volume)} kg` : ''}</button>`;
  return `<button class="btn primary wide" data-act="go" data-to="session">Continue Workout · ${st.sets}/${st.total} ${icon('arrowR', 18)}</button>`;
}

function planCard(date, detail) {
  const d = day(date);
  const plan = d.plan;
  if (!plan) {
    const p = S().profile;
    const nf = focusTitle(nextFocus(p, date), p);
    const w = d.workout;
    return `<section class="card plan">
      <div class="card-h"><h2>${detail ? 'Plan for this day' : "Today's Plan"}</h2>${detail ? '' : '<a class="link" href="#/workouts">Open planner</a>'}</div>
      <div class="hero empty"><div class="hero-ic">${icon('dumbbell', 28)}</div><div class="hero-t"><span class="eyebrow">Up next in your split</span><h3>${esc(nf)}</h3><p>Pick your time and fitin builds the session.</p></div></div>
      <div class="quick-min">${[20, 30, 45, 60, 75].map((m) => `<button class="chip" data-act="quick-plan" data-m="${m}">${m} min</button>`).join('')}</div>
      ${w ? workoutButton(date) : `<button class="btn ghost wide" data-act="start">Start an empty workout</button>`}
    </section>`;
  }
  const w = d.workout;
  const started = Boolean(w);
  const list = plan.exercises.map((ex) => {
    const done = exDone(w, ex);
    return `<li class="${done ? 'done' : ''}">
      <span class="tick">${done ? icon('check', 14) : ''}</span>
      <div class="ex-n"><span>${esc(ex.name)}</span>${detail && ex.notes ? `<small>${esc(ex.notes)}</small>` : ''}</div>
      <span class="ex-t">${esc(targetText(ex))}</span>
      ${detail && !started ? `<button class="icon-btn" data-act="plan-remove" data-id="${ex.id}" aria-label="Remove">${icon('x', 16)}</button>` : ''}
    </li>`;
  }).join('');
  const warm = detail && plan.warmup?.length
    ? `<details class="warm"><summary>Warm-up · ${plan.warmup.length} moves</summary><ul>${plan.warmup.map((x) => `<li><span>${esc(x.name)}</span><span class="ex-t">${esc(x.dose)}</span></li>`).join('')}</ul></details>`
    : '';
  return `<section class="card plan">
    <div class="card-h"><h2>${detail ? 'Plan for this day' : "Today's Plan"}</h2>${detail ? (started ? '' : `<button class="link" data-act="plan-clear">Clear</button>`) : '<a class="link" href="#/workouts">View plan</a>'}</div>
    ${planHero(plan)}
    ${detail && plan.coachNote ? `<p class="coach">${icon('info', 16)}<span>${esc(plan.coachNote)}</span></p>` : ''}
    ${warm}
    <ul class="exlist">${list}</ul>
    ${workoutButton(date)}
  </section>`;
}

// ---------- nutrition card ----------
function macroBars(tot, t) {
  const row = (label, v, max, color) => `<div class="mbar-row">
    <div class="mbar-top"><span>${label}</span><span class="muted">${fmt(v)} / ${fmt(max)} g</span></div>
    <div class="track"><i style="width:${Math.min(100, max ? (v / max) * 100 : 0)}%;background:${color}"></i></div></div>`;
  return `<div class="macros">${row('Protein', tot.protein, t.protein, 'var(--protein)')}${row('Carbs', tot.carbs, t.carbs, 'var(--carbs)')}${row('Fats', tot.fat, t.fat, 'var(--fat)')}</div>`;
}

function bigRing(tot, t) {
  return `<div class="bigring">${ring(tot.kcal, t.kcal, 'var(--accent)', 150, 11, 'Calories today')}<div class="bigring-t"><b>${fmt(tot.kcal)}</b><span>/ ${fmt(t.kcal)} kcal</span></div></div>`;
}

function nutritionCard() {
  const s = S();
  const t = activeTargets(s);
  const tot = dayTotals(ui.date);
  const tiles = MEALS.map((m) => {
    const mt = mealTotals(ui.date, m.id);
    return `<button class="tile t-${m.id}" data-act="food" data-meal="${m.id}">
      <div class="tile-img">${icon(m.icon, 30)}${mt.count ? `<em>${mt.count}</em>` : ''}</div>
      <b>${m.label}</b><span>${mt.count ? `${fmt(mt.kcal)} kcal` : 'Add food'}</span></button>`;
  }).join('');
  return `<section class="card nutri">
    <div class="card-h"><div><h2>Nutrition</h2><p class="muted small">Log your meals for the day</p></div><button class="icon-btn solid" data-act="food" aria-label="Add food">${icon('plus', 20)}</button></div>
    <div class="nutri-top">${bigRing(tot, t)}<div class="panel">${macroBars(tot, t)}</div></div>
    <div class="tiles">${tiles}</div>
    <h4 class="label">Quick Log</h4>
    <div class="quick">
      ${MEALS.map((m) => `<button class="chip" data-act="food" data-meal="${m.id}">${icon(m.icon, 16)}${m.label}</button>`).join('')}
      <button class="chip" data-act="food" data-tab="scan">${icon('barcode', 16)}Scan</button>
      <button class="chip" data-act="food" data-tab="ai">${icon('sparkles', 16)}Describe</button>
    </div>
  </section>`;
}

// ---------- week card ----------
function weekCard() {
  const s = S();
  const start = weekStart(ui.date);
  const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const days = names.map((n, i) => {
    const date = addDays(start, i);
    const w = day(date).workout;
    const st = workoutStats(w);
    return { n, date, sets: st.sets, vol: st.volume, kcal: dayTotals(date).kcal, meals: day(date).meals.length };
  });
  const max = Math.max(1, ...days.map((d) => d.sets));
  const vol = days.reduce((a, d) => a + d.vol, 0);
  const logged = days.filter((d) => d.meals);
  const avg = logged.length ? logged.reduce((a, d) => a + d.kcal, 0) / logged.length : 0;
  const bars = days.map((d) => `<button class="wbar ${d.date === ymd() ? 'today' : ''} ${d.date === ui.date ? 'sel' : ''}" data-act="pick-date" data-date="${d.date}" data-tip="${d.n}: ${d.sets ? `${plural(d.sets, 'set')}${d.vol ? `, ${fmt(d.vol)} kg` : ''}` : 'rest'}">
      <div class="wbar-track"><i style="height:${d.sets ? Math.max(10, (d.sets / max) * 100) : 0}%"></i></div><span>${d.n}</span></button>`).join('');
  return `<section class="card week">
    <div class="card-h"><h2>This Week</h2><a class="link" href="#/progress">View details ${icon('arrowR', 14)}</a></div>
    <div class="week-in">
      <div class="wbars">${bars}</div>
      <div class="wstats">
        <div><b>${weekWorkouts(ui.date)}<small>/${s.profile.daysPerWeek}</small></b><span>Workouts</span></div>
        <div><b>${fmt(vol)}</b><span>Total volume (kg)</span></div>
        <div><b>${fmt(avg)}</b><span>Avg calories/day</span></div>
      </div>
    </div>
  </section>`;
}

// ---------- progress ----------
function progressSeries(metric, range) {
  const end = ymd();
  const start = range === 'all' ? '0000' : addDays(end, -range + 1);
  const lbl = (d) => shortDate(d);
  if (metric === 'weight' || metric === 'bodyFat') {
    return bodySeries(metric, end).filter((x) => x.date >= start).map((x) => ({ label: lbl(x.date), value: x.v }));
  }
  if (metric === 'kcal' || metric === 'protein') {
    return Object.keys(S().days).filter((d) => d >= start && d <= end && S().days[d].meals?.length).sort()
      .map((d) => ({ label: lbl(d), value: Math.round(dayTotals(d)[metric]) }));
  }
  if (metric === 'volume') {
    return workoutHistory().filter((h) => h.date >= start).reverse().map((h) => ({ label: lbl(h.date), value: workoutStats(h.workout).volume, tip: `${lbl(h.date)} · ${h.workout.title}: ${fmt(workoutStats(h.workout).volume)} kg` }));
  }
  return [];
}

const METRICS = [
  { id: 'weight', label: 'Weight', unit: ' kg', color: 'var(--accent)' },
  { id: 'bodyFat', label: 'Body Fat', unit: '%', color: 'var(--accent)' },
  { id: 'kcal', label: 'Calories', unit: ' kcal', color: 'var(--accent)', target: 'kcal' },
  { id: 'protein', label: 'Protein', unit: ' g', color: 'var(--protein)', target: 'protein' },
  { id: 'volume', label: 'Volume', unit: ' kg', color: 'var(--violet)' },
];

function progressCard(full = false) {
  const m = METRICS.find((x) => x.id === ui.progress.metric) || METRICS[0];
  const t = activeTargets(S());
  const pts = progressSeries(m.id, ui.progress.range);
  const list = full ? METRICS : METRICS.slice(0, 3);
  return `<section class="card prog">
    <div class="card-h wrap"><h2>Progress</h2>
      <div class="tabs">${list.map((x) => `<button class="tab ${x.id === m.id ? 'on' : ''}" data-act="metric" data-v="${x.id}">${x.label}</button>`).join('')}</div>
      <select class="select" data-act-change="range" aria-label="Range">
        ${[[7, 'Last 7 days'], [30, 'Last 30 days'], [90, 'Last 90 days'], ['all', 'All time']].map(([v, l]) => `<option value="${v}" ${String(ui.progress.range) === String(v) ? 'selected' : ''}>${l}</option>`).join('')}
      </select>
    </div>
    ${lineChart(pts, { unit: m.unit, color: m.color, target: m.target ? t[m.target] : null, decimals: m.id === 'weight' || m.id === 'bodyFat' ? 1 : 0 })}
  </section>`;
}

// ============ workouts ============
function workoutsView() {
  return `${header('<h1>Workouts</h1>', 'Plan a session that fits your time.')}
    <div class="grid-w">
      <div class="col">${planCard(ui.date, true)}</div>
      <div class="col">${plannerCard()}${splitCard()}</div>
    </div>
    ${historyCard()}`;
}

function plannerCard() {
  const s = S();
  const p = s.profile;
  const pl = ui.planner;
  const minutes = pl.minutes ?? p.defaultMinutes;
  const engine = pl.engine ?? s.settings.engine;
  const aw = p.goals.includes('armwrestling');
  const nf = nextFocus(p, ui.date);
  const focuses = [['auto', `Auto: ${focusTitle(nf, p)}`], ...Object.keys(FOCUS).filter((k) => k !== 'arm_spec' || aw).map((k) => [k, focusTitle(k, p)])];
  const draft = pl.draft;
  return `<section class="card planner">
    <div class="card-h"><h2>Build a session</h2></div>
    <label class="label">Time available</label>
    <div class="chips">${[20, 30, 45, 60, 75, 90].map((m) => `<button class="chip ${m === Number(minutes) ? 'on' : ''}" data-act="pl-min" data-v="${m}">${m} min</button>`).join('')}
      <input class="input mini" type="number" inputmode="numeric" min="10" max="180" value="${minutes}" data-act-change="pl-min-input" aria-label="Custom minutes"></div>
    <label class="label">Focus</label>
    <div class="chips">${focuses.map(([k, l]) => `<button class="chip ${pl.focus === k ? 'on' : ''}" data-act="pl-focus" data-v="${k}">${esc(l)}</button>`).join('')}</div>
    <label class="label">Planner</label>
    <div class="seg">
      <button class="${engine === 'rules' ? 'on' : ''}" data-act="pl-engine" data-v="rules">${icon('target', 16)} Smart rules <small>free, offline</small></button>
      <button class="${engine === 'ai' ? 'on' : ''}" data-act="pl-engine" data-v="ai">${icon('sparkles', 16)} AI coach <small>Gemini</small></button>
    </div>
    ${engine === 'ai' ? `<textarea class="input" rows="2" placeholder="Anything the coach should know? e.g. elbow a bit sore, only a pull-up bar today" data-ui="planner.note">${esc(pl.note)}</textarea>` : ''}
    <button class="btn primary wide" data-act="pl-generate" ${pl.busy ? 'disabled' : ''}>${pl.busy ? '<span class="spin"></span> Building your session…' : `${icon(engine === 'ai' ? 'sparkles' : 'refresh', 18)} Generate ${minutes}-min session`}</button>
    ${pl.error ? `<p class="err">${esc(pl.error)}</p>` : ''}
    ${draft ? draftPreview(draft) : ''}
  </section>`;
}

function draftPreview(plan) {
  return `<div class="draft">
    ${planHero(plan)}
    ${plan.coachNote ? `<p class="coach">${icon('info', 16)}<span>${esc(plan.coachNote)}</span></p>` : ''}
    ${plan.warmup?.length ? `<p class="small muted">Warm-up: ${plan.warmup.map((w) => esc(w.name)).join(' · ')}</p>` : ''}
    <ul class="exlist">${plan.exercises.map((ex) => `<li><span class="tick num"></span><div class="ex-n"><span>${esc(ex.name)}</span>${ex.notes ? `<small>${esc(ex.notes)}</small>` : ''}</div><span class="ex-t">${esc(targetText(ex))} · ${ex.rest}s</span></li>`).join('')}</ul>
    <div class="row">
      <button class="btn primary" data-act="pl-use">${icon('check', 18)} Use for ${ui.date === ymd() ? 'today' : shortDate(ui.date)}</button>
      ${plan.source === 'rules' ? `<button class="btn ghost" data-act="pl-shuffle">${icon('refresh', 16)} Shuffle</button>` : `<button class="btn ghost" data-act="pl-generate">${icon('refresh', 16)} Again</button>`}
      <button class="btn text" data-act="pl-discard">Discard</button>
    </div>
  </div>`;
}

function splitCard() {
  const p = S().profile;
  const rot = rotation(p);
  const nf = nextFocus(p, ui.date);
  return `<section class="card">
    <div class="card-h"><h2>Your split</h2><span class="muted small">${p.daysPerWeek} days / week</span></div>
    <div class="split">${rot.map((f, i) => `<div class="split-i ${f === nf ? 'next' : ''}"><span>Day ${i + 1}</span><b>${esc(focusTitle(f, p))}</b>${f === nf ? '<em>next</em>' : ''}</div>`).join('')}</div>
    <p class="small muted">fitin follows this order and moves to the next day type after each workout you log. Change days per week in Settings.</p>
  </section>`;
}

function historyCard() {
  const hist = workoutHistory().slice(0, 30);
  return `<section class="card">
    <div class="card-h"><h2>History</h2><span class="muted small">${hist.length ? `${hist.length} workouts` : ''}</span></div>
    ${hist.length ? `<ul class="hist">${hist.map((h) => {
      const st = workoutStats(h.workout);
      return `<li><button data-act="history" data-date="${h.date}"><span class="hist-d"><b>${fmtDate(h.date, { day: 'numeric' })}</b><small>${fmtDate(h.date, { month: 'short' })}</small></span>
        <span class="hist-t"><b>${esc(h.workout.title)}</b><small>${plural(st.sets, 'set')}${st.volume ? ` · ${fmt(st.volume)} kg` : ''}${h.workout.durationMin ? ` · ${h.workout.durationMin} min` : ''}</small></span>${icon('chevR', 18)}</button></li>`;
    }).join('')}</ul>` : '<p class="muted">Finished workouts show up here.</p>'}
  </section>`;
}

// ============ session ============
function sessionView() {
  const d = day(ui.date);
  const w = d.workout;
  if (!w) {
    return `${header('<h1>Workout</h1>')}<section class="card"><p>No workout on ${fmtDate(ui.date)}.</p><div class="row"><button class="btn primary" data-act="start">Start a workout</button><button class="btn ghost" data-act="go" data-to="workouts">Plan one</button></div></section>`;
  }
  const st = workoutStats(w);
  const warm = w.warmup?.length
    ? `<section class="card"><details class="warm" ${w.exercises.some((e) => e.sets.some((x) => x.done)) ? '' : 'open'}><summary>Warm-up</summary><ul>${w.warmup.map((x, i) => `<li class="${x.done ? 'done' : ''}"><button class="tick btn-tick" data-act="warm" data-i="${i}" aria-label="Done">${x.done ? icon('check', 14) : ''}</button><span>${esc(x.name)}</span><span class="ex-t">${esc(x.dose)}</span></li>`).join('')}</ul></details></section>`
    : '';
  const exs = w.exercises.map((ex, ei) => {
    const alts = alternatives(ex.name, ['none', ...S().profile.equipment]);
    const unitLbl = ex.unit === 'sec' ? 'sec' : ex.unit === 'min' ? 'min' : 'reps';
    const rows = ex.sets.map((s, si) => `<div class="set ${s.done ? 'done' : ''}">
      <span class="set-n">${si + 1}</span>
      ${ex.loaded ? `<input class="input" type="number" inputmode="decimal" step="0.5" placeholder="kg" value="${esc(s.kg)}" data-set="${ei}:${si}:kg" aria-label="Weight in kg">` : '<span class="bw">BW</span>'}
      <input class="input" type="number" inputmode="numeric" placeholder="${esc(topNum(ex.reps))}" value="${esc(s.reps)}" data-set="${ei}:${si}:reps" aria-label="${unitLbl}">
      <span class="set-u">${unitLbl}</span>
      <button class="set-ok" data-act="set-done" data-e="${ei}" data-s="${si}" aria-label="Mark set done">${icon('check', 18)}</button>
    </div>`).join('');
    return `<section class="card ex">
      <div class="ex-h"><div><h3>${esc(ex.name)}</h3><p class="muted small">${esc(targetText({ ...ex, sets: ex.targetSets || ex.sets.length }))}${ex.rest ? ` · rest ${ex.rest}s` : ''}</p></div>
        <div class="ex-tools">${alts.length ? `<button class="icon-btn" data-act="swap" data-e="${ei}" aria-label="Swap exercise" title="Swap">${icon('swap', 17)}</button>` : ''}<button class="icon-btn" data-act="ex-remove" data-e="${ei}" aria-label="Remove exercise" title="Remove">${icon('trash', 17)}</button></div></div>
      ${ex.notes ? `<p class="note">${esc(ex.notes)}</p>` : ''}
      ${ex.hint ? `<p class="hint">${icon('chart', 14)} ${esc(ex.hint)}</p>` : ''}
      <div class="sets">${rows}</div>
      <div class="row"><button class="btn text sm" data-act="set-add" data-e="${ei}">${icon('plus', 16)} Add set</button>${ex.sets.length > 1 ? `<button class="btn text sm" data-act="set-remove" data-e="${ei}">Remove last set</button>` : ''}</div>
    </section>`;
  }).join('');
  return `<header class="head">
      <div class="head-text"><p class="hello">${fmtDate(ui.date)}</p><h1>${esc(w.title)}</h1><p class="sub"><span id="elapsed">${elapsed(w)}</span> · ${st.sets}/${st.total} sets${st.volume ? ` · ${fmt(st.volume)} kg` : ''}</p></div>
      <div class="head-tools"><button class="btn ghost" data-act="discard-workout">Discard</button><button class="btn primary" data-act="finish">${w.finishedAt ? 'Save' : 'Finish'}</button></div>
    </header>
    ${warm}${exs}
    <button class="btn ghost wide" data-act="ex-add">${icon('plus', 18)} Add exercise</button>
    <p class="small muted center">Stop any set that causes sharp joint pain. Tendons adapt slower than muscles.</p>`;
}

function elapsed(w) {
  const end = w.finishedAt || Date.now();
  const sec = Math.max(0, Math.round((end - w.startedAt) / 1000));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return `${icon('clock', 14)} ${h ? h + ':' : ''}${String(m).padStart(h ? 2 : 1, '0')}:${String(s).padStart(2, '0')}`;
}

function newWorkoutEx(ex, date) {
  const sug = suggestion(ex, date);
  const sets = ex.unit === 'min' ? 1 : ex.sets;
  return {
    id: uid(), planExId: ex.id || null, name: ex.name, reps: ex.reps, rest: ex.rest, unit: ex.unit, loaded: ex.loaded, side: ex.side,
    notes: ex.notes || '', targetSets: sets, hint: sug?.text || '',
    sets: Array.from({ length: sets }, () => ({ kg: sug?.kg ?? '', reps: '', done: false })),
  };
}

function startWorkout() {
  const date = ui.date;
  update((s) => {
    const d = s.days[date] || (s.days[date] = { meals: [], plan: null, workout: null });
    if (d.workout) return;
    const plan = d.plan;
    d.workout = {
      id: uid(), planId: plan?.id || null, focus: plan?.focus || null, title: plan?.title || 'Custom workout', tags: plan?.tags || [],
      source: plan?.source || 'custom', startedAt: Date.now(), finishedAt: null,
      warmup: (plan?.warmup || []).map((x) => ({ ...x, done: false })),
      exercises: (plan?.exercises || []).map((ex) => newWorkoutEx(ex, date)),
    };
  }, { silent: true });
  go('session');
}

// ---------- rest timer ----------
function startRest(seconds, name) {
  if (!seconds) return;
  ui.timer = { end: Date.now() + seconds * 1000, name, beeped: false };
  tickRest();
}
function tickRest() {
  const el = $('#rest');
  const t = ui.timer;
  if (!t) { el.innerHTML = ''; el.className = ''; return; }
  const left = Math.ceil((t.end - Date.now()) / 1000);
  if (left <= 0 && !t.beeped) {
    t.beeped = true;
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    beep();
    setTimeout(() => { if (ui.timer === t) { ui.timer = null; tickRest(); } }, 4000);
  }
  const m = Math.floor(Math.max(0, left) / 60), s = Math.max(0, left) % 60;
  el.className = 'show' + (left <= 0 ? ' over' : '');
  el.innerHTML = `<span>${icon('clock', 16)} ${left <= 0 ? 'Rest done · go' : `Rest ${m}:${String(s).padStart(2, '0')}`}</span><small>${esc(t.name)}</small>
    <button data-act="rest-add">+15s</button><button data-act="rest-skip">Skip</button>`;
}
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.frequency.value = 880; g.gain.value = 0.08; o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 0.25);
  } catch { /* no audio */ }
}
setInterval(() => {
  if (ui.timer) tickRest();
  const el = document.getElementById('elapsed');
  const w = day(ui.date).workout;
  if (el && w && !w.finishedAt) el.innerHTML = elapsed(w);
}, 500);

// ============ nutrition ============
function nutritionView() {
  const s = S();
  const t = activeTargets(s);
  const tot = dayTotals(ui.date);
  const left = t.kcal - tot.kcal;
  const pLeft = t.protein - tot.protein;
  const sections = MEALS.map((m) => {
    const items = day(ui.date).meals.filter((x) => x.meal === m.id);
    const mt = mealTotals(ui.date, m.id);
    return `<section class="card meal">
      <div class="card-h"><div class="meal-t"><span class="badge t-${m.id}">${icon(m.icon, 16)}</span><h2>${m.label}</h2><span class="muted small">${mt.count ? `${fmt(mt.kcal)} kcal · P ${fmt(mt.protein)} g` : ''}</span></div>
        <button class="btn ghost sm" data-act="food" data-meal="${m.id}">${icon('plus', 16)} Add</button></div>
      ${items.length ? `<ul class="entries">${items.map((e) => `<li>
        <button class="entry" data-act="entry-edit" data-id="${e.id}"><span><b>${esc(e.name)}</b><small>${esc(e.amountLabel || `${fmt(e.grams)} g`)}${e.brand ? ` · ${esc(e.brand)}` : ''}${e.estimate ? ' · AI estimate' : ''}</small></span>
        <span class="entry-m"><b>${fmt(e.kcal)} kcal</b><small>P ${fmt(e.protein, 1)} · C ${fmt(e.carbs, 1)} · F ${fmt(e.fat, 1)}</small></span></button>
        <button class="icon-btn" data-act="entry-del" data-id="${e.id}" aria-label="Delete">${icon('trash', 16)}</button></li>`).join('')}</ul>` : ''}
    </section>`;
  }).join('');
  return `${header('<h1>Nutrition</h1>', 'Scan, search, or describe what you ate.')}
    <div class="grid-n">
      <section class="card nutri">
        <div class="nutri-top">${bigRing(tot, t)}<div class="panel">${macroBars(tot, t)}</div></div>
        <p class="left-line">${left >= 0 ? `<b>${fmt(left)} kcal</b> left` : `<b>${fmt(-left)} kcal</b> over`} · ${pLeft > 0 ? `<b>${fmt(pLeft)} g</b> protein to go` : 'Protein target hit'}</p>
        <div class="quick">
          <button class="chip" data-act="food" data-tab="scan">${icon('barcode', 16)}Scan barcode</button>
          <button class="chip" data-act="food" data-tab="search">${icon('search', 16)}Search</button>
          <button class="chip" data-act="food" data-tab="ai">${icon('sparkles', 16)}Describe with AI</button>
          <button class="chip" data-act="food" data-tab="manual">${icon('keyboard', 16)}Manual</button>
        </div>
      </section>
      <div class="col">${sections}</div>
    </div>
    ${myFoodsCard()}`;
}

function myFoodsCard() {
  const foods = S().foods;
  if (!foods.length) return '';
  return `<section class="card"><div class="card-h"><h2>My foods</h2><span class="muted small">Saved from scans and manual entries</span></div>
    <ul class="entries">${foods.map((f) => `<li><div class="entry static"><span><b>${esc(f.name)}</b><small>${f.brand ? esc(f.brand) + ' · ' : ''}${f.barcode ? esc(f.barcode) + ' · ' : ''}per 100 g</small></span><span class="entry-m"><b>${fmt(f.kcal)} kcal</b><small>P ${fmt(f.protein, 1)} · C ${fmt(f.carbs, 1)} · F ${fmt(f.fat, 1)}</small></span></div>
    <button class="icon-btn" data-act="food-del" data-id="${esc(f.id)}" aria-label="Delete">${icon('trash', 16)}</button></li>`).join('')}</ul></section>`;
}

// ============ progress ============
function progressView() {
  const s = S();
  const entry = s.body.find((b) => b.date === ui.date) || {};
  const recent = [...s.body].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 12);
  return `${header('<h1>Progress</h1>', 'Trends beat single days.')}
    <div class="grid-p">
      <section class="card">
        <div class="card-h"><h2>Log body stats</h2><span class="muted small">${fmtDate(ui.date)}</span></div>
        <div class="form2">
          <label class="field"><span>Weight (kg)</span><input class="input" id="bw-w" type="number" inputmode="decimal" step="0.1" value="${esc(entry.weight ?? '')}" placeholder="${esc(s.profile.weightKg)}"></label>
          <label class="field"><span>Body fat % (optional)</span><input class="input" id="bw-bf" type="number" inputmode="decimal" step="0.1" value="${esc(entry.bodyFat ?? '')}" placeholder="e.g. 16"></label>
        </div>
        <button class="btn primary wide" data-act="body-save">${icon('check', 18)} Save</button>
        <p class="small muted">Weigh in the morning after the bathroom, before food. Daily numbers swing 1 to 2 kg with water and salt, so watch the line, not the day.</p>
        ${recent.length ? `<ul class="entries compact">${recent.map((b) => `<li><div class="entry static"><span><b>${fmtDate(b.date)}</b></span><span class="entry-m"><b>${b.weight !== '' && b.weight != null ? fmt(b.weight, 1) + ' kg' : '–'}</b><small>${b.bodyFat !== '' && b.bodyFat != null ? fmt(b.bodyFat, 1) + '% fat' : ''}</small></span></div><button class="icon-btn" data-act="body-del" data-date="${b.date}" aria-label="Delete">${icon('trash', 16)}</button></li>`).join('')}</ul>` : ''}
      </section>
      ${progressCard(true)}
    </div>
    ${bestsCard()}`;
}

function bestsCard() {
  const best = new Map();
  for (const h of workoutHistory()) {
    for (const ex of h.workout.exercises) {
      for (const st of ex.sets) {
        if (!st.done) continue;
        const kg = Number(st.kg) || 0, reps = Number(st.reps) || 0;
        if (!reps) continue;
        const score = ex.loaded && kg ? kg * (1 + reps / 30) : reps;
        const cur = best.get(ex.name);
        if (!cur || score > cur.score) best.set(ex.name, { score, kg, reps, date: h.date, loaded: ex.loaded && kg, unit: ex.unit });
      }
    }
  }
  const rows = [...best.entries()].sort((a, b) => (a[1].date < b[1].date ? 1 : -1)).slice(0, 12);
  return `<section class="card"><div class="card-h"><h2>Personal bests</h2><span class="muted small">Best set per exercise</span></div>
    ${rows.length ? `<div class="table-wrap"><table class="tbl"><thead><tr><th>Exercise</th><th>Best set</th><th>Est. 1RM</th><th>Date</th></tr></thead><tbody>
    ${rows.map(([n, b]) => `<tr><td>${esc(n)}</td><td>${b.loaded ? `${fmt(b.kg, 1)} kg × ${b.reps}` : `${b.reps} ${b.unit === 'sec' ? 's' : b.unit === 'min' ? 'min' : 'reps'}`}</td><td>${b.loaded ? `${fmt(b.score, 1)} kg` : '–'}</td><td>${shortDate(b.date)}</td></tr>`).join('')}
    </tbody></table></div>` : '<p class="muted">Log sets to see your bests.</p>'}</section>`;
}

// ============ settings + onboarding ============
function chipsFor(list, selected, act) {
  return list.map((x) => `<button class="chip ${selected.includes(x.id) ? 'on' : ''}" data-act="${act}" data-v="${x.id}">${selected.includes(x.id) ? icon('check', 14) : ''}${esc(x.label)}</button>`).join('');
}
function seg(path, value, options) {
  return `<div class="seg">${options.map(([v, l]) => `<button class="${String(value) === String(v) ? 'on' : ''}" data-act="set" data-path="${path}" data-v="${v}">${l}</button>`).join('')}</div>`;
}

function profileForm(compact = false) {
  const p = S().profile;
  return `
    <div class="form2">
      <label class="field"><span>Name</span><input class="input" data-bind="profile.name" value="${esc(p.name)}" placeholder="Your name" autocomplete="given-name"></label>
      <label class="field"><span>Age</span><input class="input" type="number" inputmode="numeric" data-bind="profile.age" data-type="num" value="${esc(p.age)}"></label>
      <label class="field"><span>Height (cm)</span><input class="input" type="number" inputmode="decimal" data-bind="profile.heightCm" data-type="num" value="${esc(p.heightCm)}"></label>
      <label class="field"><span>Weight (kg)</span><input class="input" type="number" inputmode="decimal" step="0.1" data-bind="profile.weightKg" data-type="num" value="${esc(p.weightKg)}"></label>
    </div>
    <label class="label">Sex (for calorie maths)</label>${seg('profile.sex', p.sex, [['male', 'Male'], ['female', 'Female']])}
    <label class="label">Daily activity outside training</label>${seg('profile.activity', p.activity, [['sedentary', 'Desk'], ['light', 'Light'], ['moderate', 'Moderate'], ['very', 'Very active']])}
    <label class="label">Goals</label><div class="chips">${chipsFor(GOALS, p.goals, 'toggle-goal')}</div>
    <label class="label">Experience</label>${seg('profile.experience', p.experience, [['beginner', 'Beginner'], ['intermediate', 'Intermediate'], ['advanced', 'Advanced']])}
    <label class="label">Equipment you can use</label><div class="chips">${chipsFor(EQUIPMENT, p.equipment, 'toggle-eq')}</div>
    <label class="label">Training days per week</label>${seg('profile.daysPerWeek', p.daysPerWeek, [2, 3, 4, 5, 6].map((n) => [n, n]))}
    ${compact ? '' : `<label class="label">Usual session length</label>${seg('profile.defaultMinutes', p.defaultMinutes, [30, 45, 60, 75, 90].map((n) => [n, n + ' min']))}`}`;
}

function onboardingView() {
  return `<div class="onb">
    <div class="brand big">${icon('pulse', 30)}<span>fitin</span></div>
    <h1>Let's set you up</h1>
    <p class="sub">A few details so fitin can plan sessions and set your calorie and protein targets. Everything stays on this device.</p>
    <section class="card">${profileForm(true)}
      <button class="btn primary wide" data-act="onboard-done">Let's go ${icon('arrowR', 18)}</button>
    </section>
  </div>`;
}

function settingsView() {
  const s = S();
  const auto = computeTargets(s.profile);
  const t = activeTargets(s);
  return `${header('<h1>Settings</h1>', 'Profile, goals, targets and data.', false)}
    <div class="grid-s">
      <section class="card"><div class="card-h"><h2>Profile and goals</h2></div>${profileForm()}</section>
      <div class="col">
        <section class="card">
          <div class="card-h"><h2>Daily targets</h2></div>
          <div class="targets">
            <div><b>${fmt(t.kcal)}</b><span>kcal</span></div><div><b>${fmt(t.protein)} g</b><span>protein</span></div>
            <div><b>${fmt(t.carbs)} g</b><span>carbs</span></div><div><b>${fmt(t.fat)} g</b><span>fat</span></div>
          </div>
          <p class="small muted">Maintenance is about ${fmt(auto.tdee)} kcal. ${s.profile.goals.includes('fatloss') ? 'fitin sets a moderate deficit so you lose fat without losing strength, and keeps protein high.' : 'Protein is set high to support strength.'} These are starting points: if your weight trend does not move for 2 weeks, adjust by 100 to 200 kcal.</p>
          <label class="switch"><input type="checkbox" data-bind="targets.override" ${s.targets.override ? 'checked' : ''}><span>Set my own targets</span></label>
          ${s.targets.override ? `<div class="form2">
            ${[['kcal', 'Calories'], ['protein', 'Protein (g)'], ['carbs', 'Carbs (g)'], ['fat', 'Fat (g)']].map(([k, l]) => `<label class="field"><span>${l}</span><input class="input" type="number" inputmode="numeric" data-bind="targets.${k}" data-type="num" value="${esc(s.targets[k])}"></label>`).join('')}
          </div>` : ''}
        </section>
        <section class="card">
          <div class="card-h"><h2>AI coach (Gemini)</h2></div>
          <p class="small muted">The AI planner and meal estimates run through your site's serverless function, which holds your Gemini API key. If you set FITIN_ACCESS_CODE on the server, enter the same code here.</p>
          <label class="field"><span>Access code (optional)</span><input class="input" data-bind="settings.accessCode" value="${esc(s.settings.accessCode)}" placeholder="Only if you set one"></label>
          <label class="label">Default planner</label>${seg('settings.engine', s.settings.engine, [['rules', 'Smart rules'], ['ai', 'AI coach']])}
          <button class="btn ghost wide" data-act="ai-test">${icon('sparkles', 16)} Test AI connection</button>
          <p class="small" id="ai-status"></p>
        </section>
        <section class="card">
          <div class="card-h"><h2>Your data</h2></div>
          <p class="small muted">Stored only in this browser. Export a backup now and then, and import it on another device.</p>
          <div class="row">
            <button class="btn ghost" data-act="export">${icon('download', 16)} Export</button>
            <label class="btn ghost">${icon('upload', 16)} Import<input type="file" accept="application/json" id="import-file" hidden></label>
            <button class="btn text danger" data-act="reset">Reset everything</button>
          </div>
        </section>
      </div>
    </div>`;
}

// ============ sheets ============
function openSheet(sheet) {
  closeScanner();
  ui.sheet = sheet;
  renderSheet();
  document.body.classList.add('sheet-open');
}
function closeSheet() {
  closeScanner();
  ui.sheet = null;
  $('#sheet-root').innerHTML = '';
  document.body.classList.remove('sheet-open');
}
function closeScanner() {
  if (ui.scanStop) { const st = ui.scanStop; ui.scanStop = null; st(); }
}

function renderSheet() {
  const sh = ui.sheet;
  if (!sh) return;
  closeScanner();
  const bodies = { food: foodSheet, history: historySheet, swap: swapSheet, exadd: exAddSheet };
  $('#sheet-root').innerHTML = `<div class="backdrop" data-act="sheet-close"></div>
    <div class="sheet" role="dialog" aria-modal="true">${bodies[sh.type]()}</div>`;
  if (sh.type === 'food' && sh.tab === 'scan' && !sh.selected) beginScan();
  const auto = $('#sheet-root [autofocus]');
  if (auto && window.matchMedia('(pointer:fine)').matches) auto.focus();
}

function sheetHead(title, back = '') {
  return `<div class="sheet-h">${back ? `<button class="icon-btn" data-act="${back}" aria-label="Back">${icon('chevL', 20)}</button>` : ''}<h2>${title}</h2><button class="icon-btn" data-act="sheet-close" aria-label="Close">${icon('x', 20)}</button></div>`;
}

// ---------- food sheet ----------
function openFood(meal, tab = 'search') {
  openSheet({ type: 'food', meal: meal || defaultMeal(), tab, q: '', off: null, offBusy: false, offErr: '', selected: null, amount: '', unitIdx: 0, aiText: '', ai: null, aiBusy: false, aiErr: '', scanMsg: '', manual: { basis: '100', servingG: '' } });
}

function foodSheet() {
  const sh = ui.sheet;
  if (sh.selected) return servingStep();
  const tabs = [['search', 'Search', 'search'], ['scan', 'Scan', 'barcode'], ['ai', 'Describe', 'sparkles'], ['manual', 'Manual', 'keyboard']];
  const mealSel = `<div class="chips tight">${MEALS.map((m) => `<button class="chip ${sh.meal === m.id ? 'on' : ''}" data-act="sh-meal" data-v="${m.id}">${m.label}</button>`).join('')}</div>`;
  let body = '';
  if (sh.tab === 'search') {
    body = `<div class="searchbox">${icon('search', 18)}<input class="input" id="food-q" placeholder="Search foods: puttu, egg, whey…" value="${esc(sh.q)}" autofocus autocomplete="off"></div>
      <div id="food-results">${foodResults()}</div>`;
  } else if (sh.tab === 'scan') {
    body = `<div id="scan-region" class="scan-region"></div>
      <p class="small muted center" id="scan-msg">${esc(sh.scanMsg || 'Point the camera at the barcode on the pack.')}</p>
      <div class="row">
        <input class="input" id="barcode-in" inputmode="numeric" placeholder="Or type the barcode number">
        <button class="btn ghost" data-act="barcode-lookup">Look up</button>
      </div>
      <label class="btn text wide">${icon('image', 16)} Scan from a photo<input type="file" accept="image/*" capture="environment" id="scan-file" hidden></label>`;
  } else if (sh.tab === 'ai') {
    body = `<textarea class="input" id="ai-text" rows="3" placeholder="e.g. 2 puttu with kadala curry and a chaya" autofocus>${esc(sh.aiText)}</textarea>
      <button class="btn primary wide" data-act="ai-food" ${sh.aiBusy ? 'disabled' : ''}>${sh.aiBusy ? '<span class="spin"></span> Estimating…' : `${icon('sparkles', 18)} Estimate with AI`}</button>
      ${sh.aiErr ? `<p class="err">${esc(sh.aiErr)}</p>` : ''}
      ${sh.ai ? `<ul class="entries pick">${sh.ai.items.map((it, i) => `<li><label class="entry"><input type="checkbox" data-ai-item="${i}" ${it.on !== false ? 'checked' : ''}><span><b>${esc(it.name)}</b><small>${fmt(it.grams)} g</small></span><span class="entry-m"><b>${fmt(it.kcal)} kcal</b><small>P ${fmt(it.protein, 1)} · C ${fmt(it.carbs, 1)} · F ${fmt(it.fat, 1)}</small></span></label></li>`).join('')}</ul>
        ${sh.ai.note ? `<p class="small muted">${esc(sh.ai.note)}</p>` : ''}
        <button class="btn primary wide" data-act="ai-add">${icon('plus', 18)} Add to ${MEALS.find((m) => m.id === sh.meal).label}</button>` : '<p class="small muted">Good for home-cooked meals that have no barcode. Values are estimates.</p>'}`;
  } else {
    const m = sh.manual;
    body = `${m.barcode ? `<p class="small notice">${icon('info', 14)} Barcode ${esc(m.barcode)} is not in Open Food Facts yet. Enter the label values once and fitin will remember it.</p>` : ''}
      <label class="field"><span>Food name</span><input class="input" data-man="name" value="${esc(m.name || '')}" placeholder="e.g. Homemade chicken curry" autofocus></label>
      <label class="field"><span>Brand (optional)</span><input class="input" data-man="brand" value="${esc(m.brand || '')}"></label>
      <label class="label">Label values are</label>
      <div class="seg"><button class="${m.basis === '100' ? 'on' : ''}" data-act="man-basis" data-v="100">Per 100 g</button><button class="${m.basis === 'serving' ? 'on' : ''}" data-act="man-basis" data-v="serving">Per serving</button></div>
      ${m.basis === 'serving' ? `<label class="field"><span>Serving size (g)</span><input class="input" type="number" inputmode="decimal" data-man="servingG" value="${esc(m.servingG)}"></label>` : ''}
      <div class="form2">${[['kcal', 'Calories (kcal)'], ['protein', 'Protein (g)'], ['carbs', 'Carbs (g)'], ['fat', 'Fat (g)']].map(([k, l]) => `<label class="field"><span>${l}</span><input class="input" type="number" inputmode="decimal" step="0.1" data-man="${k}" value="${esc(m[k] ?? '')}"></label>`).join('')}</div>
      <label class="switch"><input type="checkbox" data-man-save ${m.save === false ? '' : 'checked'}><span>Save to My foods</span></label>
      <p class="err" id="man-err"></p>
      <button class="btn primary wide" data-act="man-continue">Continue ${icon('arrowR', 18)}</button>`;
  }
  return `${sheetHead('Add food')}
    ${mealSel}
    <div class="tabs full">${tabs.map(([k, l, ic]) => `<button class="tab ${sh.tab === k ? 'on' : ''}" data-act="sh-tab" data-v="${k}">${icon(ic, 16)}${l}</button>`).join('')}</div>
    <div class="sheet-b">${body}</div>`;
}

function foodRow(f) {
  const unit = f.units?.[0];
  return `<li><button class="entry" data-act="pick-food" data-id="${esc(f.id)}"><span><b>${esc(f.name)}</b><small>${f.brand ? esc(f.brand) + ' · ' : ''}${unit ? `${esc(unit.label)} = ${fmt(scaleFood(f, unit.g).kcal)} kcal` : 'per 100 g'}</small></span>
    <span class="entry-m"><b>${fmt(f.kcal)} kcal</b><small>/100 g · P ${fmt(f.protein, 1)}</small></span></button></li>`;
}

function foodResults() {
  const sh = ui.sheet;
  const s = S();
  const q = sh.q.trim();
  let html = '';
  if (!q && s.recentFoods.length) {
    html += `<h4 class="label">Recent</h4><ul class="entries">${s.recentFoods.slice(0, 8).map(foodRow).join('')}</ul>`;
  }
  const local = searchLocal(q, s.foods);
  html += `<h4 class="label">${q ? 'Matches' : 'Foods'}</h4>${local.length ? `<ul class="entries">${local.map(foodRow).join('')}</ul>` : '<p class="small muted">No matches in fitin\'s list.</p>'}`;
  if (q.length >= 2) {
    html += `<button class="btn ghost wide" data-act="off-search" ${sh.offBusy ? 'disabled' : ''}>${sh.offBusy ? '<span class="spin"></span> Searching…' : `${icon('search', 16)} Search packaged foods for "${esc(q)}"`}</button>`;
  }
  if (sh.offErr) html += `<p class="err">${esc(sh.offErr)}</p>`;
  if (sh.off) {
    html += `<h4 class="label">Open Food Facts</h4>${sh.off.length ? `<ul class="entries">${sh.off.map(foodRow).join('')}</ul>` : '<p class="small muted">Nothing found. Try the Describe or Manual tab.</p>'}`;
  }
  return html;
}

function findFoodById(id) {
  const sh = ui.sheet;
  const s = S();
  return (sh.off || []).find((f) => f.id === id) || s.foods.find((f) => f.id === id) || s.recentFoods.find((f) => f.id === id) || BUILTIN_FOODS.find((f) => f.id === id);
}

function selectFood(food) {
  const sh = ui.sheet;
  sh.selected = food;
  sh.unitIdx = food.units?.length ? 0 : -1;
  sh.amount = food.units?.length ? 1 : 100;
  closeScanner();
  renderSheet();
}

function servingGrams() {
  const sh = ui.sheet;
  const f = sh.selected;
  const amt = Number(sh.amount) || 0;
  return sh.unitIdx >= 0 && f.units?.[sh.unitIdx] ? amt * f.units[sh.unitIdx].g : amt;
}

function servingStep() {
  const sh = ui.sheet;
  const f = sh.selected;
  const g = servingGrams();
  const m = scaleFood(f, g);
  return `${sheetHead(sh.editId ? 'Edit entry' : 'How much?', sh.editId ? '' : 'serving-back')}
    <div class="sheet-b">
      <div class="food-head">${f.image ? `<img src="${esc(f.image)}" alt="" loading="lazy">` : `<span class="badge big">${icon('apple', 22)}</span>`}
        <div><h3>${esc(f.name)}</h3><p class="small muted">${f.brand ? esc(f.brand) + ' · ' : ''}${fmt(f.kcal)} kcal per 100 g${f.source === 'builtin' ? ' · typical values' : f.source === 'off' ? ' · Open Food Facts' : ''}</p></div></div>
      <div class="serving">
        <input class="input" id="amt" type="number" inputmode="decimal" step="0.5" min="0" value="${esc(sh.amount)}" aria-label="Amount">
        <select class="select" id="unit">${(f.units || []).map((u, i) => `<option value="${i}" ${sh.unitIdx === i ? 'selected' : ''}>${esc(u.label)} (${fmt(u.g)} g)</option>`).join('')}<option value="-1" ${sh.unitIdx < 0 ? 'selected' : ''}>grams</option></select>
      </div>
      <div class="macro-sum" id="macro-sum">${macroSum(m, g)}</div>
      <label class="label">Meal</label>
      <div class="chips tight">${MEALS.map((x) => `<button class="chip ${sh.meal === x.id ? 'on' : ''}" data-act="sh-meal" data-v="${x.id}">${x.label}</button>`).join('')}</div>
      <button class="btn primary wide" data-act="food-add">${icon(sh.editId ? 'check' : 'plus', 18)} ${sh.editId ? 'Save' : 'Add to ' + MEALS.find((x) => x.id === sh.meal).label}</button>
    </div>`;
}

const macroSum = (m, g) => `<div><b>${fmt(m.kcal)}</b><span>kcal</span></div><div><b>${fmt(m.protein, 1)}</b><span>protein</span></div><div><b>${fmt(m.carbs, 1)}</b><span>carbs</span></div><div><b>${fmt(m.fat, 1)}</b><span>fat</span></div><div class="g"><b>${fmt(g)}</b><span>grams</span></div>`;

function snapshot(f) {
  const { id, name, brand, kcal, protein, carbs, fat, units, source, barcode } = f;
  return { id, name, brand: brand || '', kcal, protein, carbs, fat, units: units || [], source, barcode: barcode || '' };
}

function addFoodEntry() {
  const sh = ui.sheet;
  const f = sh.selected;
  const g = servingGrams();
  if (!g) { toast('Enter an amount', 'bad'); return; }
  const m = scaleFood(f, g);
  const unit = sh.unitIdx >= 0 ? f.units[sh.unitIdx] : null;
  const amountLabel = unit ? `${fmt(sh.amount, 2)} × ${unit.label} · ${fmt(g)} g` : `${fmt(g)} g`;
  const entry = { meal: sh.meal, name: f.name, brand: f.brand || '', grams: g, qty: Number(sh.amount), unitIdx: sh.unitIdx, amountLabel, ...m, food: snapshot(f) };
  const date = ui.date;
  update((s) => {
    const d = s.days[date] || (s.days[date] = { meals: [], plan: null, workout: null });
    if (sh.editId) {
      const i = d.meals.findIndex((x) => x.id === sh.editId);
      if (i >= 0) d.meals[i] = { ...d.meals[i], ...entry };
    } else {
      d.meals.push({ id: uid(), ...entry });
    }
    s.recentFoods = [snapshot(f), ...s.recentFoods.filter((r) => r.id !== f.id)].slice(0, 15);
  });
  toast(sh.editId ? 'Saved' : `Added to ${MEALS.find((x) => x.id === sh.meal).label}`);
  closeSheet();
}

async function beginScan() {
  const sh = ui.sheet;
  const msg = (t) => { sh.scanMsg = t; const el = $('#scan-msg'); if (el) el.textContent = t; };
  const keep = sh.keepMsg;
  sh.keepMsg = false;
  try {
    if (!keep) msg('Starting camera…');
    const stop = await startScanner('scan-region', (code) => { if (ui.scanStop === stop) ui.scanStop = null; handleBarcode(code); });
    if (ui.sheet !== sh || sh.tab !== 'scan' || sh.selected) { stop(); return; }
    ui.scanStop = stop;
    if (!keep) msg('Point the camera at the barcode on the pack.');
  } catch (err) {
    msg(err?.message?.includes('Permission') || err?.name === 'NotAllowedError'
      ? 'Camera permission was blocked. Allow it in your browser settings, or type the number below.'
      : (err?.message || String(err)) + ' You can type the barcode below instead.');
  }
}

async function handleBarcode(code) {
  const sh = ui.sheet;
  if (!sh) return;
  const clean = String(code).replace(/\D/g, '');
  const msgEl = $('#scan-msg');
  const saved = S().foods.find((f) => f.barcode === clean);
  if (saved) { selectFood(saved); return; }
  if (msgEl) msgEl.textContent = `Found ${clean}. Looking it up…`;
  try {
    const food = await lookupBarcode(clean);
    if (!ui.sheet) return;
    if (food && !food.incomplete) {
      update((s) => { s.foods = [snapshot(food), ...s.foods.filter((f) => f.id !== food.id)]; }, { silent: true });
      selectFood(food);
    } else {
      sh.tab = 'manual';
      sh.manual = { basis: '100', servingG: '', barcode: clean, name: food?.name && food.name !== 'Unnamed product' ? food.name : '', brand: food?.brand || '' };
      renderSheet();
    }
  } catch (err) {
    sh.scanMsg = err.message;
    sh.keepMsg = true;
    renderSheet();
  }
}

// ---------- other sheets ----------
function historySheet() {
  const date = ui.sheet.date;
  const w = day(date).workout;
  if (!w) return sheetHead('Workout') + '<div class="sheet-b"><p>Not found.</p></div>';
  const st = workoutStats(w);
  return `${sheetHead(esc(w.title))}
    <div class="sheet-b">
      <p class="muted">${fmtDate(date)} · ${plural(st.sets, 'set')}${st.volume ? ` · ${fmt(st.volume)} kg` : ''}${w.durationMin ? ` · ${w.durationMin} min` : ''}</p>
      ${w.exercises.map((ex) => `<div class="hist-ex"><b>${esc(ex.name)}</b><span>${ex.sets.filter((x) => x.done).map((x) => ex.loaded && x.kg ? `${fmt(x.kg, 1)}×${x.reps}` : `${x.reps}${ex.unit === 'sec' ? 's' : ex.unit === 'min' ? ' min' : ''}`).join(', ') || 'no sets'}</span></div>`).join('')}
      <div class="row"><button class="btn primary" data-act="history-open" data-date="${date}">Open</button><button class="btn text danger" data-act="history-del" data-date="${date}">Delete workout</button></div>
    </div>`;
}

function swapSheet() {
  const ei = ui.sheet.e;
  const ex = day(ui.date).workout.exercises[ei];
  const alts = alternatives(ex.name, ['none', ...S().profile.equipment]);
  return `${sheetHead('Swap ' + esc(ex.name))}<div class="sheet-b"><ul class="entries">${alts.map((a) => `<li><button class="entry" data-act="swap-pick" data-n="${esc(a.n)}"><span><b>${esc(a.n)}</b><small>${a.cue ? esc(a.cue) : ''}</small></span>${icon('chevR', 18)}</button></li>`).join('')}</ul></div>`;
}

function exAddSheet() {
  const q = ui.sheet.q || '';
  return `${sheetHead('Add exercise')}<div class="sheet-b">
    <div class="searchbox">${icon('search', 18)}<input class="input" id="ex-q" placeholder="Search or type a new exercise" value="${esc(q)}" autofocus autocomplete="off"></div>
    <div id="ex-results">${exResults()}</div></div>`;
}
function exResults() {
  const q = (ui.sheet.q || '').trim();
  const list = searchExercises(q, ['none', ...S().profile.equipment]);
  return `${q ? `<button class="btn ghost wide" data-act="ex-pick" data-n="${esc(q)}" data-custom="1">${icon('plus', 16)} Add "${esc(q)}"</button>` : ''}
    <ul class="entries">${list.map((e) => `<li><button class="entry" data-act="ex-pick" data-n="${esc(e.n)}"><span><b>${esc(e.n)}</b><small>${e.loaded ? 'weighted' : 'bodyweight'}${e.unit === 'sec' ? ' · hold' : ''}</small></span>${icon('plus', 18)}</button></li>`).join('')}</ul>`;
}

function libToPlanEx(lib, name) {
  return lib
    ? { name: lib.n, sets: lib.unit === 'min' ? 1 : 3, reps: lib.r || (lib.unit === 'sec' ? '20-30' : '8-12'), rest: lib.unit === 'min' ? 0 : 75, unit: lib.unit, loaded: lib.loaded, side: lib.side, notes: lib.cue || '' }
    : { name, sets: 3, reps: '8-12', rest: 75, unit: 'reps', loaded: true, side: false, notes: '' };
}

// ============ AI helpers ============
function aiContext() {
  const s = S();
  const p = s.profile;
  const t = activeTargets(s);
  const w = bodySeries('weight', ymd());
  const history = workoutHistory().slice(0, 8).map((h) => ({
    date: h.date,
    title: h.workout.title,
    exercises: h.workout.exercises.map((e) => ({
      name: e.name,
      sets: e.sets.filter((x) => x.done).map((x) => (e.loaded && x.kg ? `${x.kg}kg x ${x.reps}` : `${x.reps}${e.unit === 'sec' ? 's' : ''}`)).join(', '),
    })).filter((e) => e.sets),
  }));
  let kc = 0, pr = 0, n = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDays(ymd(), -i);
    if (day(d).meals.length) { const tt = dayTotals(d); kc += tt.kcal; pr += tt.protein; n++; }
  }
  return {
    profile: {
      sex: p.sex, age: p.age, heightCm: p.heightCm, weightKg: w.length ? w[w.length - 1].v : p.weightKg, bodyFatPercent: p.bodyFat || undefined,
      goals: p.goals.map((g) => GOALS.find((x) => x.id === g)?.label || g),
      experience: p.experience,
      equipment: ['bodyweight', ...p.equipment.map((e) => EQUIPMENT.find((x) => x.id === e)?.label || e)],
      trainingDaysPerWeek: p.daysPerWeek,
    },
    history,
    nutrition: { targetKcal: t.kcal, targetProteinG: t.protein, avgKcalLast7Days: n ? Math.round(kc / n) : null, avgProteinLast7Days: n ? Math.round(pr / n) : null },
  };
}

async function generatePlan() {
  const s = S();
  const pl = ui.planner;
  const minutes = Number(pl.minutes ?? s.profile.defaultMinutes) || 45;
  const engine = pl.engine ?? s.settings.engine;
  pl.error = '';
  if (engine === 'rules') {
    pl.draft = buildPlan(s.profile, { minutes, focus: pl.focus, date: ui.date, shuffle: pl.shuffle });
    renderMain();
    return;
  }
  pl.busy = true;
  renderMain();
  try {
    const nf = nextFocus(s.profile, ui.date);
    const focusKey = pl.focus === 'auto' ? nf : pl.focus;
    const res = await askAi({
      task: 'plan',
      minutes,
      focus: pl.focus === 'auto' ? `coach decides; next in their split is "${focusTitle(nf, s.profile)}"` : focusTitle(pl.focus, s.profile),
      note: pl.note,
      ...aiContext(),
    });
    const p = res.plan;
    pl.draft = {
      id: uid(), date: ui.date, focus: focusKey, title: p.title, tags: p.tags, minutes, estMinutes: p.estMinutes, source: 'ai',
      warmup: p.warmup, coachNote: p.coachNote, createdAt: Date.now(),
      exercises: p.exercises.map((e) => ({ ...e, id: uid(), side: false, role: 'ai' })),
    };
  } catch (err) {
    pl.error = err.message;
  }
  pl.busy = false;
  if (route() === 'workouts') renderMain();
}

function usePlan(plan) {
  const date = ui.date;
  update((s) => {
    const d = s.days[date] || (s.days[date] = { meals: [], plan: null, workout: null });
    d.plan = { ...plan, date };
    if (d.workout && !workoutStats(d.workout).sets) d.workout = null; // nothing logged yet: start fresh
  });
}

// ============ actions ============
const actions = {
  go: (el) => go(el.dataset.to),
  date: (el) => { ui.date = addDays(ui.date, Number(el.dataset.d)); ui.planner.draft = null; renderMain(); },
  'date-today': () => { ui.date = ymd(); renderMain(); },
  'pick-date': (el) => { ui.date = el.dataset.date; renderMain(); },
  start: () => startWorkout(),
  'quick-plan': (el) => {
    const plan = buildPlan(S().profile, { minutes: Number(el.dataset.m), focus: 'auto', date: ui.date });
    usePlan(plan);
    toast(`${plan.title} · ${plan.exercises.length} exercises`);
  },
  'plan-remove': (el) => update((s) => { const p = s.days[ui.date].plan; p.exercises = p.exercises.filter((e) => e.id !== el.dataset.id); }),
  'plan-clear': () => { if (confirm('Clear the plan for this day?')) update((s) => { s.days[ui.date].plan = null; }); },

  // planner
  'pl-min': (el) => { ui.planner.minutes = Number(el.dataset.v); ui.planner.draft = null; renderMain(); },
  'pl-focus': (el) => { ui.planner.focus = el.dataset.v; ui.planner.draft = null; renderMain(); },
  'pl-engine': (el) => { ui.planner.engine = el.dataset.v; ui.planner.draft = null; ui.planner.error = ''; renderMain(); },
  'pl-generate': () => generatePlan(),
  'pl-shuffle': () => { ui.planner.shuffle++; generatePlan(); },
  'pl-discard': () => { ui.planner.draft = null; renderMain(); },
  'pl-use': () => {
    const d = day(ui.date);
    if (d.workout && workoutStats(d.workout).sets && !confirm('You already logged sets on this day. Replace the plan anyway? Your logged sets stay.')) return;
    usePlan(ui.planner.draft);
    ui.planner.draft = null;
    toast('Plan saved');
    renderMain();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // session
  warm: (el) => update((s) => { const x = s.days[ui.date].workout.warmup[el.dataset.i]; x.done = !x.done; }),
  'set-done': (el) => {
    const ei = Number(el.dataset.e), si = Number(el.dataset.s);
    let rest = 0, name = '', nowDone = false;
    update((s) => {
      const ex = s.days[ui.date].workout.exercises[ei];
      const st = ex.sets[si];
      st.done = !st.done;
      nowDone = st.done;
      if (st.done && st.reps === '') st.reps = topNum(ex.reps);
      rest = ex.rest; name = ex.name;
    });
    const w = day(ui.date).workout;
    const allDone = w.exercises.every((e) => e.sets.every((x) => x.done));
    if (nowDone && !allDone) startRest(rest, name);
  },
  'set-add': (el) => update((s) => { const ex = s.days[ui.date].workout.exercises[el.dataset.e]; const last = ex.sets[ex.sets.length - 1]; ex.sets.push({ kg: last?.kg ?? '', reps: '', done: false }); }),
  'set-remove': (el) => update((s) => { s.days[ui.date].workout.exercises[el.dataset.e].sets.pop(); }),
  'ex-remove': (el) => { if (confirm('Remove this exercise?')) update((s) => { s.days[ui.date].workout.exercises.splice(Number(el.dataset.e), 1); }); },
  swap: (el) => openSheet({ type: 'swap', e: Number(el.dataset.e) }),
  'swap-pick': (el) => {
    const lib = findExercise(el.dataset.n);
    const ei = ui.sheet.e;
    update((s) => {
      const w = s.days[ui.date].workout;
      const old = w.exercises[ei];
      const fresh = newWorkoutEx({ ...libToPlanEx(lib), sets: old.sets.length, rest: old.rest || 60, id: old.planExId }, ui.date);
      w.exercises[ei] = { ...fresh, planExId: old.planExId };
    });
    closeSheet();
  },
  'ex-add': () => openSheet({ type: 'exadd', q: '' }),
  'ex-pick': (el) => {
    const lib = el.dataset.custom ? null : findExercise(el.dataset.n);
    update((s) => { s.days[ui.date].workout.exercises.push(newWorkoutEx(libToPlanEx(lib, el.dataset.n), ui.date)); });
    closeSheet();
  },
  finish: () => {
    const w = day(ui.date).workout;
    const st = workoutStats(w);
    if (!st.sets) {
      if (!confirm('No sets are ticked yet. Finish and discard this workout?')) return;
      update((s) => { s.days[ui.date].workout = null; });
      ui.timer = null; tickRest();
      go('dashboard');
      return;
    }
    update((s) => {
      const ww = s.days[ui.date].workout;
      if (!ww.finishedAt) { ww.finishedAt = Date.now(); ww.durationMin = Math.max(1, Math.round((ww.finishedAt - ww.startedAt) / 60000)); }
    }, { silent: true });
    ui.timer = null; tickRest();
    toast(`Workout saved · ${plural(st.sets, 'set')}${st.volume ? ` · ${fmt(st.volume)} kg` : ''}`);
    go('dashboard');
  },
  'discard-workout': () => {
    if (!confirm('Discard this workout and its logged sets?')) return;
    update((s) => { s.days[ui.date].workout = null; }, { silent: true });
    ui.timer = null; tickRest();
    go('workouts');
  },
  'rest-add': () => { if (ui.timer) { ui.timer.end += 15000; ui.timer.beeped = false; tickRest(); } },
  'rest-skip': () => { ui.timer = null; tickRest(); },
  history: (el) => openSheet({ type: 'history', date: el.dataset.date }),
  'history-open': (el) => { ui.date = el.dataset.date; closeSheet(); go('session'); },
  'history-del': (el) => {
    if (!confirm('Delete this workout?')) return;
    update((s) => { s.days[el.dataset.date].workout = null; });
    closeSheet();
  },

  // food
  food: (el) => openFood(el.dataset.meal, el.dataset.tab || 'search'),
  'sheet-close': () => closeSheet(),
  'sh-meal': (el) => { ui.sheet.meal = el.dataset.v; renderSheetKeepScan(); },
  'sh-tab': (el) => { closeScanner(); ui.sheet.tab = el.dataset.v; ui.sheet.scanMsg = ''; renderSheet(); },
  'pick-food': (el) => { const f = findFoodById(el.dataset.id); if (f) selectFood(f); },
  'serving-back': () => { ui.sheet.selected = null; renderSheet(); },
  'food-add': () => addFoodEntry(),
  'off-search': async () => {
    const sh = ui.sheet;
    sh.offBusy = true; sh.offErr = '';
    $('#food-results').innerHTML = foodResults();
    try { sh.off = await searchOff(sh.q.trim()); } catch (err) { sh.offErr = err.message; }
    sh.offBusy = false;
    if (ui.sheet === sh && !sh.selected) $('#food-results').innerHTML = foodResults();
  },
  'barcode-lookup': () => { const v = $('#barcode-in').value.trim(); if (v) { closeScanner(); handleBarcode(v); } },
  'ai-food': async () => {
    const sh = ui.sheet;
    sh.aiText = $('#ai-text').value.trim();
    if (!sh.aiText) return;
    sh.aiBusy = true; sh.aiErr = ''; sh.ai = null;
    renderSheet();
    try { sh.ai = await askAi({ task: 'food', text: sh.aiText }); } catch (err) { sh.aiErr = err.message; }
    sh.aiBusy = false;
    if (ui.sheet === sh) renderSheet();
  },
  'ai-add': () => {
    const sh = ui.sheet;
    const items = sh.ai.items.filter((it) => it.on !== false);
    if (!items.length) return;
    const date = ui.date;
    update((s) => {
      const d = s.days[date] || (s.days[date] = { meals: [], plan: null, workout: null });
      for (const it of items) {
        const per100 = it.grams ? 100 / it.grams : 0;
        const food = { id: 'ai_' + uid(), name: it.name, kcal: Math.round(it.kcal * per100), protein: it.protein * per100, carbs: it.carbs * per100, fat: it.fat * per100, units: [], source: 'ai' };
        d.meals.push({ id: uid(), meal: sh.meal, name: it.name, brand: '', grams: it.grams, qty: it.grams, unitIdx: -1, amountLabel: `${fmt(it.grams)} g`, kcal: it.kcal, protein: it.protein, carbs: it.carbs, fat: it.fat, estimate: true, food: per100 ? food : null });
      }
    });
    toast(`Added ${items.length} item${items.length > 1 ? 's' : ''}`);
    closeSheet();
  },
  'man-basis': (el) => { readManual(); ui.sheet.manual.basis = el.dataset.v; renderSheet(); },
  'man-continue': () => {
    readManual();
    const m = ui.sheet.manual;
    const err = (t) => { $('#man-err').textContent = t; };
    if (!m.name) return err('Give the food a name.');
    if (m.kcal === '' || m.kcal == null) return err('Enter calories at least.');
    let k = 1;
    const units = [];
    if (m.basis === 'serving') {
      const sg = Number(m.servingG);
      if (!sg) return err('Enter the serving size in grams.');
      k = 100 / sg;
      units.push({ label: '1 serving', g: sg });
    }
    const food = {
      id: m.barcode ? 'off_' + m.barcode : 'c_' + uid(), barcode: m.barcode || '', name: m.name, brand: m.brand || '',
      kcal: Math.round((Number(m.kcal) || 0) * k), protein: Math.round((Number(m.protein) || 0) * k * 10) / 10,
      carbs: Math.round((Number(m.carbs) || 0) * k * 10) / 10, fat: Math.round((Number(m.fat) || 0) * k * 10) / 10, units, source: 'custom',
    };
    if (m.save !== false) update((s) => { s.foods = [food, ...s.foods.filter((f) => f.id !== food.id)]; }, { silent: true });
    selectFood(food);
  },
  'entry-edit': (el) => {
    const e = day(ui.date).meals.find((x) => x.id === el.dataset.id);
    if (!e) return;
    if (!e.food) { toast('AI estimates can be deleted and re-added, not resized.'); return; }
    openSheet({ type: 'food', meal: e.meal, tab: 'search', q: '', selected: e.food, amount: e.qty, unitIdx: e.unitIdx ?? -1, editId: e.id, manual: {} });
  },
  'entry-del': (el) => update((s) => { const d = s.days[ui.date]; d.meals = d.meals.filter((x) => x.id !== el.dataset.id); }),
  'food-del': (el) => { if (confirm('Remove from My foods?')) update((s) => { s.foods = s.foods.filter((f) => f.id !== el.dataset.id); s.recentFoods = s.recentFoods.filter((f) => f.id !== el.dataset.id); }); },

  // progress / body
  body: () => go('progress'),
  metric: (el) => { ui.progress.metric = el.dataset.v; renderMain(); },
  'body-save': () => {
    const w = $('#bw-w').value.trim();
    const bf = $('#bw-bf').value.trim();
    if (!w && !bf) { toast('Enter your weight', 'bad'); return; }
    update((s) => {
      s.body = s.body.filter((b) => b.date !== ui.date);
      s.body.push({ date: ui.date, weight: w === '' ? '' : Number(w), bodyFat: bf === '' ? '' : Number(bf) });
      if (w && ui.date >= (s.body.filter((b) => b.weight !== '').map((b) => b.date).sort().pop() || '')) s.profile.weightKg = Number(w);
      if (bf) s.profile.bodyFat = Number(bf);
    });
    toast('Saved');
  },
  'body-del': (el) => update((s) => { s.body = s.body.filter((b) => b.date !== el.dataset.date); }),

  // settings
  set: (el) => {
    const path = el.dataset.path;
    let v = el.dataset.v;
    if (/daysPerWeek|defaultMinutes/.test(path)) v = Number(v);
    setPath(path, v);
  },
  'toggle-goal': (el) => update((s) => { const g = s.profile.goals; const v = el.dataset.v; s.profile.goals = g.includes(v) ? g.filter((x) => x !== v) : [...g, v]; }),
  'toggle-eq': (el) => update((s) => { const g = s.profile.equipment; const v = el.dataset.v; s.profile.equipment = g.includes(v) ? g.filter((x) => x !== v) : [...g, v]; }),
  'onboard-done': () => {
    document.activeElement?.blur?.();
    update((s) => {
      s.onboarded = true;
      if (!s.body.length && s.profile.weightKg) s.body.push({ date: ymd(), weight: Number(s.profile.weightKg), bodyFat: '' });
    });
    go('dashboard');
  },
  'ai-test': async () => {
    const el = $('#ai-status');
    el.className = 'small';
    el.textContent = 'Testing…';
    try {
      const r = await askAi({ task: 'ping' }, 30000);
      el.className = 'small ok';
      el.textContent = `Connected. Using ${r.model}.`;
    } catch (err) {
      el.className = 'small err';
      el.textContent = err.message;
    }
  },
  export: () => {
    const blob = new Blob([exportJson()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `fitin-backup-${ymd()}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  },
  reset: () => {
    if (!confirm('Delete all fitin data on this device? Export a backup first if you want to keep it.')) return;
    resetState();
    go('dashboard');
  },
};

function renderSheetKeepScan() {
  // Changing the meal while the camera runs must not restart the camera.
  if (ui.sheet?.tab === 'scan' && !ui.sheet.selected && ui.scanStop) {
    document.querySelectorAll('[data-act="sh-meal"]').forEach((b) => b.classList.toggle('on', b.dataset.v === ui.sheet.meal));
    return;
  }
  renderSheet();
}

function readManual() {
  const m = ui.sheet.manual;
  document.querySelectorAll('[data-man]').forEach((i) => { m[i.dataset.man] = i.value.trim(); });
  const sv = $('[data-man-save]');
  if (sv) m.save = sv.checked;
}

function setPath(path, value, silent = false) {
  update((s) => {
    const keys = path.split('.');
    let o = s;
    while (keys.length > 1) o = o[keys.shift()];
    o[keys[0]] = value;
  }, { silent });
}

// ============ events ============
document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-act]');
  if (!el) return;
  const fn = actions[el.dataset.act];
  if (!fn) return;
  if (el.tagName === 'A') ev.preventDefault();
  fn(el, ev);
});

document.addEventListener('input', (ev) => {
  const t = ev.target;
  if (t.dataset.set) {
    const [ei, si, field] = t.dataset.set.split(':');
    update((s) => { s.days[ui.date].workout.exercises[ei].sets[si][field] = t.value; }, { silent: true });
  } else if (t.id === 'food-q') {
    ui.sheet.q = t.value;
    ui.sheet.off = null; ui.sheet.offErr = '';
    $('#food-results').innerHTML = foodResults();
  } else if (t.id === 'ex-q') {
    ui.sheet.q = t.value;
    $('#ex-results').innerHTML = exResults();
  } else if (t.id === 'amt') {
    ui.sheet.amount = t.value;
    $('#macro-sum').innerHTML = macroSum(scaleFood(ui.sheet.selected, servingGrams()), servingGrams());
  } else if (t.dataset.ui === 'planner.note') {
    ui.planner.note = t.value;
  } else if (t.id === 'ai-text') {
    ui.sheet.aiText = t.value;
  }
});

document.addEventListener('change', async (ev) => {
  const t = ev.target;
  if (t.dataset.bind) {
    let v = t.type === 'checkbox' ? t.checked : t.value;
    if (t.dataset.type === 'num') v = v === '' ? '' : Number(v);
    if (t.type === 'checkbox') { setPath(t.dataset.bind, v); return; }
    // Text fields: save now, redraw once the person stops typing in fields (keeps focus when tabbing).
    setPath(t.dataset.bind, v, true);
    setTimeout(() => { if (!document.activeElement?.matches('input, textarea, select')) renderMain(); }, 0);
  } else if (t.dataset.actChange === 'range') {
    ui.progress.range = t.value === 'all' ? 'all' : Number(t.value);
    renderMain();
  } else if (t.dataset.actChange === 'pl-min-input') {
    const v = Math.min(180, Math.max(10, Number(t.value) || 45));
    ui.planner.minutes = v; ui.planner.draft = null;
    renderMain();
  } else if (t.id === 'unit') {
    const sh = ui.sheet;
    const prevG = servingGrams();
    sh.unitIdx = Number(t.value);
    // Keep the same grams when switching units.
    sh.amount = sh.unitIdx >= 0 ? Math.round((prevG / sh.selected.units[sh.unitIdx].g) * 100) / 100 : Math.round(prevG);
    renderSheet();
  } else if (t.dataset.aiItem != null) {
    ui.sheet.ai.items[Number(t.dataset.aiItem)].on = t.checked;
  } else if (t.id === 'scan-file' && t.files?.[0]) {
    closeScanner();
    const msg = $('#scan-msg');
    if (msg) msg.textContent = 'Reading the photo…';
    try {
      const code = await scanImage('scan-region', t.files[0]);
      handleBarcode(code);
    } catch {
      if (msg) msg.textContent = 'No barcode found in that photo. Try a closer, sharper shot, or type the number.';
    }
  } else if (t.id === 'import-file' && t.files?.[0]) {
    try {
      const data = JSON.parse(await t.files[0].text());
      if (!data || typeof data !== 'object' || !data.profile) throw new Error('bad');
      if (!confirm('Replace the data on this device with this backup?')) return;
      replaceState(data);
      toast('Backup imported');
    } catch {
      toast('That file is not a fitin backup', 'bad');
    }
  }
});

document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape' && ui.sheet) closeSheet();
  if (ev.key === 'Enter' && ev.target.id === 'barcode-in') actions['barcode-lookup']();
});

window.addEventListener('hashchange', () => { closeSheet(); renderMain(); window.scrollTo(0, 0); });

subscribe(() => renderMain());

// ============ boot ============
shell();
renderMain();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
