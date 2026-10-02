// fitin badge engine: rank (consistency), streak fire, goal weight, special and milestone badges.
// Everything is worked out from the logs already on the device, so it never drifts out of sync.

import { getState, update, ymd, addDays, parseYmd, weekStart, day, dayTotals, workoutStats, isWorkoutDone } from './store.js';
import { activeTargets } from './nutrition.js';

const IMG = (f) => `/img/badges/${f}.webp`;

// ---------- definitions ----------
export const RANKS = [
  { id: 'novice', name: 'Novice', days: 0, tag: 'Every journey begins here.', color: '#d08a5a' },
  { id: 'beginner', name: 'Beginner', days: 7, tag: 'Building better habits.', color: '#cfd6dc' },
  { id: 'active', name: 'Active', days: 30, tag: 'Showing up consistently.', color: '#5fd08a' },
  { id: 'dedicated', name: 'Dedicated', days: 60, tag: 'Making it a lifestyle.', color: '#5aa2f0' },
  { id: 'pro', name: 'Pro', days: 90, tag: 'Strong habits. Real progress.', color: '#a77bf3' },
  { id: 'elite', name: 'Elite', days: 180, tag: 'Built different. Few get here.', color: '#e9bd4c' },
  { id: 'legend', name: 'Legend', days: 365, tag: 'Unstoppable. A true inspiration.', color: '#ef5656' },
].map((r) => ({ ...r, img: IMG('rank_' + r.id), bg: `/img/bg/r_${r.id}.webp` }));

export const FIRE_TIERS = [3, 7, 14, 30, 60, 90, 180, 365];
export const fireImg = (n) => IMG('fire_' + n);
/** Image for the current streak: the highest tier reached (the 3-day flame below 3 days). */
export const fireFor = (streak) => fireImg([...FIRE_TIERS].reverse().find((t) => streak >= t) || 3);

export const DROP_AFTER = 4; // days with no check-in before the rank drops one level

const B = (id, cat, name, desc, img) => ({ id, cat, name, desc, img: IMG(img) });
export const BADGES = [
  B('goal', 'special', 'Goal Achieved', 'Reached your goal weight.', 'goal_big'),
  B('first_workout', 'workouts', 'First Workout', 'Completed your first workout.', 'sp_first_workout'),
  B('first_meal', 'nutrition', 'First Meal', 'Logged your first meal.', 'sp_first_meal'),
  B('hero7', 'streaks', '7-Day Hero', 'Checked in 7 days in a row.', 'sp_hero7'),
  B('month1', 'streaks', '1 Month Strong', 'Checked in 30 days in a row.', 'sp_month1'),
  B('month2', 'streaks', '2 Month Warrior', 'Checked in 60 days in a row.', 'sp_month2'),
  B('month3', 'streaks', '3 Month Beast', 'Checked in 90 days in a row.', 'sp_month3'),
  B('perfect_week', 'special', 'Perfect Week', 'Hit every planned workout and logged food all 7 days.', 'sp_perfect_week'),
  B('comeback', 'special', 'Comeback', 'Got back on track after a break of 4+ days.', 'sp_comeback'),
  B('early_bird', 'workouts', 'Early Bird', 'Started a workout before 8 AM.', 'sp_early_bird'),
  B('night_owl', 'workouts', 'Night Owl', 'Started a workout after 9 PM.', 'sp_night_owl'),
  B('w10', 'workouts', '10 Workouts', 'Completed 10 workouts.', 'ms_w10'),
  B('w50', 'workouts', '50 Workouts', 'Completed 50 workouts.', 'ms_w50'),
  B('w100', 'workouts', '100 Workouts', 'Completed 100 workouts.', 'ms_w100'),
  B('m100', 'nutrition', '100 Meals', 'Logged 100 foods.', 'ms_m100'),
  B('m500', 'nutrition', '500 Meals', 'Logged 500 foods.', 'ms_m500'),
  B('weight_loss', 'special', 'Weight Loss', 'Lost 5 kg from your first weigh-in.', 'ms_weight_loss'),
  B('strength', 'workouts', 'Strength Gain', 'Beat your first session on a lift by 10% or more.', 'ms_strength'),
  B('deficit', 'nutrition', 'Calorie Deficit', 'Stayed within your calorie target on 30 logged days.', 'ms_deficit'),
  B('protein', 'nutrition', 'Protein Streak', 'Hit your protein target on 30 days.', 'ms_protein'),
  ...FIRE_TIERS.map((n) => ({ id: 'fire' + n, cat: 'streaks', name: `${n}-Day Streak`, desc: `Kept a ${n} day check-in streak.`, img: fireImg(n), fire: n })),
];

// ---------- helpers ----------
const hasFood = (d) => (d.meals || []).length > 0;
const hasSets = (d) => workoutStats(d.workout).sets > 0;
const weighedOn = (date) => getState().body.some((b) => b.date === date && b.weight !== '' && b.weight != null);
/** A check-in is any meal, weigh-in or workout logged that day. */
export const checkedIn = (date) => {
  const d = day(date);
  return hasFood(d) || hasSets(d) || weighedOn(date);
};

function firstDate(state) {
  const dates = Object.keys(state.days).filter((k) => {
    const d = state.days[k];
    return hasFood(d) || hasSets(d);
  });
  for (const b of state.body) if (b.weight !== '' && b.weight != null) dates.push(b.date);
  return dates.length ? dates.sort()[0] : null;
}

export const levelOf = (points) => {
  let l = 0;
  RANKS.forEach((r, i) => { if (points >= r.days) l = i; });
  return l;
};

// ---------- rank ----------
/**
 * Consistent days = days with food logged, in weeks where you also hit your workout target.
 * The current week counts provisionally until Sunday. Every 4 days in a row without any
 * check-in drops you one level.
 */
export function computeRank(state, today = ymd()) {
  const start = firstDate(state);
  const target = Math.max(1, Number(state.profile.daysPerWeek) || 4);
  const empty = { points: 0, level: 0, reached: { 0: today }, week: { workouts: 0, target, foodDays: 0, credited: 0 }, idle: 0, drops: [], peak: 0 };
  if (!start) return empty;

  let points = 0, credited = 0, workouts = 0, foodDays = 0, idle = 0, peak = 0;
  let weekFrom = start;
  const reached = { 0: start };
  const drops = [];

  const closeWeek = (endDate) => {
    // Prorate the target for a first, partial week.
    const daysIn = Math.round((parseYmd(endDate) - parseYmd(weekFrom)) / 864e5) + 1;
    const need = daysIn >= 7 ? target : Math.floor((target * daysIn) / 7);
    if (workouts < need) points = Math.max(0, points - credited);
  };

  for (let d = start; d <= today; d = addDays(d, 1)) {
    if (d !== start && parseYmd(d).getDay() === 1) {
      closeWeek(addDays(d, -1));
      credited = 0; workouts = 0; foodDays = 0; weekFrom = d;
    }
    const dd = day(d);
    const active = checkedIn(d);
    if (isWorkoutDone(dd.workout) || hasSets(dd)) workouts++;
    if (hasFood(dd)) { points++; credited++; foodDays++; }

    if (active) idle = 0;
    else if (d !== today) {
      idle++;
      if (idle % DROP_AFTER === 0) {
        const lvl = levelOf(points);
        const to = Math.max(0, lvl - 1);
        if (points > 0) drops.push({ date: d, from: lvl, to });
        points = RANKS[to].days;
        credited = 0; // these days are already settled by the drop
      }
    }
    const lvl = levelOf(points);
    peak = Math.max(peak, lvl);
    for (let i = 0; i <= lvl; i++) if (!reached[i]) reached[i] = d;
  }
  const level = levelOf(points);
  return { points, level, reached, peak, drops, idle, week: { workouts, target, foodDays, credited } };
}

// ---------- streak ----------
export function computeStreak(state, today = ymd()) {
  const start = firstDate(state);
  if (!start) return { current: 0, best: 0, hitDates: {}, alive: false };
  let run = 0, best = 0;
  const hitDates = {}; // streak length -> first date it was reached
  for (let d = start; d <= today; d = addDays(d, 1)) {
    if (checkedIn(d)) {
      run++;
      if (!hitDates[run]) hitDates[run] = d;
    } else if (d !== today) run = 0;
    best = Math.max(best, run);
  }
  const doneToday = checkedIn(today);
  return { current: run, best, hitDates, doneToday, alive: run > 0 };
}

// ---------- goal weight ----------
export function goalInfo(state) {
  const p = state.profile;
  const weights = [...state.body].filter((b) => b.weight !== '' && b.weight != null).sort((a, b) => (a.date < b.date ? -1 : 1));
  const current = weights.length ? Number(weights[weights.length - 1].weight) : Number(p.weightKg) || 0;
  const goal = Number(p.goalWeight) || 0;
  if (!goal) return { set: false, current };
  const startW = Number(p.goalStartWeight) || current;
  const losing = goal < startW;
  const reachedEntry = weights.find((b) => b.date >= (p.goalSetAt || '0000') && (losing ? b.weight <= goal : b.weight >= goal));
  const total = Math.abs(startW - goal) || 1;
  const left = losing ? Math.max(0, current - goal) : Math.max(0, goal - current);
  const pct = Math.min(100, Math.max(0, Math.round(((total - left) / total) * 100)));
  return { set: true, current, goal, start: startW, losing, left, pct, reachedDate: reachedEntry?.date || null };
}

// ---------- everything ----------
function nthDate(list, n) {
  return list.length >= n ? list[n - 1] : null;
}

export function evaluate(state = getState(), today = ymd()) {
  const rank = computeRank(state, today);
  const streak = computeStreak(state, today);
  const goal = goalInfo(state);
  const t = activeTargets(state);

  const dates = Object.keys(state.days).sort();
  const workoutDates = [];
  const mealDates = []; // one entry per food logged
  let early = null, night = null, perfect = null, deficitDays = 0, deficit = null, proteinDays = 0, protein = null;
  const lifts = new Map(); // exercise -> {first, best, n, date}
  let strength = null;

  for (const d of dates) {
    const dd = state.days[d];
    for (let i = 0; i < (dd.meals || []).length; i++) mealDates.push(d);
    if (hasSets(dd)) {
      workoutDates.push(d);
      const h = dd.workout.startedAt ? new Date(dd.workout.startedAt).getHours() : 12;
      if (h < 8 && !early) early = d;
      if (h >= 21 && !night) night = d;
      for (const ex of dd.workout.exercises) {
        const sets = ex.sets.filter((s) => s.done && Number(s.reps));
        if (!sets.length) continue;
        const score = Math.max(...sets.map((s) => (ex.loaded && Number(s.kg) ? Number(s.kg) * (1 + Number(s.reps) / 30) : Number(s.reps))));
        const L = lifts.get(ex.name) || { first: score, best: score, n: 0, weighted: ex.loaded };
        L.n++;
        L.best = Math.max(L.best, score);
        lifts.set(ex.name, L);
        if (!strength && L.n >= 3 && L.best >= L.first * 1.1) strength = d;
      }
    }
    if (hasFood(dd) && d < today) {
      const tot = dayTotals(d);
      if (tot.kcal >= t.kcal * 0.6 && tot.kcal <= t.kcal) { deficitDays++; if (deficitDays === 30) deficit = d; }
      if (tot.protein >= t.protein * 0.95) { proteinDays++; if (proteinDays === 30) protein = d; }
    }
  }

  // Perfect week: a finished Mon–Sun week with every planned workout and food on all 7 days.
  const target = Math.max(1, Number(state.profile.daysPerWeek) || 4);
  if (dates.length) {
    for (let w = weekStart(dates[0]); addDays(w, 6) < today; w = addDays(w, 7)) {
      let wk = 0, food = 0;
      for (let i = 0; i < 7; i++) {
        const dd = day(addDays(w, i));
        if (hasSets(dd)) wk++;
        if (hasFood(dd)) food++;
      }
      if (wk >= target && food === 7) { perfect = addDays(w, 6); break; }
    }
  }

  // Comeback: a check-in after 4+ days with none.
  let comeback = null;
  const start = firstDate(state);
  if (start) {
    let gap = 0, seen = false;
    for (let d = start; d <= today; d = addDays(d, 1)) {
      if (checkedIn(d)) {
        if (seen && gap >= DROP_AFTER) { comeback = d; break; }
        seen = true; gap = 0;
      } else gap++;
    }
  }

  // Weight loss: 5 kg below the first weigh-in.
  const weights = [...state.body].filter((b) => b.weight !== '' && b.weight != null).sort((a, b) => (a.date < b.date ? -1 : 1));
  const lost = weights.length ? weights.find((b) => b.weight <= weights[0].weight - 5)?.date || null : null;

  const computed = {
    goal: goal.reachedDate,
    first_workout: workoutDates[0] || null,
    first_meal: mealDates[0] || null,
    hero7: streak.hitDates[7] || null,
    month1: streak.hitDates[30] || null,
    month2: streak.hitDates[60] || null,
    month3: streak.hitDates[90] || null,
    perfect_week: perfect,
    comeback,
    early_bird: early,
    night_owl: night,
    w10: nthDate(workoutDates, 10),
    w50: nthDate(workoutDates, 50),
    w100: nthDate(workoutDates, 100),
    m100: nthDate(mealDates, 100),
    m500: nthDate(mealDates, 500),
    weight_loss: lost,
    strength,
    deficit,
    protein,
  };
  for (const n of FIRE_TIERS) computed['fire' + n] = streak.hitDates[n] || null;

  // Earned badges stay earned, even if the logs that earned them are later edited.
  const log = state.badgeLog || {};
  const badges = BADGES.map((b) => {
    const date = log[b.id] || computed[b.id] || null;
    return { ...b, unlocked: Boolean(date), date };
  });
  const rankBadges = RANKS.map((r, i) => ({ ...r, index: i, unlocked: Boolean(rank.reached[i]), date: rank.reached[i] || null, current: i === rank.level }));

  return { rank, streak, goal, badges, rankBadges };
}

/**
 * Save newly earned badges and return the ones not celebrated yet.
 * Rank-ups are celebrated too (id "rank:<id>").
 */
export function collectNew(result) {
  const state = getState();
  const log = { ...(state.badgeLog || {}) };
  const seen = new Set(state.seenBadges || []);
  const fresh = [];
  let changed = false;
  for (const b of result.badges) {
    if (b.unlocked && !log[b.id]) { log[b.id] = b.date; changed = true; }
    if (b.unlocked && !seen.has(b.id)) fresh.push({ id: b.id, name: b.name, desc: b.desc, img: b.img, kind: 'badge' });
  }
  for (const r of result.rankBadges) {
    const id = 'rank:' + r.id;
    if (r.index > 0 && r.unlocked && !seen.has(id)) fresh.push({ id, name: r.name, desc: r.tag, img: r.img, kind: 'rank' });
  }
  if (changed) update((s) => { s.badgeLog = log; }, { silent: true });
  return fresh;
}

export function markSeen(ids) {
  update((s) => { s.seenBadges = [...new Set([...(s.seenBadges || []), ...ids])]; }, { silent: true });
}

/** On first run after this update, treat existing badges as already seen so old progress doesn't spam popups. */
export function primeSeen() {
  const state = getState();
  if (state.seenBadges && state.seenBadges.length) return;
  const r = evaluate(state);
  const ids = [...r.badges.filter((b) => b.unlocked).map((b) => b.id), ...r.rankBadges.filter((b) => b.unlocked).map((b) => 'rank:' + b.id)];
  update((s) => { s.seenBadges = ids.length ? ids : ['_']; }, { silent: true });
  collectNew(r);
}
