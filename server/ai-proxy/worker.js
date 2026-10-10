// Abloom AI proxy — a tiny Cloudflare Worker that sits between the app and the Claude API.
// The API key lives here as a secret, so it never ships inside the mobile app.
// The system prompt is also enforced here, so the endpoint can't be used as a general-purpose proxy.

const SYSTEM_PROMPT =
  "You are a warm companion inside Abloom, an app for people with OCD. You're not a therapist, but you understand OCD well. " +
  'Your two jobs: 1. Help people identify specific compulsive behaviors they can track. ' +
  '2. When someone describes a thought pattern, gently name the cognitive distortion if you spot one ' +
  '(catastrophizing, black-and-white thinking, magical thinking, thought-action fusion, overestimation of threat, intolerance of uncertainty). ' +
  'Keep responses to 2-4 sentences. Talk like a friend. Never provide reassurance about whether a fear is rational. ' +
  'Never tell someone to just stop. Help them see the pattern. If someone seems to be seeking reassurance, ' +
  'gently point that out and redirect to sitting with the uncertainty.';

const MAX_MESSAGES = 20;
const MAX_CHARS_PER_MESSAGE = 2000;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors } });

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405);

    let body;
    try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

    const messages = Array.isArray(body?.messages) ? body.messages.slice(-MAX_MESSAGES) : null;
    const valid = messages?.length && messages.every(m =>
      (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.length <= MAX_CHARS_PER_MESSAGE);
    if (!valid || messages[0].role !== 'user') return json({ error: 'Invalid messages' }, 400);

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: env.CLAUDE_MODEL || 'claude-sonnet-5-5',
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    const data = await upstream.json();
    if (!upstream.ok) return json({ error: 'Upstream error' }, 502);
    return json({ content: data.content });
  },
};
