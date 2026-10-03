# fitin

Workout, nutrition and progress tracker for a hybrid armwrestling and calisthenics athlete who also wants to lose fat and get stronger.

- **Dashboard**: weight, body fat, calories, protein, workouts this week, today's plan, meals, weekly bars and a progress chart.
- **Workout planner**: say how many minutes you have and fitin builds a session from your goals, equipment and weekly split.
  - *Smart rules*: free and works offline. Includes armwrestling work (pronation, cupping, rising, back and side pressure, fingers, table practice).
  - *AI coach*: Gemini writes the session using your recent workouts and any note ("elbow a bit sore").
- **Workout logging**: log kg and reps per set, with a rest timer, swap exercise, add sets, and progression hints ("Last: 20 kg x 8, 8, 8. Try 22.5 kg").
- **Food logging**:
  - Barcode scan (Open Food Facts)
  - Search 60+ built-in Indian and Kerala foods (puttu, appam, kadala curry, porotta, beef fry, fish curry...)
  - Describe a meal and let AI estimate it
  - Manual entry. Scanned and manual foods are remembered.
- **Targets**: calorie and protein targets from your stats (Mifflin-St Jeor), with a moderate deficit when fat loss is a goal.
- **Ranks, badges and streaks**:
  - *Rank* (Novice → Beginner → Active → Dedicated → Pro → Elite → Legend at 0/7/30/60/90/180/365 consistent days). A consistent day is a day with food logged, in a week where you hit your workout target. 4 days in a row with no check-in drops you one level.
  - *Streak fire*: any meal, weigh-in or workout keeps it alive; the flame changes at 3, 7, 14, 30, 60, 90, 180 and 365 days.
  - *Goal Achieved* unlocks the day a weigh-in reaches your goal weight, plus 19 special and milestone badges. New badges pop up when you earn them.
- **Profile**: photo (resized on the phone to about 20 KB), username, motto, location, goal weight.
- **Micronutrients**: a Micros tab with fiber, 10 vitamins and minerals, plus sodium and sugar limits, against daily targets for your sex. Each food shows its micronutrients when you log it. Values come from the built-in food table, Open Food Facts for scanned foods, or the AI estimate.
- **BMI**: calculator (metric or imperial), result with category scale and healthy weight range, history from your weigh-ins, insights, tips and category guide.
- **Schedule**: week timeline, month calendar and the next 2 weeks of sessions, based on your training days.
- **Installable**: add it to your phone's home screen and it works like an app, including offline for logging.

Your data is stored in the browser on your device. Use **Settings → Export** to back it up or move it to another phone.

---

## 1. Get a free Gemini API key

1. Go to https://aistudio.google.com and sign in with a Google account.
2. Click **Get API key → Create API key** and copy it.

The free tier is rate limited, which is plenty for one person. On the free tier Google may use your prompts to improve its products. Only your training data and meal descriptions are sent, never your name.

The app works without a key. Only the AI coach and the "Describe" meal tab need it.

## 2. Deploy to Netlify (recommended)

Netlify's drag-and-drop upload does **not** run serverless functions, so deploy from GitHub:

1. Create a new GitHub repository and upload everything in this folder (keep the folder structure).
2. In Netlify: **Add new site → Import an existing project → GitHub** and pick the repo. The build settings come from `netlify.toml`, so just press **Deploy**.
3. Go to **Site configuration → Environment variables → Add a variable**:
   - Key: `GEMINI_API_KEY`
   - Value: your key
4. Go to **Deploys → Trigger deploy → Deploy site** so the key is picked up.
5. Open the site, go to **Settings → Test AI connection**. You should see "Connected".

You can also deploy with the CLI from this folder: `npx netlify-cli deploy --prod`

## Or deploy to Vercel

1. Push the folder to GitHub.
2. In Vercel: **Add New → Project**, import the repo, and set Framework Preset to **Other**. `vercel.json` already sets the output folder.
3. Under **Environment Variables**, add `GEMINI_API_KEY`, then deploy.

## Optional settings (environment variables)

| Variable | What it does |
|---|---|
| `GEMINI_API_KEY` | Required for AI features. |
| `GEMINI_MODEL` | Use one specific model, e.g. `gemini-3.5-flash`. By default fitin uses `gemini-3.5-flash` for workout plans and `gemini-3.5-flash-lite` for meal estimates, with other free Flash models as fallbacks, so it keeps working when Google retires a model. |
| `FITIN_ACCESS_CODE` | Anyone who finds your URL could use your free quota. Set a code here, and enter the same code in fitin **Settings → AI coach**. Requests without it are refused. |

## Install on your phone

Open your site in Chrome (Android) or Safari (iPhone) → menu → **Add to Home screen**. Barcode scanning needs the camera, which only works over HTTPS. Netlify and Vercel give you HTTPS automatically.

## Run locally

```bash
cp .env.example .env      # paste your key into .env
npx netlify-cli dev       # opens http://localhost:8888 with the AI function working
```

Opening `public/index.html` directly won't work because the app uses JavaScript modules. It needs a server.

## Project layout

```
public/              the app (plain HTML, CSS, JavaScript, no build step)
  js/app.js          views and interactions
  js/planner.js      rule-based session planner + progression
  js/exercises.js    exercise library (edit this to add your own)
  js/foods.js        built-in foods + Open Food Facts lookups
  js/nutrition.js    calorie and macro targets
  js/scanner.js      barcode camera
lib/gemini.mjs       server-side Gemini logic shared by both hosts
netlify/functions/   Netlify function  -> /api/ai
api/ai.js            Vercel function   -> /api/ai
```

## Notes

- Built-in food values are typical estimates per 100 g. For packaged food, scanning the barcode is more accurate.
- Open Food Facts is crowd-sourced. If a product is missing, fitin asks for the label values once and remembers them.
- Armwrestling puts heavy torque on the elbow and forearm. The planner keeps arm work controlled and sub-maximal. Stop on sharp pain and see a physiotherapist if it lasts.
