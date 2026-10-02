// BMI maths and category text. BMI = weight (kg) / height (m)^2.

export const BMI_CATS = [
  { id: 'under', name: 'Underweight', short: 'Underweight', range: '< 18.5', min: 0, max: 18.5, color: '#4ea3f0',
    blurb: 'You may be underweight. Consider a nutrient-rich diet.',
    status: 'Your BMI is below the healthy range.',
    insights: ['Your weight is below the healthy range.', 'Add calorie-dense, protein-rich meals.', 'Strength train to build muscle, not just weight.', 'See a doctor if you are losing weight without trying.'] },
  { id: 'normal', name: 'Normal Weight', short: 'Normal', range: '18.5 – 24.9', min: 18.5, max: 25, color: '#6fe08a',
    blurb: 'A healthy range. Keep maintaining your lifestyle!',
    status: 'Your BMI is in the normal range. Keep maintaining your current lifestyle!',
    insights: ['Your weight is in a healthy range.', 'Maintain a balanced diet.', 'Keep up with regular exercise.', 'Track your BMI regularly.'] },
  { id: 'over', name: 'Overweight', short: 'Overweight', range: '25 – 29.9', min: 25, max: 30, color: '#f2c14e',
    blurb: 'You may be overweight. Consider a balanced diet and regular exercise.',
    status: 'Your BMI is above the healthy range.',
    insights: ['A moderate calorie deficit brings it down steadily.', 'Keep protein high so you lose fat, not muscle.', 'Muscular builds can read as overweight: check your waist and body fat too.', 'Aim for about 0.5 kg a week.'] },
  { id: 'obese', name: 'Obese', short: 'Obese', range: '≥ 30', min: 30, max: 99, color: '#ef5a5a',
    blurb: "You may be in the obese range. It's recommended to consult a healthcare professional.",
    status: 'Your BMI is in the obese range.',
    insights: ['Talking to a doctor or dietitian is a good first step.', 'Start with daily walks and 2–3 strength sessions a week.', 'Small steady losses (0.5 kg a week) last longest.', 'Track food honestly; it is the biggest lever.'] },
];

export const BMI_TIPS = [
  ['fork', 'Maintain a high-protein diet', 'About 1.6–2.2 g per kg of body weight helps keep muscle while your weight changes.'],
  ['drop', 'Stay hydrated', 'Around 2.5–3.5 litres a day, more on training days and in Kerala heat.'],
  ['moon', 'Get 7–8 hours of sleep', 'Short sleep raises hunger and slows recovery from training.'],
  ['dumbbell', 'Do strength training 3–4x per week', 'Muscle raises how much you burn at rest and improves body shape at any BMI.'],
  ['chart', 'Track your progress monthly', 'Weigh in under the same conditions; watch the monthly trend, not single days.'],
];

export const bmiValue = (kg, cm) => {
  const w = Number(kg), h = Number(cm) / 100;
  if (!w || !h) return null;
  return Math.round((w / (h * h)) * 10) / 10;
};

export const bmiCat = (bmi) => BMI_CATS.find((c) => bmi < c.max) || BMI_CATS[3];

/** Healthy weight range (BMI 18.5–24.9) for a height. */
export const healthyRange = (cm) => {
  const h = Number(cm) / 100;
  return h ? [Math.round(18.5 * h * h * 10) / 10, Math.round(24.9 * h * h * 10) / 10] : null;
};

/** Position of a BMI on the 4-colour scale, 0–100 %. Scale runs 15 → 35. */
export const scalePos = (bmi) => {
  // Each band gets a quarter of the bar regardless of its numeric width, like the mockup.
  const edges = [15, 18.5, 25, 30, 35];
  const b = Math.min(34.9, Math.max(15, bmi));
  const i = edges.findIndex((e, k) => b >= e && b < edges[k + 1]);
  return (i + (b - edges[i]) / (edges[i + 1] - edges[i])) * 25;
};

export const lbToKg = (lb) => Number(lb) * 0.45359237;
export const kgToLb = (kg) => Number(kg) / 0.45359237;
export const ftInToCm = (ft, inch) => (Number(ft) * 12 + Number(inch || 0)) * 2.54;
export const cmToFtIn = (cm) => {
  const total = Number(cm) / 2.54;
  let ft = Math.floor(total / 12);
  let inch = Math.round(total - ft * 12);
  if (inch === 12) { ft++; inch = 0; }
  return [ft, inch];
};
