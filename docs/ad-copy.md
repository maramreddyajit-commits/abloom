# Ad copy (policy-safe)

## The rules that matter
- **Meta's personal-attributes rule.** An ad must not assert or imply that the viewer has a health condition. "Do you have OCD?", "Your OCD is…" and "Struggling with intrusive thoughts?" all get rejected. "You" is fine as long as it doesn't pin a condition on the viewer.
- **Health claims.** Don't use "treats", "cures", "therapy" or "clinically proven". Describe what the app *does*, not what it fixes.
- **Meta health and wellness data restrictions (2025+).** Mental-health apps may be blocked from optimizing for lower-funnel events. Plan to optimize for installs or app opens and to measure retention yourself in PostHog.
- **Google Ads.** Mental health is a sensitive category. Customer match and lookalike audiences aren't allowed, but contextual and keyword targeting are.
- **TikTok.** Target 18+ only, and don't encourage self-diagnosis.

## Three angles

### 1. The plant (curiosity, lowest friction)
- **Primary text:** Every urge you sit with helps your plant grow. Abloom is a free, private companion built on the ideas behind exposure practice.
- **Headline:** Resist an urge. Water a plant.
- **Visual:** A time-lapse of the seedling growing into a bloom with a "+1 drop" animation. Screen-record the web build.

### 2. The moment (problem-aware, without naming a condition)
- **Primary text:** When an urge to check, wash or ask "are you sure?" shows up, Abloom walks you through riding it out. You can resist it, delay it or shrink it, and every option counts.
- **Headline:** A gentle tool for the moment an urge hits
- **Visual:** A finger tapping "i have an urge", then the resist / delay / shrink cards, then the timer.

### 3. Privacy and kindness (trust)
- **Primary text:** No account. Nothing to lose if you miss a day. Your plant just waits for you. Free self-help tools for compulsions and exposure practice, kept on your phone.
- **Headline:** Free, private and kind
- **Visual:** The calm-mode toggle and the "it never wilts" onboarding card.

## Don't run these
| ❌ Rejected | ✅ Instead |
|---|---|
| Do you have OCD? Try Abloom. | Abloom: a free companion for building skills to resist compulsions. |
| Stuck checking the stove again? | Every urge you sit with helps your plant grow. |
| Abloom treats OCD in 4 weeks. | Breathing, urge-timer and exposure tools in one gentle app. Not a substitute for therapy. |
| Stop your intrusive thoughts for good. | Practise letting thoughts be there, with a plant that grows as you do. |

## Testing plan
1. Run all 3 angles × 2 visuals at about $10/day each for 5–7 days, optimizing for app installs.
2. Kill anything with a cost per `onboarding_complete` more than 2× the best performer.
3. The real decision metric is **D7 retention** per angle, which comes from PostHog. Scale the angle that keeps people, not the one with the cheapest installs.
