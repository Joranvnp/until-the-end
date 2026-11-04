# Pricing Strategy: {product_name}

**Status:** Draft | Approved
**Research date:** {YYYY-MM-DD}
**PRD:** `.agents/plan/PRD.md` · **Architecture:** `.agents/plan/ARCHITECTURE.md`

## Recommendation

{access model, value metric, price range, strongest trade-off}

## Evidence And Unknowns

| Decision | Evidence (ladder level) | Confidence | Unknown or test needed |
| --- | --- | --- | --- |

## Access Model

- **Motion:** Freemium | Free trial | Reverse trial | Paid-first | Hybrid
- **Activation event:** {from PRD}
- **Time-to-value:** {estimate and evidence}
- **Upgrade trigger:** {one sentence}
- **Cost and abuse guardrails:** {limits}

## Market Research

| Competitor | Source and access date | Model | Value metric | Public prices | Free/trial | Key limits |
| --- | --- | --- | --- | --- | --- | --- |

## Value Metric

| Candidate | Understandable | Fair | Value correlation | Measurable | Adoption | Expansion | Predictable | Decision |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |

## Price Hypotheses

| Persona | Value calculation | Capture | Market cross-check | Range | Confidence |
| --- | --- | --- | --- | --- | --- |

## Plans

| Plan | Target and job | Monthly | Annual | Allowance | Inclusions | Upgrade trigger | Top objection and answer |
| --- | --- | ---: | ---: | --- | --- | --- | --- |

## Unit Economics

- **Variable cost drivers:** {drivers}
- **Store commission and margin floor:** {assumptions}
- **Bill-shock and abuse controls:** {caps, alerts, limits}

## Validation Plan

| Hypothesis | Method | Sample | Success metric | Guardrail | Decision threshold |
| --- | --- | --- | --- | --- | --- |

## Platform Billing Map

| Surface | Billing owner | Product/price intent | Notes |
| --- | --- | --- | --- |
| iOS | Apple IAP | {product ids} | Entitlement parity with Stripe |
| Android | Stripe or store policy | {intent} | Verify current policy |
| Web | Stripe | {intent} | |

## Approved Stripe Matrix

Fill only after pricing approval.

| Plan | Monthly price | Annual price | Trial/free shape | Entitlement | Stripe target |
| --- | ---: | ---: | --- | --- | --- |

## Decisions

- [ ] Pricing approved by the user
- [ ] PRD monetization and Config Brief updated
- [ ] Billing implementation separately approved (test target)
- [ ] Live/production change separately confirmed, if any
