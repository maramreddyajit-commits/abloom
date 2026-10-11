// Crisis resources. Verified October 2026 — re-check before each release.
export const CRISIS_RESOURCES = [
  { id: 'us-988-call', region: 'US', label: 'call 988', detail: 'Suicide & Crisis Lifeline, 24/7', url: 'tel:988', icon: 'call-outline' },
  { id: 'us-988-text', region: 'US', label: 'text 988', detail: 'Suicide & Crisis Lifeline by text', url: 'sms:988', icon: 'chatbox-outline' },
  { id: 'us-ctl', region: 'US', label: 'text HOME to 741741', detail: 'Crisis Text Line', url: 'sms:741741&body=HOME', icon: 'chatbox-ellipses-outline' },
  { id: 'uk-samaritans', region: 'UK & IE', label: 'call 116 123', detail: 'Samaritans, free, 24/7', url: 'tel:116123', icon: 'call-outline' },
  { id: 'intl', region: 'anywhere', label: 'find a helpline', detail: 'findahelpline.com lists free services by country', url: 'https://findahelpline.com/', icon: 'globe-outline' },
];

export const EMERGENCY_LINE = 'if you’re in immediate danger, call your local emergency number (911 in the US).';

// Phrases that suggest the person may be thinking about suicide or hurting themselves.
// This is intentionally about *self*-harm intent. Intrusive harm thoughts about others are a
// very common OCD theme and are handled by the companion's prompt rather than by this check.
const PATTERNS = [
  /\bkill(ing)?\s+my\s*self\b/i,
  /\bsuicid(e|al)\b/i,
  /\bend(ing)?\s+(it\s+all|my\s+life|my\s+own\s+life)\b/i,
  /\btake\s+my\s+(own\s+)?life\b/i,
  /\bwant(ed)?\s+to\s+die\b/i,
  /\b(don'?t|do\s+not)\s+want\s+to\s+(be\s+alive|live|exist|wake\s+up)\b/i,
  /\bbetter\s+off\s+dead\b/i,
  /\bself[\s-]?harm(ing)?\b/i,
  /\b(hurt|cut|harm)(ing)?\s+my\s*self\b/i,
  /\bno\s+reason\s+to\s+live\b/i,
  /\boverdos(e|ing)\b/i,
];

export const looksLikeCrisis = text => !!text && PATTERNS.some(p => p.test(text));
