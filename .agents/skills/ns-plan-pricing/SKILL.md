---
name: ns-plan-pricing
description: Designs and validates pricing for a paid NowStack Mobile app. Reads the PRD and architecture, researches competitors, sets access model, value metric, and plans in `.agents/plan/PRICING.md`, then hands approved plans to billing. Use for `/ns pricing`, paywall plans, or subscriptions.
argument-hint: "[path-to-prd]"
disable-model-invocation: true
---

# ns-plan-pricing

Produce a reviewable pricing plan. Do not edit billing code, create Stripe or store products, or store credentials here.

## Inspect

1. Read the PRD (argument path, else `.agents/plan/PRD.md`) and `.agents/plan/ARCHITECTURE.md` in full. No PRD: run `$ns-prd` and stop.
2. Take personas, activation event, core loop, platforms, monetization model, price intent, and paywall line from the PRD as the starting hypothesis. Never re-ask them.
3. Read `references/pricing-methods.md`. Use `templates/PRICING.md` as the output contract.

## Act

1. Brief: summarize what is known, then ask only unresolved items in one batch: growth goal and segment, cost of the problem, natural unit of value, free/trial/annual constraints, any willingness-to-pay evidence. User guesses are hypotheses; never invent willingness to pay, conversion, value, or market prices.
2. Access model: choose freemium, free trial, reverse trial, paid-first, or hybrid from evidence. The free tier must reach the PRD activation event and must not be an unbounded cost sink.
3. Market: with the available web search, record 5-10 competitors from official pricing pages or store listings: URL, access date, currency, period, model, value metric, prices, free/trial shape, limits. Separate facts from inference; do not average competitors into a price.
4. Value metric: score candidates on the seven criteria; prefer one primary metric.
5. Price: per persona, show `value x capture` math, cross-checked against alternatives, store commission, and margin floor.
6. Package: one to three paid plans plus an optional free tier. Per plan: target and job, monthly and annual price, allowance and abuse guardrail, 3-5 material inclusions, upgrade trigger, top objections.
7. Validation: assumptions, events to instrument via `$ns-analytics`, and experiments with decision thresholds.
8. Write `.agents/plan/PRICING.md` with sources and an as-of date. Present the recommendation and its strongest trade-off; ask the user to approve or revise.

## After approval

1. Update the PRD Platforms & Monetization and Config Brief (IAP product ids) to match, so `$ns-init-project` applies them. Flag architecture or task files whose gating no longer matches.
2. Ask separately whether to implement billing and on which target; default test. Live or production needs fresh confirmation.
3. On yes, pass the approved Stripe matrix (web and Android only) to `$ns-setup-stripe`. iOS stays on Apple IAP; its product ids go through `$ns-init-project` (`site-config.ts`, `mobile-app/App.storekit`).

Pricing approval is not approval to create Stripe objects, change production data, deploy, or publish store products.

## Return

Report the path, recommendation, open decisions, and whether billing was handed off. Next: `$ns-init-project`. Stop.
