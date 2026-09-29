// Calorie and macro targets from the profile (Mifflin-St Jeor).

const ACTIVITY = { sedentary: 1.2, light: 1.375, moderate: 1.55, very: 1.725 };

export function computeTargets(p) {
  const w = Number(p.weightKg) || 70;
  const h = Number(p.heightCm) || 170;
  const a = Number(p.age) || 25;
  const bmr = 10 * w + 6.25 * h - 5 * a + (p.sex === 'female' ? -161 : 5);
  const tdee = bmr * (ACTIVITY[p.activity] || 1.55);
  const goals = p.goals || [];
  const fatLoss = goals.includes('fatloss');
  const buildGoal = goals.some((g) => ['strength', 'muscle', 'armwrestling', 'calisthenics'].includes(g));

  let kcal;
  if (fatLoss) {
    // A moderate deficit keeps strength moving while fat comes off.
    const pct = buildGoal ? 0.15 : 0.2;
    kcal = tdee - Math.min(tdee * pct, 600);
  } else if (goals.includes('muscle')) {
    kcal = tdee + 250;
  } else {
    kcal = tdee;
  }
  kcal = Math.round(kcal / 10) * 10;

  const protein = Math.round(w * (fatLoss ? 2.1 : 1.9));
  const fat = Math.round(w * 0.8);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { kcal, protein, carbs, fat, tdee: Math.round(tdee), bmr: Math.round(bmr) };
}

export function activeTargets(state) {
  const auto = computeTargets(state.profile);
  if (state.targets.override) {
    return {
      ...auto,
      kcal: Number(state.targets.kcal) || auto.kcal,
      protein: Number(state.targets.protein) || auto.protein,
      carbs: Number(state.targets.carbs) || auto.carbs,
      fat: Number(state.targets.fat) || auto.fat,
    };
  }
  return auto;
}
