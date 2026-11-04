---
name: ns-prd
description: Writes the mobile-aware NowStack Mobile PRD. Runs the only product discovery in the planning chain (personas, activation, paywall, platforms, IAP vs Stripe, config brief) and saves `.agents/plan/PRD.md`. Use when writing a PRD, defining an app idea, or `/ns prd`.
disable-model-invocation: true
---

# ns-prd

Own product discovery. `$ns-architecture`, `$ns-tasks`, `$ns-plan-pricing`, and `$ns-init-project` read `.agents/plan/PRD.md` instead of asking again, so capture everything they need here.

## Inspect

1. If `.agents/plan/PRD.md` exists, read it and ask: refine or overwrite. Refine asks only about missing or changed sections.
2. Read `site-config.ts` and what the user already said in this conversation. Never re-ask a known fact.

## Discover

Ask 2-3 questions per turn, then stop until the user answers (AGENTS.md > User Questions); never auto-select an answer. Push vague answers to specifics.

1. Problem, target user, why now, differentiation.
2. 1-3 personas: context, pain, install motivation, churn trigger.
3. Core loop: the one job, 3-5 must-haves (help cut the rest), nice-to-haves.
4. Mobile shape: platforms (iOS / Android / web `/app`), offline, push, camera/media, onboarding steps, activation moment.
5. Monetization: free / one-time / subscription, price intent, what the paywall gates. iOS uses Apple IAP, Android and web use Stripe (`.agents/rules/auth-payments-storage.md`).
6. Metrics (activation %, D7 retention, paywall conversion; reject "engagement") and an explicit not-in-v1 list.
7. Config brief: title, slug, bundleId, one-line description, company/legal name, domain, brand colors, admin emails, IAP product id intent. Unknown = `TBD`; never invent.

Do not write until 1-6 are concrete.

## Write `.agents/plan/PRD.md`

2-3 pages, sections in this order:

- Product Vision: problem, solution, why a mobile app.
- Platforms & Monetization: ships on, model, price, paywall line.
- Personas.
- Core Loop.
- MVP Features: each with description, user value, success metric.
- Key Flows: onboarding -> activation, primary journey, paywall trigger.
- Out of Scope (v1).
- Success Metrics.
- Config Brief: the item-7 fields.
- Open Questions.

## Return

Report the path and open questions. Next: `$ns-architecture`. Stop; do not design schema or write tasks.
