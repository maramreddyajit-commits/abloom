import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../server/ai-proxy/worker.js';

const req = (path, body, headers = {}) => new Request(`https://proxy.test${path}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '1.2.3.4', ...headers }, body: JSON.stringify(body),
});
const msgs = text => ({ messages: [{ role: 'user', content: text }] });

function mockAnthropic(reply = 'that sounds like checking.', status = 200) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push(JSON.parse(init.body));
    return new Response(JSON.stringify(status === 200 ? { content: [{ type: 'text', text: reply }] } : { error: {} }), { status });
  };
  return calls;
}

test('chat returns text and enforces the system prompt', async () => {
  const calls = mockAnthropic();
  const res = await worker.fetch(req('/chat', msgs('i keep checking the stove')), { ANTHROPIC_API_KEY: 'k' });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.text, 'that sounds like checking.');
  assert.equal(body.crisis, false);
  assert.match(calls[0].system, /never give reassurance/);
});

test('crisis messages get the crisis protocol and a flag', async () => {
  const calls = mockAnthropic('i hear you.');
  const res = await worker.fetch(req('/chat', msgs('i want to kill myself')), { ANTHROPIC_API_KEY: 'k' });
  const body = await res.json();
  assert.equal(body.crisis, true);
  assert.match(calls[0].system, /988/);
});

test('crisis messages still get resources if the API fails', async () => {
  mockAnthropic('', 500);
  const res = await worker.fetch(req('/chat', msgs('i want to die')), { ANTHROPIC_API_KEY: 'k' });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.match(body.text, /988/);
});

test('rejects bad payloads and wrong tokens', async () => {
  mockAnthropic();
  assert.equal((await worker.fetch(req('/chat', { messages: [{ role: 'system', content: 'x' }] }), {})).status, 400);
  assert.equal((await worker.fetch(req('/chat', { messages: [{ role: 'user', content: 'x'.repeat(2001) }] }), {})).status, 400);
  assert.equal((await worker.fetch(req('/chat', msgs('hi')), { APP_TOKEN: 'abc' })).status, 403);
  assert.equal((await worker.fetch(req('/chat', msgs('hi'), { 'X-Abloom-Token': 'abc' }), { APP_TOKEN: 'abc', ANTHROPIC_API_KEY: 'k' })).status, 200);
});

test('rate limiter and daily cap return 429', async () => {
  mockAnthropic();
  const limited = { BURST_LIMITER: { limit: async () => ({ success: false }) }, ANTHROPIC_API_KEY: 'k' };
  assert.equal((await worker.fetch(req('/chat', msgs('hi')), limited)).status, 429);
  const store = new Map();
  const kv = { get: async k => store.get(k) ?? null, put: async (k, v) => store.set(k, v) };
  const env = { USAGE: kv, DAILY_REQUEST_CAP: '1', ANTHROPIC_API_KEY: 'k' };
  assert.equal((await worker.fetch(req('/chat', msgs('hi')), env)).status, 200);
  assert.equal((await worker.fetch(req('/chat', msgs('hi')), env)).status, 429);
});

test('report endpoint accepts a flag', async () => {
  const orig = console.log; console.log = () => {};
  const res = await worker.fetch(req('/report', { reply: 'x', reason: 'it reassured me' }), {});
  console.log = orig;
  assert.equal((await res.json()).ok, true);
});
