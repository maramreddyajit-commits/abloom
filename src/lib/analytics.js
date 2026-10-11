// Privacy-safe product analytics.
//
// - Off unless BOTH a PostHog project key is configured (EXPO_PUBLIC_POSTHOG_KEY) AND the user
//   opted in (Settings → "help improve abloom"). Apple 5.1.1(ii) requires consent even for
//   anonymous analytics.
// - Uses a random install id. No names, no free text, no compulsion names, no chat content.
//   Only the event names and small numeric/enum properties listed in EVENTS are ever sent.
import { Platform } from 'react-native';
import { getItem, setItem } from './storage';

const KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const HOST = (process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com').replace(/\/$/, '');
const APP_VERSION = '1.1.0';

// The funnel that tells you whether ads are working: install → onboarding → first water → return.
export const EVENTS = {
  app_open: ['days_since_install'],
  onboarding_complete: ['compulsions_count'],
  water: ['action', 'source', 'water_days'],
  urge_flow_complete: ['action', 'urge_before', 'urge_after', 'seconds'],
  urge_flow_slip: [],
  exposure_complete: ['suds_before', 'suds_after', 'seconds'],
  ladder_rung_added: [],
  lesson_read: ['lesson'],
  reminder_set: ['enabled'],
  plant_bloomed: [],
  ai_consent: ['granted'],
  ai_message: ['crisis'],
  ai_report: [],
  struggle_open: [],
  share_summary: [],
  app_error: ['where'],
};

let enabled = false;
let distinctId = null;

export async function initAnalytics(optedIn) {
  enabled = !!KEY && !!optedIn;
  if (!enabled || distinctId) return;
  distinctId = await getItem('abloom-anon-id');
  if (!distinctId) {
    distinctId = `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    await setItem('abloom-anon-id', distinctId);
  }
}

export const setAnalyticsEnabled = optedIn => initAnalytics(optedIn);
export const analyticsAvailable = () => !!KEY;

export function track(event, props = {}) {
  if (!enabled || !distinctId) return;
  const allowed = EVENTS[event];
  if (!allowed) return;
  const clean = {};
  allowed.forEach(k => {
    const v = props[k];
    if (typeof v === 'number' || typeof v === 'boolean' || (typeof v === 'string' && v.length <= 24)) clean[k] = v;
  });
  fetch(`${HOST}/capture/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: KEY,
      event,
      distinct_id: distinctId,
      properties: { ...clean, platform: Platform.OS, app_version: APP_VERSION, $process_person_profile: false },
    }),
  }).catch(() => {});
}
