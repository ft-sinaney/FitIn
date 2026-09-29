// Exercise library used by the rule-based planner.
// eq: ALL of these are needed ('none' items need nothing). lv: [min, max] level (1 beginner, 2 intermediate, 3 advanced).
// unit: 'reps' | 'sec' | 'min'. loaded: log kg. side: done per arm/leg. cali: calisthenics movement.
// r: rep/time override for this exercise. cue: short coaching note.

export const EQUIPMENT = [
  { id: 'bar', label: 'Pull-up bar' },
  { id: 'dip', label: 'Dip bars / parallettes' },
  { id: 'rings', label: 'Gymnastic rings' },
  { id: 'db', label: 'Dumbbells' },
  { id: 'kb', label: 'Kettlebell' },
  { id: 'bb', label: 'Barbell + plates' },
  { id: 'bench', label: 'Bench' },
  { id: 'cable', label: 'Cable machine' },
  { id: 'band', label: 'Resistance bands' },
  { id: 'roller', label: 'Wrist roller' },
  { id: 'handle', label: 'Armwrestling handle / loading pin' },
  { id: 'table', label: 'Armwrestling table or partner' },
];

const AW = 'Slow and controlled. Stop 1 to 2 reps before form breaks. No jerky pulls.';

const X = (n, p, eq, lv, extra = {}) => ({ n, p, eq, lv, unit: 'reps', loaded: false, side: false, cali: false, ...extra });

export const EXERCISES = [
  // Vertical pull
  X('Scapular pull-ups', 'vpull', ['bar'], [1, 1], { cali: true, r: '8-10' }),
  X('Negative pull-ups', 'vpull', ['bar'], [1, 1], { cali: true, r: '3-5', cue: '3 to 5 second lowering.' }),
  X('Band-assisted pull-ups', 'vpull', ['bar', 'band'], [1, 2], { cali: true }),
  X('Chin-ups', 'vpull', ['bar'], [1, 3], { cali: true, r: '5-8' }),
  X('Pull-ups', 'vpull', ['bar'], [2, 3], { cali: true, r: '5-8' }),
  X('Weighted pull-ups', 'vpull', ['bar', 'db'], [3, 3], { cali: true, loaded: true, cue: 'Hold a dumbbell between the feet or use a belt.' }),
  X('Archer pull-ups', 'vpull', ['bar'], [3, 3], { cali: true, side: true, r: '3-5' }),
  X('Lat pulldown', 'vpull', ['cable'], [1, 3], { loaded: true }),

  // Horizontal pull
  X('Inverted rows', 'hpull', ['bar'], [1, 3], { cali: true, r: '8-12', cue: 'Use a low bar or sturdy table edge.' }),
  X('Ring rows', 'hpull', ['rings'], [1, 3], { cali: true, r: '8-12' }),
  X('One-arm dumbbell row', 'hpull', ['db'], [1, 3], { loaded: true, side: true }),
  X('Barbell row', 'hpull', ['bb'], [2, 3], { loaded: true }),
  X('Seated cable row', 'hpull', ['cable'], [1, 3], { loaded: true }),
  X('Band row', 'hpull', ['band'], [1, 2], { r: '12-15' }),

  // Horizontal push
  X('Incline push-ups', 'hpush', [], [1, 1], { cali: true, r: '8-12' }),
  X('Push-ups', 'hpush', [], [1, 2], { cali: true, r: '8-15' }),
  X('Archer push-ups', 'hpush', [], [3, 3], { cali: true, side: true, r: '4-6' }),
  X('Pseudo planche push-ups', 'hpush', [], [3, 3], { cali: true, r: '5-8' }),
  X('Dips', 'hpush', ['dip'], [2, 3], { cali: true, r: '6-10' }),
  X('Weighted dips', 'hpush', ['dip', 'db'], [3, 3], { cali: true, loaded: true }),
  X('Ring dips', 'hpush', ['rings'], [3, 3], { cali: true, r: '5-8' }),
  X('Bench press', 'hpush', ['bb', 'bench'], [1, 3], { loaded: true }),
  X('Dumbbell bench press', 'hpush', ['db', 'bench'], [1, 3], { loaded: true }),
  X('Dumbbell floor press', 'hpush', ['db'], [1, 2], { loaded: true }),

  // Vertical push
  X('Pike push-ups', 'vpush', [], [1, 2], { cali: true, r: '6-10' }),
  X('Elevated pike push-ups', 'vpush', [], [2, 3], { cali: true, r: '5-8' }),
  X('Wall handstand push-up negatives', 'vpush', [], [3, 3], { cali: true, r: '3-5' }),
  X('Dumbbell shoulder press', 'vpush', ['db'], [1, 3], { loaded: true }),
  X('Overhead press', 'vpush', ['bb'], [2, 3], { loaded: true }),

  // Skills
  X('Wall handstand hold', 'skill_push', [], [1, 2], { cali: true, unit: 'sec', r: '20-40', cue: 'Chest to wall, stacked shoulders.' }),
  X('Freestanding handstand practice', 'skill_push', [], [3, 3], { cali: true, unit: 'sec', r: '10-30' }),
  X('Crow pose', 'skill_push', [], [1, 2], { cali: true, unit: 'sec', r: '10-20' }),
  X('Planche lean', 'skill_push', [], [2, 3], { cali: true, unit: 'sec', r: '15-25', cue: 'Protract hard, lean until wrists feel it.' }),
  X('Tuck front lever hold', 'skill_pull', ['bar'], [2, 3], { cali: true, unit: 'sec', r: '8-15' }),

  // Core
  X('Dead bug', 'core', [], [1, 1], { r: '8-12', side: true }),
  X('Hanging knee raises', 'core', ['bar'], [1, 2], { cali: true, r: '10-15' }),
  X('Hanging leg raises', 'core', ['bar'], [2, 3], { cali: true, r: '8-12' }),
  X('Toes to bar', 'core', ['bar'], [3, 3], { cali: true, r: '6-10' }),
  X('Pallof press', 'core', ['band'], [1, 3], { side: true, r: '10-12' }),
  X('Side plank', 'core', [], [1, 3], { unit: 'sec', side: true, r: '30-45' }),
  X('Plank', 'core_static', [], [1, 1], { unit: 'sec', r: '30-45' }),
  X('Hollow body hold', 'core_static', [], [1, 3], { cali: true, unit: 'sec', r: '20-40' }),
  X('Tuck L-sit', 'core_static', [], [1, 2], { cali: true, unit: 'sec', r: '10-20' }),
  X('L-sit', 'core_static', ['dip'], [2, 3], { cali: true, unit: 'sec', r: '10-20' }),

  // Arms
  X('Hammer curl', 'biceps', ['db'], [1, 3], { loaded: true, cue: 'Builds the brachioradialis, key for armwrestling.' }),
  X('Dumbbell curl', 'biceps', ['db'], [1, 3], { loaded: true }),
  X('Barbell curl', 'biceps', ['bb'], [1, 3], { loaded: true }),
  X('Band curl', 'biceps', ['band'], [1, 2], { r: '12-15' }),
  X('Bench dips', 'triceps', [], [1, 2], { cali: true, r: '10-15' }),
  X('Diamond push-ups', 'triceps', [], [2, 3], { cali: true, r: '8-12' }),
  X('Overhead dumbbell extension', 'triceps', ['db'], [1, 3], { loaded: true }),
  X('Band pushdown', 'triceps', ['band'], [1, 2], { r: '12-15' }),
  X('Cable pushdown', 'triceps', ['cable'], [1, 3], { loaded: true }),

  // Upper back health
  X('Band pull-aparts', 'rear', ['band'], [1, 3], { r: '15-20' }),
  X('Face pulls', 'rear', ['cable'], [1, 3], { loaded: true, r: '12-15' }),
  X('Band face pulls', 'rear', ['band'], [1, 3], { r: '15-20' }),
  X('Reverse dumbbell fly', 'rear', ['db'], [1, 3], { loaded: true, r: '12-15' }),
  X('Prone Y-T-W raises', 'rear', [], [1, 2], { r: '8 each' }),

  // Legs
  X('Bodyweight squats', 'squat', [], [1, 1], { cali: true, r: '15-20' }),
  X('Goblet squat', 'squat', ['db'], [1, 3], { loaded: true }),
  X('Kettlebell goblet squat', 'squat', ['kb'], [1, 3], { loaded: true }),
  X('Back squat', 'squat', ['bb'], [2, 3], { loaded: true }),
  X('Box pistol squat', 'squat', [], [2, 3], { cali: true, side: true, r: '5-8' }),
  X('Pistol squat', 'squat', [], [3, 3], { cali: true, side: true, r: '3-6' }),
  X('Glute bridge', 'hinge', [], [1, 1], { r: '15-20' }),
  X('Single-leg Romanian deadlift', 'hinge', [], [1, 2], { side: true, r: '10-12' }),
  X('Dumbbell Romanian deadlift', 'hinge', ['db'], [1, 3], { loaded: true }),
  X('Kettlebell swing', 'hinge', ['kb'], [1, 3], { loaded: true, r: '15-20' }),
  X('Deadlift', 'hinge', ['bb'], [2, 3], { loaded: true }),
  X('Nordic curl negatives', 'hinge', [], [2, 3], { cali: true, r: '3-5' }),
  X('Reverse lunges', 'single_leg', [], [1, 2], { side: true, r: '8-12' }),
  X('Bulgarian split squat', 'single_leg', [], [1, 3], { side: true, r: '8-12', cali: true }),
  X('Dumbbell Bulgarian split squat', 'single_leg', ['db'], [2, 3], { side: true, loaded: true }),
  X('Step-ups', 'single_leg', [], [1, 2], { side: true, r: '10-12' }),
  X('Shrimp squat', 'single_leg', [], [3, 3], { side: true, cali: true, r: '4-6' }),
  X('Calf raises', 'calf', [], [1, 3], { r: '15-20' }),

  // Grip and carries
  X('Farmer carry', 'carry', ['db'], [1, 3], { unit: 'sec', loaded: true, r: '30-40' }),
  X('Kettlebell farmer carry', 'carry', ['kb'], [1, 3], { unit: 'sec', loaded: true, r: '30-40' }),
  X('Dead hang', 'carry', ['bar'], [1, 2], { unit: 'sec', r: '30-45' }),
  X('Towel hang', 'carry', ['bar'], [2, 3], { unit: 'sec', r: '15-30', cue: 'Two towels over the bar. Crushes grip and cupping.' }),

  // Armwrestling: pronation
  X('Band pronation', 'pronation', ['band'], [1, 3], { side: true, r: '15-20', cue: AW }),
  X('Dumbbell lever pronation', 'pronation', ['db'], [1, 3], { side: true, loaded: true, cue: 'Hold one end of a dumbbell, rotate palm down. ' + AW }),
  X('Handle pronation', 'pronation', ['handle'], [2, 3], { side: true, loaded: true, cue: AW }),
  X('Cable pronation', 'pronation', ['cable', 'handle'], [2, 3], { side: true, loaded: true, cue: AW }),
  // Supination
  X('Dumbbell lever supination', 'supination', ['db'], [1, 3], { side: true, loaded: true, cue: AW }),
  X('Band supination', 'supination', ['band'], [1, 3], { side: true, r: '15-20', cue: AW }),
  // Cupping / wrist flexion
  X('Dumbbell wrist curls', 'cup', ['db'], [1, 3], { loaded: true, r: '12-20', cue: AW }),
  X('Barbell wrist curls', 'cup', ['bb'], [1, 3], { loaded: true, r: '12-20', cue: AW }),
  X('Handle cupping', 'cup', ['handle'], [2, 3], { side: true, loaded: true, cue: AW }),
  X('Band cupping', 'cup', ['band'], [1, 2], { side: true, r: '15-20', cue: AW }),
  X('Wrist roller', 'cup', ['roller'], [1, 3], { loaded: true, r: '2-3 rolls' }),
  // Rising / radial deviation
  X('Dumbbell lever rising', 'rising', ['db'], [1, 3], { side: true, loaded: true, cue: 'Hold one end, lift the thumb side up. ' + AW }),
  X('Handle rising', 'rising', ['handle'], [2, 3], { side: true, loaded: true, cue: AW }),
  X('Band rising', 'rising', ['band'], [1, 2], { side: true, r: '15-20', cue: AW }),
  // Back and side pressure
  X('Band back pressure', 'backpressure', ['band'], [1, 3], { side: true, r: '12-15', cue: AW }),
  X('Handle back pressure', 'backpressure', ['handle'], [2, 3], { side: true, loaded: true, cue: AW }),
  X('Band side pressure', 'sidepressure', ['band'], [1, 3], { side: true, r: '12-15', cue: AW }),
  X('Side pressure isometric hold', 'sidepressure', ['band'], [2, 3], { side: true, unit: 'sec', r: '10-15', cue: 'Hold the top position. ' + AW }),
  // Fingers
  X('Finger curls', 'fingers', ['db'], [1, 3], { loaded: true, r: '12-15' }),
  X('Dumbbell head pinch hold', 'fingers', ['db'], [1, 3], { unit: 'sec', loaded: true, r: '20-30' }),
  X('Barbell finger curls', 'fingers', ['bb'], [2, 3], { loaded: true, r: '12-15' }),
  // Table
  X('Table practice (technique)', 'table', ['table'], [1, 3], { r: '3-5 goes', cue: 'Technique and positions only, about 60 to 70 percent effort. No max pulls.' }),

  // Conditioning
  X('Burpee EMOM', 'cond', [], [1, 3], { unit: 'min', r: '8', cue: '6 to 10 burpees at the top of every minute.' }),
  X('Intervals: mountain climbers + squats', 'cond', [], [1, 3], { unit: 'min', r: '8', cue: '40 seconds work, 20 seconds rest, alternate.' }),
  X('Shadow boxing rounds', 'cond', [], [1, 3], { unit: 'min', r: '9', cue: '3 minute rounds, 30 seconds rest.' }),
  X('Kettlebell swing EMOM', 'cond', ['kb'], [1, 3], { unit: 'min', r: '10', cue: '12 to 15 swings every minute.' }),
  X('Brisk walk or easy jog', 'cond', [], [1, 3], { unit: 'min', r: '15', cue: 'Conversational pace. Good for recovery and fat loss.' }),
];

const has = (equip, ex) => ex.eq.every((e) => e === 'none' || equip.includes(e));

export function findExercise(name) {
  const n = (name || '').toLowerCase().trim();
  return EXERCISES.find((e) => e.n.toLowerCase() === n) || null;
}

export function searchExercises(q, equip) {
  const s = q.toLowerCase().trim();
  return EXERCISES.filter((e) => (!s || e.n.toLowerCase().includes(s)) && (!equip || has(equip, e))).slice(0, 30);
}

export function candidates(pattern, equip, level) {
  const avail = EXERCISES.filter((e) => e.p === pattern && has(equip, e));
  const inLevel = avail.filter((e) => e.lv[0] <= level && level <= e.lv[1]);
  if (inLevel.length) return inLevel;
  // Nothing at this level: take the closest level available.
  return avail.sort((a, b) => Math.abs(a.lv[0] - level) - Math.abs(b.lv[0] - level)).slice(0, 2);
}

export function alternatives(name, equip) {
  const ex = findExercise(name);
  if (!ex) return [];
  return EXERCISES.filter((e) => e.p === ex.p && e.n !== ex.n && has(equip, e));
}
