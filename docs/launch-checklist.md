# Launch checklist

Work through this in order. Items marked ✅ are done in the code. ☐ items need you: an account, a decision, or a real device.

## 1. Before anything else
- ☐ **Set an Anthropic spend limit** at console.anthropic.com → Settings → Limits. This is your strongest protection against a surprise bill. The proxy's rate limits are a second layer.
- ☐ **Decide who publishes.** Apple guideline 5.1.1(ix) prefers apps in health-adjacent fields to come from a legal entity, not an individual. An LLC is safest. It also keeps your personal name off the store listing.
- ☐ **Get a support email** and replace `support@abloom.app` in `src/content/copy.js` and in `PRIVACY.md`.
- ☐ **Host the privacy policy at a public URL.** GitHub Pages is free. Update `PRIVACY_URL` in `src/content/copy.js`. Both stores require this.
- ☐ **Check the bundle ID.** `com.abloom.app` is probably taken. Pick your own, such as `com.yourname.abloom`, in `app.json`.

## 2. AI companion
- ✅ Proxy code with rate limits, crisis handling and a report endpoint.
- ☐ Deploy the proxy:
  ```
  cd server/ai-proxy
  npx wrangler login
  npx wrangler secret put ANTHROPIC_API_KEY
  npx wrangler secret put APP_TOKEN        # any random string
  npx wrangler kv namespace create USAGE   # paste the id into wrangler.toml and uncomment
  npx wrangler deploy
  ```
- ☐ Copy `.env.example` to `.env`. Set `EXPO_PUBLIC_AI_PROXY_URL` to the worker URL and `EXPO_PUBLIC_AI_APP_TOKEN` to the same random string.
- ☐ Try 10 test conversations, including a reassurance loop ("are you sure it's fine?" repeated) and a crisis phrase. Read `npx wrangler tail` output for reports.
- ☐ Fill in the Anthropic data-retention line in `PRIVACY.md`.

## 3. Analytics (strongly recommended before ads)
- ☐ Create a free PostHog project. Set `EXPO_PUBLIC_POSTHOG_KEY` in `.env`.
- ☐ Build a funnel: `onboarding_complete` → `water` → `app_open` on day 1 and day 7.
- ✅ Off by default. Users opt in during onboarding or in settings (Apple 5.1.1(ii)).
- ☐ Ad attribution is not built yet; it needs an MMP or Meta's SDK. Start by comparing install counts from the ad platform against `onboarding_complete` in PostHog.

## 4. Builds
- ☐ `npm install -g eas-cli`, `eas login`, `eas init` (this fills in `projectId`).
- ☐ `eas build -p ios --profile production` and `eas build -p android --profile production`.
- ☐ Test on real phones:
  - reminders fire at the chosen time
  - a crisis link opens the dialer or SMS
  - backup shares a file and restore works
  - the AI chat works over cellular
- ☐ Android: Expo SDK 54 targets API 36, which Google Play has required for new apps since 31 Aug 2026.

## 5. Store forms
- ☐ **Apple App Privacy label.** Answers for this build:
  - **User Content → Other User Content** (AI chat messages, only if the companion is enabled). Purpose: App Functionality. Not linked to identity. Not used for tracking.
  - **Usage Data → Product Interaction** (only if PostHog is configured). Purpose: Analytics. Not linked. Not tracking.
  - **Diagnostics:** none, unless you add crash reporting.
  - Logs stored on the device count as "not collected."
- ☐ **Apple age rating.** Answer "Medical/Treatment Information: Infrequent" and "Health or Wellness Topics: Yes", which most likely gives 13+.
- ☐ **Google Play Data safety.** Mirror the Apple answers: Messages → "Other in-app messages" (collected, not shared, processed ephemerally by our server) and App activity → App interactions (analytics, optional).
- ☐ **Google Play Health apps declaration.** Choose "Mental and Behavioral Health". Put the non-medical-device statement in the description (it's included in `store-listing.md`).
- ✅ **Google Play AI-generated content.** In-app reporting is on every AI reply.
- ☐ **Screenshots.** See `store-listing.md` for the shot list.

## 6. Ads
- ☐ Read `docs/ad-copy.md`. Meta rejects ads that imply the viewer has a condition ("Do you have OCD?").
- ☐ Start small: about $20–50/day for 7–10 days. Judge by **D7 retention and the cost per onboarded user**, not the cost per install.

## 7. Still worth doing soon after launch
- ☐ Crash reporting. Add `@sentry/react-native`; it needs a dev build.
- ☐ A home-screen widget showing your plant with a one-tap "i have an urge". The research says this is the biggest retention lever, but it needs native code.
- ☐ Dark mode, for urges at 2am.
- ☐ iCloud and Android backup. Apple 5.1.3 says health data shouldn't live in iCloud. AsyncStorage files can be included in device backups, so decide whether to exclude them in a native build.
- ☐ A professional icon and illustration pass.
