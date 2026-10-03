// Shared server-side logic for fitin's AI features.
// Used by both the Netlify function (netlify/functions/ai.mjs)
// and the Vercel function (api/ai.js). The Gemini key never leaves the server.

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// Tried in order; the first model that answers wins. Override with GEMINI_MODEL.
// Workout plans get the stronger Flash model first; quick tasks get Flash-Lite first.
const MODELS = {
  plan: ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-flash-latest'],
  quick: ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-flash-lite-latest'],
};

const MAX_BODY_CHARS = 24000;
const OVERALL_DEADLINE_MS = 24000;

// ---------- small helpers ----------

const str = (v, max = 200) => (typeof v === 'string' ? v : v == null ? '' : String(v)).trim().slice(0, max);
const num = (v, min, max, fallback) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

function parseJsonLoose(text) {
  if (!text) return null;
  let t = text.trim();
  // Strip ``` fences if the model added them
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  try {
    return JSON.parse(t);
  } catch {
    const first = t.indexOf('{');
    const last = t.lastIndexOf('}');
    if (first >= 0 && last > first) {
      try { return JSON.parse(t.slice(first, last + 1)); } catch { /* fall through */ }
    }
    return null;
  }
}

function thinkingFor(model) {
  // Keep responses fast so they fit inside serverless time limits.
  if (/2\.5/.test(model)) return { thinkingBudget: 0 };
  if (/gemini-3|latest/.test(model)) return { thinkingLevel: /lite/.test(model) ? 'minimal' : 'low' };
  return null;
}

async function callGemini({ key, model, system, prompt, deadline }) {
  const tryOnce = async (withThinking) => {
    const generationConfig = {
      responseMimeType: 'application/json',
      temperature: 0.6,
      maxOutputTokens: 8000,
    };
    const thinking = withThinking ? thinkingFor(model) : null;
    if (thinking) generationConfig.thinkingConfig = thinking;

    const remaining = deadline - Date.now();
    if (remaining < 1500) throw Object.assign(new Error('Timed out waiting for Gemini'), { status: 504 });

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), remaining);
    try {
      const res = await fetch(`${API_BASE}/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig,
        }),
        signal: ctrl.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error?.message || `Gemini error ${res.status}`;
        throw Object.assign(new Error(msg), { status: res.status });
      }
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const text = parts.filter((p) => !p.thought && typeof p.text === 'string').map((p) => p.text).join('');
      const json = parseJsonLoose(text);
      if (!json) throw Object.assign(new Error('Gemini returned something that was not valid JSON'), { status: 502 });
      return json;
    } catch (err) {
      if (err.name === 'AbortError') throw Object.assign(new Error('Timed out waiting for Gemini'), { status: 504 });
      throw err;
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    return await tryOnce(true);
  } catch (err) {
    // Some models reject a thinking setting; retry once without it.
    if (err.status === 400 && /thinking/i.test(err.message)) return tryOnce(false);
    throw err;
  }
}

async function generate(env, system, prompt, kind = 'quick') {
  const models = env.model ? [env.model] : MODELS[kind];
  const deadline = Date.now() + OVERALL_DEADLINE_MS;
  const errors = [];
  for (const model of models) {
    try {
      const json = await callGemini({ key: env.key, model, system, prompt, deadline });
      return { json, model };
    } catch (err) {
      errors.push({ model, err });
      // Bad key or permissions: other models won't help.
      if (err.status === 401 || err.status === 403) break;
      if (err.status === 504) break;
      // Retired model, quota, server error or bad JSON: try the next model.
    }
  }
  if (!errors.length) throw new Error('No model available');
  // Prefer the most useful error: a quota or key problem beats "model not found".
  const pick = errors.find((e) => [401, 403, 429, 504].includes(e.err.status)) || errors[0];
  const err = pick.err;
  if (![401, 403, 429, 504].includes(err.status)) {
    err.message = `No Gemini model answered. ${pick.model}: ${err.message}`.slice(0, 400);
  }
  throw err;
}

// ---------- task: workout plan ----------

const PLAN_SYSTEM = `You are fitin's strength coach. You write single training sessions for a hybrid athlete.
You know calisthenics progressions, barbell/dumbbell strength training, fat-loss conditioning,
and armwrestling-specific training (pronation, supination, cupping/wrist flexion, rising/radial deviation,
back pressure, side pressure, finger strength, table practice, tendon-friendly loading).

Rules:
- The session MUST fit in the minutes given, including warm-up. Estimate honestly: sets x (work + rest).
- Only use equipment the athlete has. Match difficulty to their experience.
- Always start with a warm-up that prepares wrists, elbows and shoulders when any arm or pulling work is planned.
- Armwrestling work: controlled reps, no max-effort or jerky pulls, build load gradually. Tendons adapt slower than muscle.
- If the athlete mentions pain or an injury, program around it, keep loads light, and say in coachNote that sharp or lasting pain needs a physiotherapist.
- Use the recent history to progress sensibly and to avoid hammering the same area on consecutive days.
- Reps are a short string like "6-8", "10-12", "5" or for holds "20-30" with unit "sec".
- Reply with JSON only, matching this shape exactly:
{
  "title": "string, e.g. Pull + Arm Day",
  "tags": ["2 to 4 short body-area tags, e.g. Back", "Biceps", "Forearms"],
  "estMinutes": number,
  "warmup": [{"name": "string", "dose": "string, e.g. 2 min or 2 x 15"}],
  "exercises": [{"name": "string", "sets": number, "reps": "string", "unit": "reps" | "sec", "rest": seconds as number, "loaded": boolean (true if they should log kg), "notes": "short cue, optional"}],
  "coachNote": "one or two sentences on the focus of today"
}`;

function sanitizePlan(p, minutes) {
  if (!p || typeof p !== 'object') return null;
  const exercises = (Array.isArray(p.exercises) ? p.exercises : [])
    .slice(0, 12)
    .map((e) => ({
      name: str(e?.name, 80),
      sets: Math.round(num(e?.sets, 1, 8, 3)),
      reps: str(e?.reps, 20) || '8-10',
      unit: e?.unit === 'sec' ? 'sec' : 'reps',
      rest: Math.round(num(e?.rest, 0, 300, 60)),
      loaded: Boolean(e?.loaded),
      notes: str(e?.notes, 160),
    }))
    .filter((e) => e.name);
  if (!exercises.length) return null;
  return {
    title: str(p.title, 60) || 'AI Session',
    tags: (Array.isArray(p.tags) ? p.tags : []).map((t) => str(t, 20)).filter(Boolean).slice(0, 4),
    estMinutes: Math.round(num(p.estMinutes, 5, 240, minutes)),
    warmup: (Array.isArray(p.warmup) ? p.warmup : [])
      .slice(0, 8)
      .map((w) => ({ name: str(w?.name, 80), dose: str(w?.dose, 40) }))
      .filter((w) => w.name),
    exercises,
    coachNote: str(p.coachNote, 400),
  };
}

function planPrompt(input) {
  const minutes = Math.round(num(input.minutes, 10, 180, 45));
  const ctx = {
    minutesAvailable: minutes,
    requestedFocus: str(input.focus, 60) || 'coach decides (next logical session in their week)',
    athleteNote: str(input.note, 400) || 'none',
    profile: input.profile && typeof input.profile === 'object' ? input.profile : {},
    recentWorkouts: Array.isArray(input.history) ? input.history.slice(0, 10) : [],
    nutrition: input.nutrition && typeof input.nutrition === 'object' ? input.nutrition : {},
  };
  return {
    minutes,
    prompt: `Write today's session for this athlete.\n\n${JSON.stringify(ctx, null, 2)}`,
  };
}

// ---------- task: food estimate ----------

const FOOD_SYSTEM = `You are fitin's nutrition estimator. The user describes what they ate, often Indian or Kerala food
(e.g. puttu, kadala curry, appam, porotta, beef fry, fish curry, sadya, biryani) or gym foods.
Estimate realistic portions and macros for home-style cooking. If a quantity is given, use it.
Split the meal into separate items. Be honest: these are estimates.
Also estimate micronutrients for each item's whole portion (not per 100 g), using typical food-composition values.
Reply with JSON only:
{
  "items": [{"name": "string", "grams": number, "kcal": number, "protein": number, "carbs": number, "fat": number,
    "micros": {"fiber_g": number, "sugar_g": number, "sodium_mg": number, "potassium_mg": number, "calcium_mg": number,
      "iron_mg": number, "magnesium_mg": number, "zinc_mg": number, "vitA_ug": number, "vitC_mg": number,
      "vitD_ug": number, "b12_ug": number, "folate_ug": number}}],
  "note": "one short sentence about assumptions, e.g. assumed 1 tbsp oil"
}`;

// Upper bounds for one portion, to throw away nonsense values.
const MICRO_MAX = { fiber_g: 80, sugar_g: 300, sodium_mg: 10000, potassium_mg: 8000, calcium_mg: 3000, iron_mg: 60, magnesium_mg: 1500,
  zinc_mg: 60, vitA_ug: 10000, vitC_mg: 2000, vitD_ug: 200, b12_ug: 200, folate_ug: 3000 };

function sanitizeMicros(m) {
  if (!m || typeof m !== 'object') return null;
  const out = {};
  for (const [k, max] of Object.entries(MICRO_MAX)) {
    const v = Number(m[k]);
    if (!Number.isFinite(v) || v < 0 || v > max) continue;
    out[k.replace(/_(g|mg|ug)$/, '')] = Math.round(v * 100) / 100;
  }
  return Object.keys(out).length ? out : null;
}

function sanitizeFood(f) {
  if (!f || typeof f !== 'object') return null;
  const items = (Array.isArray(f.items) ? f.items : [])
    .slice(0, 12)
    .map((i) => ({
      name: str(i?.name, 80),
      grams: Math.round(num(i?.grams, 0, 3000, 0)),
      kcal: Math.round(num(i?.kcal, 0, 5000, 0)),
      protein: Math.round(num(i?.protein, 0, 400, 0) * 10) / 10,
      carbs: Math.round(num(i?.carbs, 0, 800, 0) * 10) / 10,
      fat: Math.round(num(i?.fat, 0, 400, 0) * 10) / 10,
      micros: sanitizeMicros(i?.micros),
    }))
    .filter((i) => i.name);
  if (!items.length) return null;
  return { items, note: str(f.note, 300) };
}

// ---------- entry point ----------

/**
 * @param {any} body  parsed JSON request body
 * @param {{key?: string, model?: string, accessCode?: string, providedCode?: string}} env
 * @returns {Promise<{status: number, json: any}>}
 */
export async function handleAi(body, env) {
  if (!env.key) {
    return { status: 500, json: { error: 'GEMINI_API_KEY is not set on the server. Add it in your Netlify or Vercel environment variables, then redeploy.' } };
  }
  if (env.accessCode && env.providedCode !== env.accessCode) {
    return { status: 401, json: { error: 'Access code missing or wrong. Enter it in fitin Settings.' } };
  }
  if (!body || typeof body !== 'object') return { status: 400, json: { error: 'Send a JSON body.' } };
  if (JSON.stringify(body).length > MAX_BODY_CHARS) return { status: 413, json: { error: 'Request too large.' } };

  try {
    if (body.task === 'ping') {
      const { json, model } = await generate(env, 'Reply with JSON only.', 'Return {"ok": true}');
      return { status: 200, json: { ok: Boolean(json), model } };
    }

    if (body.task === 'plan') {
      const { minutes, prompt } = planPrompt(body);
      const { json, model } = await generate(env, PLAN_SYSTEM, prompt, 'plan');
      const plan = sanitizePlan(json, minutes);
      if (!plan) return { status: 502, json: { error: 'The AI answer was missing exercises. Try again.' } };
      return { status: 200, json: { plan, model } };
    }

    if (body.task === 'food') {
      const text = str(body.text, 600);
      if (!text) return { status: 400, json: { error: 'Describe what you ate.' } };
      const { json, model } = await generate(env, FOOD_SYSTEM, `Meal description: ${text}`);
      const food = sanitizeFood(json);
      if (!food) return { status: 502, json: { error: 'Could not estimate that meal. Try describing it differently.' } };
      return { status: 200, json: { ...food, model } };
    }

    return { status: 400, json: { error: 'Unknown task.' } };
  } catch (err) {
    const status = err.status === 429 ? 429 : err.status === 401 || err.status === 403 ? 502 : err.status === 504 ? 504 : 502;
    const message =
      err.status === 429
        ? 'Gemini free-tier limit reached. Wait a minute and try again.'
        : err.status === 401 || err.status === 403
          ? 'Gemini rejected the API key. Check GEMINI_API_KEY.'
          : err.message || 'AI request failed.';
    return { status, json: { error: message } };
  }
}
