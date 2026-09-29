// Vercel Function: POST /api/ai
import { handleAi } from '../lib/gemini.mjs';

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON.' }); }
  }
  const result = await handleAi(body || {}, {
    key: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL,
    accessCode: process.env.FITIN_ACCESS_CODE,
    providedCode: req.headers['x-fitin-code'] || '',
  });
  return res.status(result.status).json(result.json);
}
