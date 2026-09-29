// Client for the /api/ai serverless function (Gemini runs server-side).
import { getState } from './store.js';

export async function askAi(payload, timeoutMs = 40000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  let res;
  try {
    res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-fitin-code': getState().settings.accessCode || '' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('The AI took too long. Try again.');
    throw new Error('You look offline. AI features need a connection.');
  } finally {
    clearTimeout(t);
  }
  const type = res.headers.get('content-type') || '';
  if (!type.includes('application/json')) {
    throw new Error('AI server not found. It works after deploying to Netlify or Vercel (or with "netlify dev" locally).');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `AI request failed (${res.status}).`);
  return data;
}
