// Abloom AI proxy — a small Cloudflare Worker between the app and the Claude API.
//
// Why it exists:
// - the Anthropic API key lives here as a secret and never ships in the app
// - the system prompt is enforced here, so the endpoint can't be used as a general-purpose proxy
// - safety: crisis phrases get a crisis protocol added to the prompt and a `crisis: true` flag
// - cost control: per-IP rate limits, an optional daily request cap, short replies
//
// Privacy: we do not log or store message content. /report stores only the flagged reply text
// and reason in the Worker logs (no user identifiers) so you can review problems.
//
// Routes:  POST /chat   { messages: [{ role, content }] } → { text, crisis }
//          POST /report { reply, reason }                → { ok }
//          POST /        (legacy alias for /chat, used by v1.0 of the app)

const SYSTEM_PROMPT = `You are the companion inside Abloom, a self-help app for people with OCD. You are warm, plain-spoken and brief, like a kind friend who knows OCD and ERP (exposure and response prevention) well. You are not a therapist and you never claim to be one.

What you do:
- Help people name what they're experiencing: the obsession (unwanted thought, image, urge or feeling) and the compulsion (anything done to reduce the anxiety or get certainty, including mental ones like reviewing, neutralising, checking feelings, praying to feel safe, and asking for reassurance).
- Gently name thinking traps when you see them: catastrophising, thought-action fusion, inflated responsibility, overestimating threat, intolerance of uncertainty, perfectionism / "not just right".
- Point people toward the app's tools when they fit: "i have an urge" to ride out an urge (resist, delay or shrink the compulsion), the exposure ladder in the practice tab, and the short lessons.
- Help plan a small exposure when asked: something hard but doable, done on purpose, without the compulsion afterwards.

The most important rule — never give reassurance:
- Never tell someone their fear is irrational, unlikely, not true, or that they would never do something. Never say "you're a good person", "that won't happen", "you're not dangerous", "you don't have X", or anything that resolves the doubt.
- Never assess whether a thought "means something", whether they "really" want something, or whether they're at risk of acting on an intrusive thought. Intrusive harm, sexual, religious and relationship thoughts are common OCD themes: name them as intrusive thoughts and focus on the response (not on the content).
- If they ask the same worried question again or rephrase it, kindly notice that this may be reassurance-seeking, and invite them to sit with "maybe, maybe not" instead of answering.
- Validate the feeling ("that sounds really uncomfortable"), not the fear.

Style:
- 2 to 4 short sentences. Lowercase is fine. No lists unless asked. No emojis.
- Never diagnose. Say "that sounds like it could be..." rather than "you have...".
- Don't recommend medication or give medical advice. If they want more help, mention that an ERP-trained therapist is the gold standard and the IOCDF has a directory.
- If asked about something unrelated to OCD, anxiety or wellbeing, briefly say you're here for OCD support and steer back.`;

const CRISIS_ADDENDUM = `

IMPORTANT — the person's latest message may indicate thoughts of suicide or self-harm. Respond with care and without panic: acknowledge what they said and that they deserve support right now, and encourage them to reach out to a crisis line or someone they trust (in the US they can call or text 988; elsewhere findahelpline.com lists free services). The app is also showing these resources on screen. Do not apply the no-reassurance rule to their safety: it is fine to say you're glad they told you and that they don't have to go through this alone. If it is clearly an intrusive thought they are afraid of (not something they want), you may say that, but still mention the resources gently. Keep it to 3 or 4 sentences.`;

const CRISIS_PATTERNS = [
  /\bkill(ing)?\s+my\s*self\b/i, /\bsuicid(e|al)\b/i, /\bend(ing)?\s+(it\s+all|my\s+life|my\s+own\s+life)\b/i,
  /\btake\s+my\s+(own\s+)?life\b/i, /\bwant(ed)?\s+to\s+die\b/i,
  /\b(don'?t|do\s+not)\s+want\s+to\s+(be\s+alive|live|exist|wake\s+up)\b/i, /\bbetter\s+off\s+dead\b/i,
  /\bself[\s-]?harm(ing)?\b/i, /\b(hurt|cut|harm)(ing)?\s+my\s*self\b/i, /\bno\s+reason\s+to\s+live\b/i, /\boverdos(e|ing)\b/i,
];
const looksLikeCrisis = t => CRISIS_PATTERNS.some(p => p.test(t));

const CRISIS_FALLBACK =
  'i’m really glad you told me. you deserve support from a real person right now. in the US you can call or text 988, any time, and findahelpline.com lists free lines in other countries. if you can, reach out to someone you trust too.';

const MAX_MESSAGES = 20;
const MAX_CHARS_PER_MESSAGE = 2000;
const MAX_TOTAL_CHARS = 12000;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Abloom-Token',
  'Access-Control-Max-Age': '86400',
};
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors } });

async function underLimits(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  // Per-IP limits (bindings configured in wrangler.toml). Missing bindings = no limit (local dev).
  if (env.BURST_LIMITER) {
    const { success } = await env.BURST_LIMITER.limit({ key: ip });
    if (!success) return false;
  }
  if (env.MINUTE_LIMITER) {
    const { success } = await env.MINUTE_LIMITER.limit({ key: ip });
    if (!success) return false;
  }
  // Optional global daily cap, a backstop for your Claude bill (needs the USAGE KV namespace).
  if (env.USAGE && env.DAILY_REQUEST_CAP) {
    const day = new Date().toISOString().slice(0, 10);
    const used = parseInt((await env.USAGE.get(day)) || '0', 10);
    if (used >= parseInt(env.DAILY_REQUEST_CAP, 10)) return false;
    await env.USAGE.put(day, String(used + 1), { expirationTtl: 60 * 60 * 48 });
  }
  return true;
}

async function chat(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const messages = Array.isArray(body?.messages) ? body.messages.slice(-MAX_MESSAGES) : null;
  const valid = messages?.length && messages.every(m =>
    (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.length > 0 && m.content.length <= MAX_CHARS_PER_MESSAGE);
  if (!valid || messages[0].role !== 'user' || messages[messages.length - 1].role !== 'user') return json({ error: 'Invalid messages' }, 400);
  if (messages.reduce((n, m) => n + m.content.length, 0) > MAX_TOTAL_CHARS) return json({ error: 'Too long' }, 413);

  if (!(await underLimits(request, env))) return json({ error: 'Rate limited' }, 429);

  const crisis = looksLikeCrisis(messages[messages.length - 1].content);
  let upstream;
  try {
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: env.CLAUDE_MODEL || 'claude-sonnet-5-5',
        max_tokens: 350,
        system: SYSTEM_PROMPT + (crisis ? CRISIS_ADDENDUM : ''),
        messages,
      }),
    });
  } catch {
    return crisis ? json({ text: CRISIS_FALLBACK, crisis }) : json({ error: 'Upstream unreachable' }, 502);
  }

  let data = null;
  try { data = await upstream.json(); } catch {}
  if (!upstream.ok || !data) {
    if (crisis) return json({ text: CRISIS_FALLBACK, crisis });
    return json({ error: 'Upstream error' }, upstream.status === 429 ? 429 : 502);
  }
  const text = (data.content || []).map(c => (c.type === 'text' ? c.text : '')).join('').trim();
  return json({ text: text || (crisis ? CRISIS_FALLBACK : 'i’m here. tell me a bit more?'), crisis });
}

async function report(request) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const reply = String(body?.reply || '').slice(0, 2000);
  const reason = String(body?.reason || '').slice(0, 200);
  // Shows up in `wrangler tail` / Workers Logs. Contains only the AI's reply, not the user's messages.
  console.log(JSON.stringify({ type: 'ai_report', at: new Date().toISOString(), reason, reply }));
  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405);
    if (env.APP_TOKEN && request.headers.get('X-Abloom-Token') !== env.APP_TOKEN) return json({ error: 'Forbidden' }, 403);

    const { pathname } = new URL(request.url);
    if (pathname === '/report') return report(request);
    if (pathname === '/chat' || pathname === '/') return chat(request, env);
    return json({ error: 'Not found' }, 404);
  },
};
