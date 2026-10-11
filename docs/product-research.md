# Product research summary (October 2026)

This document records what shaped the 1.1 design, so future decisions can build on it.

## Retention reality
- Across 93 mental-health apps with 10k+ installs, the median keeps **69% of users on day 1, 3.9% on day 15 and 3.3% on day 30** (Baumel et al., JMIR 2019). Tracker apps did a little better. Breathing apps kept almost no one by day 15. https://www.jmir.org/2019/9/e14567
- Finch, a self-care pet, reports roughly **54% on day 1 and 37% on day 7**. Its users say they stay because they care for a named companion that never dies. Its worst reviews come from streak resets and lost progress. https://appbot.co/blog/finch-app-reviews-emotional-attachment-user-retention-product-loyalty/
- Calm found that users who set a daily reminder retained about 3× better, and prompting reminder setup after the first session got 40% adoption. https://amplitude.com/blog/2016/07/14/calm-increased-retention-amplitude/

## What helps in OCD self-help
- **Practice drives outcome.** In ERP, homework adherence in the first five sessions predicted results at six months. Optimize for **exposures done early**, not for taps.
- **Human guidance reduces dropout** in internet CBT for OCD. That's the reason for the therapist-summary feature.
- **Just-in-time help.** People with OCD want help during an episode. Therapists warn that a tool used during an episode can itself become a compulsion, so support should step down over time. https://arxiv.org/html/2501.13308v2
- **Shrink or delay rituals rather than demanding all-or-nothing.** IOCDF clinician guidance supports this, and "maybe, maybe not" is a standard uncertainty-tolerance script. https://iocdf.org/blog/2026/07/21/digital-reassurance-seeking-in-ocd/
- **Distraction and calming during exposure can become safety behaviours.** That's why breathing and grounding are labelled "outside an exposure".

## OCD-specific design risks (JMIR 2026, 24 adults with OCD)
https://www.jmir.org/2026/1/e85033
- Streaks and progress numbers fed "not-just-right" compulsions. Abloom responds with water days instead of streaks, no streak counter on the home screen, and a calm mode that hides numbers.
- Notification badges drove checking. Abloom sends one optional local reminder and never sets a badge.
- Chatbots became reassurance machines. Abloom's companion uses a no-reassurance prompt, pauses long chats, and lets users report reassuring replies.
- Heavy customization prompted ordering rituals. Abloom keeps choices minimal.

## Gamification
- A meta-analysis of 39 studies found gamification didn't change efficacy or adherence on its own. The plant works as a vehicle for attachment and visible progress, not as points.

## Product principles that follow
1. The urge moment is the core loop. It should take seconds and never be judgemental.
2. Partial wins count. Slips cost nothing.
3. Attachment comes without punishment: a named plant that never wilts.
4. Measure exposures done and D7 retention, not taps.
5. Never reassure, anywhere.
6. Make it easy to step down. Future idea: after 8+ weeks, suggest practice days without the app.

## Next bets, by expected impact
1. **Home-screen widget** showing your plant, with one-tap urge entry. Effort: M, needs native code.
2. **A "step down" or graduation flow** after about 8 weeks. Effort: S.
3. **Therapist-share PDF** with a chart. Effort: S–M.
4. **Optional peer stories,** curated rather than a live feed, because live feeds invite reassurance. Effort: M.
5. **Dark mode.** Effort: S–M.
