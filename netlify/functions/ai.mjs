// Netlify Function: POST /api/ai
import { handleAi } from '../../lib/gemini.mjs';

const headers = { 'content-type': 'application/json', 'cache-control': 'no-store' };

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Use POST.' }), { status: 405, headers });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON.' }), { status: 400, headers });
  }
  const result = await handleAi(body, {
    key: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL,
    accessCode: process.env.FITIN_ACCESS_CODE,
    providedCode: req.headers.get('x-fitin-code') || '',
  });
  return new Response(JSON.stringify(result.json), { status: result.status, headers });
};

export const config = { path: '/api/ai' };
