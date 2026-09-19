# 🌱 Abloom

A gentle companion app for people with OCD, built in React Native + Expo. Instead of a clinical tracker, Abloom reframes resisting a compulsion as an act of growth: every time you sit with the urge instead of giving in, you water a plant. Over 20 days of consistent resistance it grows from a seedling into full bloom, then starts again — tree by tree, building a forest.

No clipboards, no clinical language. Just you, your courage, and a plant that grows when you do.

## Features

- **Onboarding** — a short 3-card intro explaining how the app works, skippable at any point
- **My OCD tab** — search a built-in library of common compulsions (checking, contamination, reassurance-seeking, mental rituals, symmetry, avoidance) or add your own in your own words
- **Grow tab** — water your plant each time you resist a tracked compulsion; get a random encouragement, a level-up animation as your plant advances through 5 stages (Seedling → Tiny Sapling → Bigger Sapling → Young Tree → Full Bloom), and a "gentle heads up" if you log a lot in one day
- **Forest / rebirth** — once a plant hits full bloom, "replant" it into your forest and start growing the next one; your streak, best streak, and lifetime total carry through
- **I'm struggling** — an in-the-moment support menu with:
  - a paced breathing exercise (4-4-6-2 box breathing with an animated ring)
  - 5-4-3-2-1 grounding steps
  - an urge-surfing timer that logs your anxiety over time so you can watch it rise and fall
- **Exposure & Response Prevention (ERP) sessions** — a guided flow: pick what you're facing, name your feared outcome, rate pre-exposure anxiety, run a live timer with anxiety check-ins, then debrief on whether the feared thing actually happened
- **Discover tab** — a chat companion (Claude API) that helps identify specific compulsions and gently names cognitive distortions (catastrophizing, black-and-white thinking, thought-action fusion, intolerance of uncertainty, etc.) without giving reassurance
- **Journey tab** — a 35-day activity calendar (GitHub-contributions style), a breakdown of your most-resisted compulsions, and your ERP session history

## Tech stack

- [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/)
- `@react-native-async-storage/async-storage` — local persistence
- `expo-haptics` — tactile feedback on key actions
- `expo-linear-gradient`
- `react-native-safe-area-context`
- Anthropic Claude API — powers the Discover tab's chat companion
- Custom fonts: **Caveat** (headings) and **Coming Soon** (body) for a hand-drawn feel

## Getting started

### Prerequisites

- Node.js and npm/yarn
- Expo CLI (`npm install -g expo-cli`)
- An iOS Simulator, Android Emulator, or the Expo Go app on a physical device

### Installation

```bash
git clone <your-repo-url>
cd abloom
npm install
```

### Environment setup

The Discover tab calls `https://api.anthropic.com/v1/messages` directly from the client. Before running the app, wire up your Anthropic API key. For anything beyond local testing, route this call through a small backend/proxy instead of shipping the key inside the app bundle.

### Assets

The app expects these images at `../assets/images/` relative to the main component:

```
stage0.png … stage4.png   # the 5 plant-growth illustrations
flower.png                # decorative flower used in the background and onboarding
```

### Running the app

```bash
npx expo start
```

Then press `i` for iOS, `a` for Android, or scan the QR code with Expo Go.

## How it's structured

The app is a single main component (`AbloomApp`) with local `useState`/`useEffect` state, backed by a handful of focused sub-components:

- `PlantView`, `DecorativeFlowers`, `WaterDrops`, `FloatPlus` — the plant and watering visuals
- `Chip`, `AnxietyPicker`, `AnxietyCurve` — small shared inputs
- `Breathing`, `UrgeTimer` — the two standalone "I'm struggling" tools
- `ERPSession` — the multi-step guided exposure flow (`pick → pre → timer → post → done`)
- `Cal`, `Insights`, `ERPHistory` — the Journey tab's calendar, compulsion breakdown, and session history

Navigation is a simple bottom tab bar with four views: **my ocd** (`setup`), **grow** (`home`), **journey** (`journey`), and **discover** (`ai`) — no navigation library, just local state.

All app data (active/custom compulsions, log history, streak, forest, ERP sessions) is persisted to AsyncStorage under the `abloom-data` key; onboarding completion is stored separately under `abloom-onboarded`.

## Disclaimer

Abloom is a self-help tool, not a substitute for therapy or medical care. It is not a licensed treatment and does not diagnose OCD. If you're struggling, please reach out to a mental health professional.

## License

Add your license here.
