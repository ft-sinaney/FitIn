// Micronutrients: definitions, daily targets, per-food values and daily totals.
// Targets are adult (19–50) recommended intakes from the US National Institutes of Health.
// Food values are typical per-100 g figures (USDA FoodData Central where it has the food,
// otherwise estimates for home-style recipes) and are approximate.

import { day } from './store.js';

const T = (male, female) => (p) => (p.sex === 'female' ? female : male);

export const MICROS = [
  { key: 'fiber', name: 'Fiber', unit: 'g', dp: 1, kind: 'goal', target: (p, kcal) => Math.round((kcal / 1000) * 14), why: 'Keeps digestion regular, steadies blood sugar and keeps you full on a calorie deficit.', sources: 'Oats, chana, rajma, dal, vegetables, fruit, whole-wheat chapati' },
  { key: 'sugar', name: 'Sugar', unit: 'g', dp: 1, kind: 'limit', target: (p, kcal) => Math.round((kcal * 0.1) / 4), why: 'Total sugar, including natural sugar in fruit and milk. The guide line is 10% of your calories, the usual limit for added sugar.', sources: 'Sweets, soft drinks, chaya with sugar, fruit juices' },
  { key: 'sodium', name: 'Sodium', unit: 'mg', dp: 0, kind: 'limit', target: () => 2300, why: 'Needed for fluid balance and muscle contraction; too much raises blood pressure. Heavy sweaters lose more.', sources: 'Salt, pickles, papad, fried snacks, packaged foods' },
  { key: 'potassium', name: 'Potassium', unit: 'mg', dp: 0, kind: 'goal', target: T(3400, 2600), why: 'Balances sodium, supports blood pressure and muscle and nerve function.', sources: 'Banana, nendran, potato, coconut water, dal, curd' },
  { key: 'calcium', name: 'Calcium', unit: 'mg', dp: 0, kind: 'goal', target: () => 1000, why: 'Bones and teeth, and every muscle contraction.', sources: 'Milk, curd, paneer, small fish with bones (mathi), ragi' },
  { key: 'iron', name: 'Iron', unit: 'mg', dp: 1, kind: 'goal', target: T(8, 18), why: 'Carries oxygen in the blood; low iron makes training feel harder.', sources: 'Beef, chicken liver, eggs, chana, rajma, spinach, soya. Vitamin C with the meal helps absorption.' },
  { key: 'magnesium', name: 'Magnesium', unit: 'mg', dp: 0, kind: 'goal', target: T(400, 310), why: 'Muscle and nerve function, energy production and sleep quality.', sources: 'Nuts, seeds, oats, whole wheat, soya, dark greens' },
  { key: 'zinc', name: 'Zinc', unit: 'mg', dp: 1, kind: 'goal', target: T(11, 8), why: 'Immunity, wound healing and testosterone production.', sources: 'Beef, chicken, eggs, peanuts, oats, soya chunks' },
  { key: 'vitA', name: 'Vitamin A', unit: 'µg', dp: 0, kind: 'goal', target: T(900, 700), why: 'Eyesight, skin and immunity.', sources: 'Sweet potato, carrot, mango, papaya, eggs, ghee, greens' },
  { key: 'vitC', name: 'Vitamin C', unit: 'mg', dp: 0, kind: 'goal', target: T(90, 75), why: 'Immunity, tendon and collagen health, and iron absorption.', sources: 'Guava, amla, orange, papaya, mango, tomato, capsicum' },
  { key: 'vitD', name: 'Vitamin D', unit: 'µg', dp: 1, kind: 'goal', target: () => 15, why: 'Bones, muscle strength and immunity. Sunlight makes most of it, so food totals usually look low.', sources: 'Sardine (mathi), mackerel (ayala), egg yolk, fortified milk, sunlight' },
  { key: 'b12', name: 'Vitamin B12', unit: 'µg', dp: 1, kind: 'goal', target: () => 2.4, why: 'Nerves and red blood cells. Vegetarians often run low.', sources: 'Fish, beef, eggs, milk, curd, paneer' },
  { key: 'folate', name: 'Folate', unit: 'µg', dp: 0, kind: 'goal', target: () => 400, why: 'Making new cells and red blood cells.', sources: 'Chana, rajma, dal, sprouts, greens, peanuts' },
];
export const MICRO_KEYS = MICROS.map((m) => m.key);

export function microTargets(profile, kcal) {
  const out = {};
  for (const m of MICROS) out[m.key] = m.target(profile, kcal);
  return out;
}

// Per 100 g: fiber, sugar, sodium, potassium, calcium, iron, magnesium, zinc, vitA, vitC, vitD, b12, folate
const R = (...v) => Object.fromEntries(MICRO_KEYS.map((k, i) => [k, v[i]]));
export const BUILTIN_MICROS = {
  // Kerala and South Indian (home-style recipes, estimated)
  b_puttu: R(2.5, 0.5, 150, 90, 10, 0.8, 30, 0.8, 0, 0, 0, 0, 6),
  b_appam: R(1, 3, 200, 60, 10, 0.5, 15, 0.5, 0, 0, 0, 0, 10),
  b_idiyappam: R(1, 0.2, 100, 40, 5, 0.4, 10, 0.4, 0, 0, 0, 0, 3),
  b_kadala: R(6, 1.5, 350, 300, 50, 2.2, 45, 1.2, 20, 3, 0, 0, 90),
  b_porotta: R(2, 2, 400, 100, 15, 1.5, 20, 0.6, 30, 0, 0, 0.05, 20),
  b_beeffry: R(1, 1, 500, 330, 20, 3, 25, 5.5, 10, 2, 0.1, 2.5, 10),
  b_fishcurry: R(0.8, 1, 450, 300, 60, 1.2, 30, 0.8, 40, 3, 3, 3, 15),
  b_fishfry: R(0.5, 0.3, 450, 350, 150, 2, 35, 1.2, 30, 1, 5, 7, 10),
  b_chickencurry: R(1, 1.5, 400, 250, 25, 1, 20, 1.2, 40, 3, 0.1, 0.2, 10),
  b_eggcurry: R(0.8, 1.5, 350, 150, 35, 1, 12, 0.7, 90, 3, 1, 0.6, 30),
  b_sambar: R(2, 1.5, 300, 200, 30, 0.9, 20, 0.4, 60, 6, 0, 0, 30),
  b_avial: R(2.5, 2, 250, 250, 30, 0.8, 25, 0.4, 150, 8, 0, 0, 25),
  b_thoran: R(3, 2.5, 250, 200, 40, 0.8, 18, 0.3, 40, 20, 0, 0, 35),
  b_mattarice: R(1.5, 0.2, 2, 70, 8, 0.6, 35, 0.6, 0, 0, 0, 0, 4),
  b_kappa: R(1.8, 1.7, 14, 270, 16, 0.3, 21, 0.3, 1, 20, 0, 0, 27),
  b_idli: R(1.2, 0.3, 250, 60, 12, 0.8, 18, 0.5, 0, 0, 0, 0, 10),
  b_dosa: R(1.2, 0.5, 300, 80, 15, 1, 20, 0.6, 0, 0, 0, 0, 12),
  b_vada: R(4, 1, 400, 250, 30, 2, 50, 1, 5, 2, 0, 0, 60),
  b_pazhampori: R(1.8, 15, 50, 280, 10, 0.6, 25, 0.2, 25, 8, 0, 0, 15),
  b_nendran: R(2.3, 15, 4, 499, 3, 0.6, 37, 0.1, 56, 18, 0, 0, 22),
  b_upma: R(1.5, 1, 300, 80, 15, 0.8, 15, 0.4, 20, 2, 0, 0, 15),
  b_poha: R(1.2, 1.5, 250, 100, 10, 1.5, 20, 0.4, 15, 4, 0, 0, 10),
  b_biryani: R(1, 1, 400, 180, 20, 1, 18, 0.9, 20, 1, 0.1, 0.2, 10),
  b_friedrice: R(1, 1, 450, 130, 15, 0.9, 15, 0.7, 30, 2, 0.1, 0.1, 15),
  b_samosa: R(2.5, 1.5, 420, 220, 20, 1.5, 20, 0.4, 10, 5, 0, 0, 20),
  // Staples
  b_rice: R(0.4, 0.1, 1, 35, 10, 0.2, 12, 0.5, 0, 0, 0, 0, 3),
  b_chapati: R(5, 1.5, 400, 250, 30, 3, 70, 1.6, 0, 0, 0, 0, 30),
  b_dal: R(3, 1, 300, 250, 20, 1.5, 25, 0.8, 10, 2, 0, 0, 60),
  b_rajma: R(5, 1, 350, 300, 35, 1.8, 35, 0.8, 20, 3, 0, 0, 80),
  b_oats: R(10.1, 1, 6, 362, 52, 4.3, 138, 3.6, 0, 0, 0, 0, 32),
  b_bread: R(2.7, 5, 490, 120, 60, 1.5, 25, 0.7, 0, 0, 0, 0, 30),
  b_brownbread: R(6, 4, 450, 250, 60, 2.5, 75, 1.7, 0, 0, 0, 0, 40),
  b_potato: R(1.8, 0.9, 5, 380, 8, 0.3, 20, 0.3, 0, 7.4, 0, 0, 10),
  b_sweetpotato: R(2.5, 5.7, 27, 230, 27, 0.7, 18, 0.2, 787, 12.8, 0, 0, 6),
  // Protein
  b_chickenbreast: R(0, 0, 74, 256, 15, 1, 29, 1, 6, 0, 0.1, 0.3, 4),
  b_chicken65: R(0.5, 0.5, 600, 250, 20, 1.2, 22, 1.3, 20, 1, 0.1, 0.3, 8),
  b_egg: R(0, 1.1, 124, 126, 50, 1.2, 10, 1.05, 149, 0, 2.2, 1.1, 44),
  b_eggwhite: R(0, 0.7, 166, 163, 7, 0.1, 11, 0, 0, 0, 0, 0.1, 4),
  b_omelette: R(0, 1, 300, 120, 45, 1.2, 10, 1, 140, 1, 1.8, 0.9, 35),
  b_paneer: R(0, 2.6, 30, 100, 300, 0.2, 25, 2.5, 180, 0, 0.2, 0.8, 10),
  b_soya: R(13, 7, 15, 2300, 280, 10, 290, 2.5, 0, 0, 0, 0, 300),
  b_tuna: R(0, 0, 250, 240, 11, 1.5, 27, 0.7, 6, 0, 1.7, 2.5, 4),
  b_whey: R(0, 6, 200, 500, 450, 1, 80, 2, 0, 0, 0, 1, 0),
  b_sprouts: R(1.8, 4.1, 6, 149, 13, 0.9, 21, 0.4, 1, 13.2, 0, 0, 61),
  // Dairy
  b_milk: R(0, 4.7, 45, 150, 120, 0.05, 11, 0.4, 30, 1, 0.5, 0.4, 5),
  b_curd: R(0, 4.7, 46, 155, 120, 0.05, 12, 0.6, 27, 0.5, 0, 0.4, 7),
  b_greekyogurt: R(0, 3.2, 36, 141, 110, 0.1, 11, 0.5, 1, 0, 0, 0.75, 7),
  b_tea: R(0, 6, 15, 70, 40, 0.05, 6, 0.1, 10, 0, 0, 0.1, 2),
  b_coffee: R(0, 6, 15, 90, 40, 0.05, 8, 0.1, 10, 0, 0, 0.1, 1),
  // Fruit, nuts, fats
  b_banana: R(2.6, 12.2, 1, 358, 5, 0.26, 27, 0.15, 3, 8.7, 0, 0, 20),
  b_apple: R(2.4, 10.4, 1, 107, 6, 0.12, 5, 0.04, 3, 4.6, 0, 0, 3),
  b_mango: R(1.6, 13.7, 1, 168, 11, 0.16, 10, 0.09, 54, 36.4, 0, 0, 43),
  b_papaya: R(1.7, 7.8, 8, 182, 20, 0.25, 21, 0.08, 47, 60.9, 0, 0, 37),
  b_orange: R(2.4, 9.4, 0, 181, 40, 0.1, 10, 0.07, 11, 53.2, 0, 0, 30),
  b_watermelon: R(0.4, 6.2, 1, 112, 7, 0.24, 10, 0.1, 28, 8.1, 0, 0, 3),
  b_dates: R(6.7, 66.5, 1, 696, 64, 0.9, 54, 0.44, 7, 0, 0, 0, 15),
  b_almonds: R(12.5, 4.4, 1, 733, 269, 3.7, 270, 3.1, 0, 0, 0, 0, 44),
  b_peanuts: R(8.4, 4.2, 6, 658, 54, 1.6, 176, 3.3, 0, 0, 0, 0, 145),
  b_pb: R(6, 9, 350, 560, 45, 1.7, 155, 2.8, 0, 0, 0, 0, 90),
  b_coconut: R(9, 6.2, 20, 356, 14, 2.4, 32, 1.1, 0, 3.3, 0, 0, 26),
  b_ghee: R(0, 0, 2, 5, 4, 0, 0, 0, 840, 0, 0, 0, 0),
  b_oil: R(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
  b_sugar: R(0, 100, 1, 2, 1, 0.05, 0, 0, 0, 0, 0, 0, 0),
};

export function scaleMicros(per100, grams) {
  if (!per100) return null;
  const k = (Number(grams) || 0) / 100;
  const out = {};
  for (const key of MICRO_KEYS) {
    const v = per100[key];
    if (v == null || v === '') continue;
    out[key] = Math.round(Number(v) * k * 100) / 100;
  }
  return Object.keys(out).length ? out : null;
}

/** Read micronutrients (per 100 g) from an Open Food Facts nutriments object. OFF stores them in grams. */
export function offMicros(n = {}) {
  const g = (key, mult) => {
    const v = n[key + '_100g'];
    return v == null || v === '' || !Number.isFinite(Number(v)) ? null : Math.round(Number(v) * mult * 100) / 100;
  };
  let sodium = g('sodium', 1000);
  if (sodium == null) { const salt = g('salt', 1000); if (salt != null) sodium = Math.round(salt / 2.5); }
  const out = {
    fiber: g('fiber', 1), sugar: g('sugars', 1), sodium,
    potassium: g('potassium', 1000), calcium: g('calcium', 1000), iron: g('iron', 1000), magnesium: g('magnesium', 1000), zinc: g('zinc', 1000),
    vitA: g('vitamin-a', 1e6), vitC: g('vitamin-c', 1000), vitD: g('vitamin-d', 1e6), b12: g('vitamin-b12', 1e6), folate: g('vitamin-b9', 1e6) ?? g('folates', 1e6),
  };
  for (const k of Object.keys(out)) if (out[k] == null) delete out[k];
  return Object.keys(out).length ? out : null;
}

/** Micros for one logged entry, including entries logged before micros existed (built-in foods). */
export function entryMicros(e) {
  if (e.micros) return e.micros;
  const per100 = e.food?.micros || BUILTIN_MICROS[e.food?.id];
  return per100 ? scaleMicros(per100, e.grams) : null;
}

/**
 * Totals for a day. `covered` is the share of the day's calories that came with micronutrient data,
 * so the UI can say how complete the numbers are. `by` lists each food's contribution per nutrient.
 */
export function dayMicros(date) {
  const totals = Object.fromEntries(MICRO_KEYS.map((k) => [k, 0]));
  const has = Object.fromEntries(MICRO_KEYS.map((k) => [k, false]));
  const by = Object.fromEntries(MICRO_KEYS.map((k) => [k, []]));
  let kcalAll = 0, kcalCovered = 0;
  for (const e of day(date).meals || []) {
    kcalAll += e.kcal || 0;
    const m = entryMicros(e);
    if (!m) continue;
    kcalCovered += e.kcal || 0;
    for (const k of MICRO_KEYS) {
      if (m[k] == null) continue;
      totals[k] += m[k];
      has[k] = true;
      if (m[k] > 0) by[k].push({ name: e.name, amount: m[k] });
    }
  }
  for (const k of MICRO_KEYS) by[k].sort((a, b) => b.amount - a.amount);
  const covered = kcalAll ? Math.round((kcalCovered / kcalAll) * 100) : 0;
  return { totals, has, by, covered, count: (day(date).meals || []).length };
}

export const fmtMicro = (m, v) => {
  const n = Number(v) || 0;
  return n.toLocaleString('en-IN', { maximumFractionDigits: n < 10 ? m.dp : 0 });
};
