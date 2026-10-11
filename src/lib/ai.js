// Client for the AI companion. The app never holds an API key: it talks to our Cloudflare
// Worker (server/ai-proxy), which owns the system prompt, safety handling and rate limits.
const PROXY_URL = process.env.EXPO_PUBLIC_AI_PROXY_URL;
const APP_TOKEN = process.env.EXPO_PUBLIC_AI_APP_TOKEN || '';

export const aiConfigured = () => !!PROXY_URL;

export const OFFLINE_REPLY =
  'the companion isn’t switched on in this version yet, but everything else works. if an urge is here right now, try “i have an urge” on the grow screen.';

export async function askCompanion(messages, { signal } = {}) {
  if (!PROXY_URL) return { text: OFFLINE_REPLY, offline: true };
  let res;
  try {
    res = await fetch(PROXY_URL.replace(/\/$/, '') + '/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(APP_TOKEN ? { 'X-Abloom-Token': APP_TOKEN } : {}) },
      body: JSON.stringify({ messages: messages.slice(-20).map(m => ({ role: m.role, content: m.content })) }),
      signal,
    });
  } catch {
    return { error: 'network' };
  }
  if (res.status === 429) return { error: 'busy' };
  if (!res.ok) return { error: 'server' };
  try {
    const body = await res.json();
    return { text: body.text || '', crisis: !!body.crisis };
  } catch {
    return { error: 'server' };
  }
}

// Lets people flag a reply (Google Play requires in-app reporting for generative AI features).
export async function reportReply({ reply, reason }) {
  if (!PROXY_URL) return;
  try {
    await fetch(PROXY_URL.replace(/\/$/, '') + '/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(APP_TOKEN ? { 'X-Abloom-Token': APP_TOKEN } : {}) },
      body: JSON.stringify({ reply: String(reply).slice(0, 2000), reason: String(reason || '').slice(0, 200) }),
    });
  } catch {}
}
