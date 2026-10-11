# Changelog

## 1.1.0 — launch-ready rebuild (October 2026)

### Why
Most mental-health apps keep only about 3–4% of users at day 30. The apps that do better show up at the moment of need, build attachment without punishing people, and get users practising early. For OCD in particular, streak counters, notification badges and reassuring chatbots can feed the disorder. This release rebuilds Abloom around those findings. See `docs/product-research.md`.

### Bug fixes
- **Missing a day no longer shrinks the plant.** In 1.0, breaking a streak reset the plant to a seedling, even though onboarding promised it would never die. Growth is now counted in "water days", meaning days with at least one watering. A missed day pauses growth and never undoes it.
- **Several lines gave reassurance, which ERP avoids.** Examples: "nothing bad happens if you sit with it", "the feared thing almost never happens" and "your brain is lying to you". There was also a streak-guilt line in the struggling sheet. All of these were rewritten.
- **"What you resist, persists" was removed.** It was a confusing quote for an app about resisting compulsions.
- Random values computed during render made water drops jump around. Fixed.
- The calendar used the full window width, which broke on tablets and desktop web. Fixed.
- Haptics no longer throw on web.
- The app no longer opens on the "my ocd" setup tab for returning users.
- Saving is now debounced and keeps a last-good copy, so a failed write can't wipe data.

### New: core loop
- **"i have an urge"** walks through the urge: name it, rate it, then choose to **resist, delay or shrink** the compulsion. Then ride it out with a timer and uncertainty-tolerance prompts, rate it again, and water the plant. Partial wins count. Slips are logged kindly and don't water the plant.
- **One-tap logging** for urges you already handled, with **undo**.
- **Plant naming**, an idle sway animation, a celebration at each stage, and a forest for bloomed plants.

### New: ERP
- **Exposure ladder**: add steps with a 0–10 difficulty rating. The app suggests the next step, and starter ideas are tailored to your compulsion types.
- **Guided exposure** built around inhibitory learning: make a prediction, rate anxiety before, during and after, debrief on whether the prediction happened and what you learned. Exposures water the plant.
- **7-day "1-minute read" series** on how OCD works, unlocking one lesson a day.

### New: safety and privacy
- **Crisis resources**: 988 call and text, Crisis Text Line, Samaritans and findahelpline.com. They're in the struggling sheet, the urge flow, settings and the AI chat.
- **AI companion guardrails:**
  - a consent screen before anything is sent (Apple 5.1.2(i))
  - client- and server-side crisis detection
  - a **report** button on every reply (Google Play AI policy)
  - a gentle pause after 10 messages and a stop at 24, to limit reassurance loops
  - a rewritten system prompt
- **AI proxy hardening**: per-IP rate limits, an optional daily cap, an optional app token, payload limits, safe failure, and crisis fallback text even if the API is down.
- **Calm mode** hides all numbers, charts and progress bars.
- **Data controls**: back up, restore, share a therapist summary, delete everything.
- **Disclaimer** and a link to the IOCDF therapist directory.

### New: retention and measurement
- One optional daily local reminder, offered after the first watering. No badges.
- Privacy-safe analytics: a funnel of events (PostHog via plain HTTP), off unless both a key is configured and the user opts in.
- An error boundary, so a crash shows a friendly screen instead of a blank one.

### Design
- **Design system**: colour tokens tuned for AA contrast, Nunito for body text with Caveat kept for headings, Ionicons, consistent spacing, and 44pt+ touch targets.
- **Accessibility**: screen-reader labels and roles throughout, reduced-motion support and dynamic type limits.
- **Layout**: a phone-width centred layout on tablets and desktop web.
- **Structure**: the 1,200-line single file is now split into `theme`, `content`, `lib`, `state`, `components`, `flows` and `screens`.

### Launch kit
- Square app icon, adaptive icon, splash and favicon.
- `eas.json` build profiles.
- Docs: `PRIVACY.md`, `docs/launch-checklist.md`, `docs/store-listing.md` and `docs/ad-copy.md`.
- Unit tests for the data model, migrations and the AI proxy (`npm test`).
