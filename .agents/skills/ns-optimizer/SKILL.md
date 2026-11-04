---
name: ns-optimizer
description: Optimizes NowStack Mobile Convex, Expo, and web performance. Targets read cost, subscriptions, rendering, routing, mobile UI jank, bundle size, and data fetching. Use when something is slow, expensive, or re-renders too much.
disable-model-invocation: true
---

# Optimizer - NowStack Mobile

Improve a measured slow or unbounded path without changing product behavior.

## Inspect

1. Name the surface: `convex/`, `web-app/`, `mobile-app/`, or cross-surface.
2. Read the matching rules: `.agents/rules/convex.md`, `.agents/rules/web-app.md`, `.agents/rules/mobile-app.md`, `.agents/rules/auth-payments-storage.md`. Read `convex/_generated/ai/guidelines.md` before touching `convex/`.
3. Get a real signal first: logs (`logs/*.log`), build/typecheck output, query call sites, documents read, render counts, or a reproduced slow screen. Do not refactor from taste alone.

## Route

| Signal | Path |
| --- | --- |
| Expensive Convex reads, `.filter()` scans, missing indexes | `convex-cost-optimizer` or `convex-performance-audit` |
| Schema/data shape change needing a rollout | `convex-migration-helper` |
| Web route state, `/admin` rendering, landing bundle, router behavior | edit `web-app/`; keep `/admin` dense tables |
| Mobile jank, onboarding/paywall flow, NativeWind layout, auth store | edit `mobile-app/`; keep state local unless shared across screens; stable dimensions for headers, footers, buttons |
| Auth, payments, R2, account behavior | treat Convex + web + mobile as one contract |

## Act

- Bounded indexed reads on hot paths; Convex subscriptions stay the source of truth, not copied into local stores.
- Add pagination or summary records only for measured or clearly unbounded reads.
- Reuse existing primitives and helpers (`web-app/app/components/ui/`, `mobile-app/components/ui/`, `mobile-app/lib/auth-store.tsx`) before adding libraries.
- iOS payments stay Apple IAP; Stripe logic stays in Convex.

## Verify

Narrowest set for the touched surface: `npx convex dev --once`, `cd web-app && npm run typecheck` / `npm run build`, `cd mobile-app && npx tsc --noEmit` / `npm run lint`. Prove visible behavior with `$ns-verify`. Report the before/after signal and any skipped check.
