// Rule-based session planner: picks a day type from the weekly rotation,
// then fills the available minutes in priority order.

import { candidates, findExercise } from './exercises.js';
import { uid, workoutHistory } from './store.js';

export const FOCUS = {
  pull_arm: { title: 'Pull + Arm Day', alt: 'Pull Day', tags: ['Back', 'Biceps', 'Forearms'], altTags: ['Back', 'Biceps', 'Core'] },
  push_skill: { title: 'Push + Skills', alt: 'Push Day', tags: ['Chest', 'Shoulders', 'Triceps'] },
  legs_core: { title: 'Legs + Core', tags: ['Legs', 'Glutes', 'Core'] },
  arm_spec: { title: 'Armwrestling Day', tags: ['Wrist', 'Hand', 'Elbow'] },
  full: { title: 'Full Body', tags: ['Full body', 'Core'] },
  cond: { title: 'Conditioning', tags: ['Engine', 'Core'] },
};

const TEMPLATES = {
  pull_arm: [
    { role: 'primary', p: 'vpull' },
    { role: 'secondary', p: 'hpull' },
    { role: 'arm', p: 'pronation', goal: 'armwrestling' },
    { role: 'arm', p: 'cup', goal: 'armwrestling' },
    { role: 'accessory', p: 'biceps' },
    { role: 'arm', p: 'rising', goal: 'armwrestling' },
    { role: 'accessory', p: 'rear' },
    { role: 'core', p: 'core' },
    { role: 'finisher', p: 'cond', goal: 'fatloss' },
  ],
  push_skill: [
    { role: 'skill', p: 'skill_push', goal: 'calisthenics' },
    { role: 'primary', p: 'hpush' },
    { role: 'secondary', p: 'vpush' },
    { role: 'arm', p: 'sidepressure', goal: 'armwrestling' },
    { role: 'accessory', p: 'triceps' },
    { role: 'core', p: 'core_static' },
    { role: 'accessory', p: 'rear' },
    { role: 'finisher', p: 'cond', goal: 'fatloss' },
  ],
  legs_core: [
    { role: 'primary', p: 'squat' },
    { role: 'secondary', p: 'hinge' },
    { role: 'accessory', p: 'single_leg' },
    { role: 'carry', p: 'carry' },
    { role: 'core', p: 'core' },
    { role: 'core', p: 'core_static' },
    { role: 'accessory', p: 'calf' },
    { role: 'finisher', p: 'cond', goal: 'fatloss' },
  ],
  arm_spec: [
    { role: 'table', p: 'table' },
    { role: 'armHeavy', p: 'pronation' },
    { role: 'armHeavy', p: 'cup' },
    { role: 'armHeavy', p: 'rising' },
    { role: 'arm', p: 'backpressure' },
    { role: 'arm', p: 'sidepressure' },
    { role: 'arm', p: 'fingers' },
    { role: 'accessory', p: 'biceps' },
    { role: 'arm', p: 'supination' },
    { role: 'carry', p: 'carry' },
  ],
  full: [
    { role: 'primary', p: 'vpull' },
    { role: 'primary', p: 'hpush' },
    { role: 'secondary', p: 'squat' },
    { role: 'arm', p: 'pronation', goal: 'armwrestling' },
    { role: 'secondary', p: 'hinge' },
    { role: 'core', p: 'core' },
    { role: 'accessory', p: 'hpull' },
    { role: 'finisher', p: 'cond', goal: 'fatloss' },
  ],
  cond: [
    { role: 'circuit', p: 'cond' },
    { role: 'accessory', p: 'hpush' },
    { role: 'accessory', p: 'hpull' },
    { role: 'core', p: 'core' },
    { role: 'accessory', p: 'single_leg' },
    { role: 'core', p: 'core_static' },
  ],
};

export function rotation(profile) {
  const g = profile.goals || [];
  const aw = g.includes('armwrestling');
  const fl = g.includes('fatloss');
  const d = Math.min(6, Math.max(2, Number(profile.daysPerWeek) || 4));
  const map = {
    2: ['full', 'full'],
    3: ['pull_arm', 'push_skill', 'legs_core'],
    4: ['pull_arm', 'push_skill', 'legs_core', aw ? 'arm_spec' : 'full'],
    5: ['pull_arm', 'push_skill', 'legs_core', aw ? 'arm_spec' : 'full', fl ? 'cond' : 'full'],
    6: ['pull_arm', 'push_skill', 'legs_core', aw ? 'arm_spec' : 'full', 'full', fl ? 'cond' : 'push_skill'],
  };
  return map[d];
}

export function nextFocus(profile, beforeDate) {
  const rot = rotation(profile);
  const last = workoutHistory().find((h) => h.date < beforeDate && h.workout.focus);
  if (!last) return rot[0];
  const i = rot.indexOf(last.workout.focus);
  return i < 0 ? rot[0] : rot[(i + 1) % rot.length];
}

export const focusTitle = (focus, profile) => {
  const f = FOCUS[focus] || FOCUS.full;
  const aw = (profile.goals || []).includes('armwrestling');
  return focus === 'pull_arm' && !aw ? f.alt : f.title;
};

// ---------- seeded randomness for variety ----------
function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function rng(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- timing ----------
const top = (reps) => {
  const nums = String(reps).match(/\d+/g);
  return nums ? Number(nums[nums.length - 1]) : 10;
};

export function exerciseSeconds(ex) {
  if (ex.unit === 'min') return top(ex.reps) * 60 + 30;
  const work = ex.unit === 'sec' ? top(ex.reps) : Math.min(60, Math.max(20, top(ex.reps) * 3));
  const perSet = work * (ex.side ? 2 : 1);
  return ex.sets * perSet + Math.max(0, ex.sets - 1) * ex.rest + 45; // + setup/transition
}

function roleScheme(role, ex, goals, level) {
  const strength = goals.includes('strength');
  const fatloss = goals.includes('fatloss');
  let s;
  switch (role) {
    case 'primary':
      s = strength && ex.loaded && level >= 2 ? { sets: 4, reps: '4-6', rest: 150 } : { sets: 4, reps: '6-8', rest: 120 };
      break;
    case 'secondary': s = { sets: 3, reps: '8-10', rest: 90 }; break;
    case 'skill': s = { sets: 4, reps: '15-30', rest: 60 }; break;
    case 'armHeavy': s = { sets: 4, reps: '6-10', rest: 90 }; break;
    case 'arm': s = { sets: 3, reps: '10-15', rest: 60 }; break;
    case 'core': s = { sets: 3, reps: '10-15', rest: 45 }; break;
    case 'carry': s = { sets: 3, reps: '30-40', rest: 60 }; break;
    case 'table': s = { sets: 4, reps: '3-5 goes', rest: 90 }; break;
    case 'finisher': s = { sets: 1, reps: '8', rest: 0 }; break;
    case 'circuit': s = { sets: 1, reps: '12', rest: 0 }; break;
    default: s = { sets: 3, reps: '10-12', rest: 60 };
  }
  if (ex.r && role !== 'finisher' && role !== 'circuit') s.reps = ex.r;
  if (ex.unit === 'min' && role !== 'finisher' && role !== 'circuit') { s.sets = 1; s.rest = 0; s.reps = ex.r || '8'; }
  if (ex.unit === 'sec' && !ex.r) s.reps = '20-30';
  if (fatloss && s.rest > 45) s.rest = Math.round((s.rest * 0.8) / 15) * 15;
  return s;
}

function warmupFor(focus, equip, minutes) {
  const list = [{ name: 'Easy cardio: jumping jacks or jog on the spot', dose: '2 min' }];
  list.push({ name: equip.includes('band') ? 'Arm circles + band pull-aparts' : 'Arm circles, both directions', dose: '2 x 15' });
  if (['pull_arm', 'arm_spec', 'full', 'push_skill'].includes(focus)) {
    list.push({ name: 'Wrist circles, wrist rocks, finger stretches', dose: '1 min' });
  }
  if (['pull_arm', 'arm_spec', 'full'].includes(focus)) {
    list.push({ name: 'Light pronation and supination, no load or light band', dose: '2 x 15 each arm' });
    if (equip.includes('bar')) list.push({ name: 'Scapular pull-ups', dose: '1 x 10' });
  }
  if (focus === 'push_skill') list.push({ name: 'Scapular push-ups + wrist prep on the floor', dose: '1 x 10' });
  if (['legs_core', 'full', 'cond'].includes(focus)) list.push({ name: 'Bodyweight squats + hip openers', dose: '1 x 15' });
  list.push({ name: 'Ramp-up sets of your first exercise', dose: '2 light sets' });
  const count = minutes <= 25 ? 3 : minutes <= 45 ? 4 : 6;
  return { items: list.slice(0, count), seconds: (minutes <= 25 ? 4 : minutes <= 45 ? 6 : 8) * 60 };
}

const LEVEL = { beginner: 1, intermediate: 2, advanced: 3 };

/**
 * Build a session.
 * @param {object} profile
 * @param {{ minutes: number, focus?: string, date: string, shuffle?: number }} opts
 */
export function buildPlan(profile, { minutes, focus, date, shuffle = 0 }) {
  const goals = profile.goals || [];
  const equip = ['none', ...(profile.equipment || [])];
  const level = LEVEL[profile.experience] || 2;
  const aw = goals.includes('armwrestling');
  let f = focus && focus !== 'auto' ? focus : nextFocus(profile, date);
  if (f === 'arm_spec' && !aw) f = 'full';

  const rand = rng(hash(`${date}|${f}|${shuffle}`));
  const warm = warmupFor(f, equip, minutes);
  let budget = minutes * 60 - warm.seconds;
  const chosen = [];
  const used = new Set();

  const pick = (pattern) => {
    const list = candidates(pattern, equip, level).filter((e) => !used.has(e.n));
    if (!list.length) return null;
    const scored = list.map((e) => {
      let s = rand() * 1.2;
      if (goals.includes('calisthenics') && e.cali) s += 1.5;
      if (goals.includes('strength') && e.loaded) s += 0.8;
      if (e.eq.includes('handle') || e.eq.includes('table')) s += 1; // the right tool beats a band
      if (e.eq.length === 1 && e.eq[0] === 'band') s -= 0.4;
      return { e, s };
    });
    scored.sort((a, b) => b.s - a.s);
    return scored[0].e;
  };

  for (const slot of TEMPLATES[f]) {
    if (slot.goal && !goals.includes(slot.goal)) continue;
    const ex = pick(slot.p);
    if (!ex) continue;
    const scheme = roleScheme(slot.role, ex, goals, level);
    const item = {
      id: uid(),
      name: ex.n,
      role: slot.role,
      sets: scheme.sets,
      reps: scheme.reps,
      rest: scheme.rest,
      unit: ex.unit,
      loaded: ex.loaded,
      side: ex.side,
      notes: ex.cue || '',
    };

    if (item.unit === 'min') {
      // Time blocks shrink to whatever fits, minimum 5 minutes.
      const fit = Math.floor((budget - 30) / 60);
      if (fit < 5) continue;
      item.reps = String(Math.min(top(item.reps), fit));
      budget -= exerciseSeconds(item);
    } else {
      const minSets = 2;
      while (item.sets > minSets && exerciseSeconds(item) > budget) item.sets--;
      if (exerciseSeconds(item) > budget) continue;
      budget -= exerciseSeconds(item);
    }
    chosen.push(item);
    used.add(ex.n);
  }

  // Spare time: add a set to the main lifts.
  for (const role of ['primary', 'secondary', 'armHeavy']) {
    for (const item of chosen.filter((c) => c.role === role)) {
      const before = exerciseSeconds(item);
      if (item.sets >= 5) continue;
      item.sets++;
      const extra = exerciseSeconds(item) - before;
      if (extra > budget) item.sets--;
      else budget -= extra;
    }
  }

  const est = Math.round((minutes * 60 - budget) / 60);
  const fm = FOCUS[f];
  return {
    id: uid(),
    date,
    focus: f,
    title: focusTitle(f, profile),
    tags: f === 'pull_arm' && !aw ? fm.altTags : fm.tags,
    minutes,
    estMinutes: est,
    source: 'rules',
    warmup: warm.items,
    exercises: chosen,
    coachNote: coachNote(f, goals),
    createdAt: Date.now(),
  };
}

function coachNote(f, goals) {
  const bits = {
    pull_arm: 'Pulling strength carries straight to the table. Keep the arm work controlled and leave a rep or two in reserve.',
    push_skill: 'Balance out all the pulling. Skill work first while you are fresh.',
    legs_core: 'Legs and core are your base for driving into the pad. Grip work here without stressing the elbow.',
    arm_spec: 'Tendon day: steady loads, full control. Stop if the elbow or inner forearm feels sharp.',
    full: 'Hit everything once with quality reps.',
    cond: 'Keep the pace steady. This is for fat loss and work capacity, not a max-out day.',
  };
  let n = bits[f] || '';
  if (goals.includes('fatloss') && f !== 'cond') n += ' Short rests to keep the heart rate up.';
  return n.trim();
}

// ---------- progression ----------
export function lastPerformance(name, beforeDate) {
  const key = name.toLowerCase();
  for (const h of workoutHistory()) {
    if (h.date >= beforeDate) continue;
    const ex = h.workout.exercises.find((e) => e.name.toLowerCase() === key);
    if (!ex) continue;
    const done = ex.sets.filter((s) => s.done);
    if (done.length) return { date: h.date, sets: done, target: ex };
  }
  return null;
}

export function suggestion(ex, beforeDate) {
  const last = lastPerformance(ex.name, beforeDate);
  if (!last) return null;
  const t = top(ex.reps);
  const reps = last.sets.map((s) => Number(s.reps) || 0);
  const allTop = last.sets.length >= Math.min(ex.sets, last.target.sets.length) && reps.every((r) => r >= t);
  const unit = ex.unit === 'sec' ? 's' : '';
  const repsTxt = reps.map((r) => r + unit).join(', ');
  if (ex.loaded) {
    const kg = Math.max(...last.sets.map((s) => Number(s.kg) || 0));
    const lib = findExercise(ex.name);
    const small = lib && ['pronation', 'supination', 'cup', 'rising', 'fingers', 'biceps', 'triceps', 'rear', 'backpressure', 'sidepressure'].includes(lib.p);
    const big = lib && ['squat', 'hinge'].includes(lib.p) && lib.eq.includes('bb');
    const inc = small ? 1 : big ? 5 : 2.5;
    if (!kg) return { text: `Last: ${repsTxt}`, kg: '' };
    return allTop
      ? { text: `Last: ${kg} kg x ${repsTxt}. You hit the top, try ${kg + inc} kg.`, kg: kg + inc }
      : { text: `Last: ${kg} kg x ${repsTxt}. Stay at ${kg} kg and beat your reps.`, kg };
  }
  return allTop
    ? { text: `Last: ${repsTxt}. Top of the range: use a harder variation or add weight.`, kg: '' }
    : { text: `Last: ${repsTxt}. Aim for one more ${ex.unit === 'sec' ? 'few seconds' : 'rep'} per set.`, kg: '' };
}
