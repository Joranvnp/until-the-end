---
name: ns-setup-stripe
description: Configures Stripe for web and Android payments in Convex. Creates test or live Products and Prices from the approved pricing plan, sets keys safely, and keeps Apple IAP on iOS. Use when setting up Stripe, price ids, Stripe keys, webhooks, or production billing.
argument-hint: "[--prod]"
disable-model-invocation: true
---

# Setup Stripe

Default: test mode + current dev Convex deployment. `--prod`: live mode + production; add `--prod` to every `npx convex` command. Never copy a test key, test Price ID, or development webhook secret into production. Rules: `.agents/rules/auth-payments-storage.md`.

Scope: web, plus Android only when `SiteConfig.payment.providers.android` is `"stripe"` (ships `"google_play"`). iOS stays Apple IAP.

## 1. Inspect

1. If `.agents/plan/PRICING.md` (or the `PRICING.md` beside the PRD) says `**Status:** Approved`, apply only the web/Android rows of its **Approved Stripe Matrix**. Missing or Draft and the user wants pricing designed: hand off to `$ns-plan-pricing` and stop. Otherwise use `site-config.ts` `payment`.
2. Read `site-config.ts`, `convex/siteConfig.ts`, `convex/payments/stripe.ts`; read `convex/_generated/ai/guidelines.md` before editing `convex/`.
3. The shipped model is one one-time price (`payment.priceAmount`, `STRIPE_PRICE_ID`). If the plan needs subscriptions or several plans, stop and report the code change; do not add `convex/billing/plans.ts` unasked.
4. `npx convex env list | sed 's/=.*$/=<set>/'` and `stripe products list` / `stripe prices list` (`--live` for `--prod`).

## 2. Configure Stripe

1. Get explicit user confirmation before creating or changing Stripe objects; live mode needs fresh confirmation.
2. Create or verify the Product and Price matching the plan; live-mode objects only for `--prod`.
3. Webhooks: none as shipped (`convex/http.ts` has no Stripe route; `confirmPayment` / `confirmCheckoutSession` confirm payments). Only if a Stripe `http.route` handler exists, create an endpoint for exactly its events with a fresh `whsec_*` per deployment.

## 3. Set env

Ask for one secret at a time, never together with plan details. Never commit secrets.

```bash
pbpaste | npx convex env set STRIPE_SECRET_KEY
pbpaste | npx convex env set EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY
npx convex env set STRIPE_PRICE_ID "price_..."

# production (--prod): every value must be live mode
pbpaste | npx convex env set --prod STRIPE_SECRET_KEY
pbpaste | npx convex env set --prod EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY
npx convex env set --prod STRIPE_PRICE_ID "<live-price-id>"
```

Set `STRIPE_WEBHOOK_SECRET` the same way only with a handler. The mobile build reads `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` too (app `.env` per `.env.example`; EAS production env for `--prod`). Keep `site-config.ts` and `convex/siteConfig.ts` aligned.

## 4. Prove

```bash
npx convex dev --once
cd web-app && npm run typecheck && npm run build
cd mobile-app && npx tsc --noEmit
```

- Dev: complete one test-mode web checkout with `dev-browser`; confirm the entitlement.
- `--prod`: read back via Stripe API/CLI that key, Product, Price (and webhook, if any) are live mode; check env presence without values; run `npm run check-setup -- --prod`. It also demands `STRIPE_WEBHOOK_SECRET`; report that mismatch instead of inventing a secret.
- iOS: `payment.productIds.apple` and `iapProductId` are unchanged.

Return mode, Stripe object ids (no secrets), env names set, pricing rows applied or skipped, checks, and blockers.
