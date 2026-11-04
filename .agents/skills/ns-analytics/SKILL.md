---
name: ns-analytics
description: Integrates privacy-safe PostHog analytics on mobile and web. Audits existing tracking, defines one event dictionary, wires identify and consent, separates dev from prod, and proves events. Use for analytics, PostHog, event tracking, funnels, feature flags, or consent.
argument-hint: "[--prod]"
disable-model-invocation: true
---

# Analytics

Default: a development PostHog project. `--prod`: the production project; never send dev traffic to it or reuse its token in dev.

## 1. Inspect

Read `mobile-app/lib/posthog.ts`, `mobile-app/lib/auth-store.tsx`, `safeCapture` call sites, `mobile-app/app.config.ts` (`POSTHOG_PROJECT_TOKEN`, `POSTHOG_HOST`), web root providers, and the privacy copy. The web app ships without PostHog.

## 2. Invariants

- Public project tokens may live in public app env; personal API keys never do.
- Never capture email, OTP, tokens, free text, user content, payment data, file names, or secrets. `auth-store.tsx` currently sends email and name to `identify`: remove them when auditing.
- Identify only after auth with the opaque user id; reset on sign-out and account switch.
- Consent/opt-out matches the product's jurisdictions and privacy copy.
- Autocapture and session replay stay off until justified and scrubbed on both surfaces.

## 3. Act

1. Define the event dictionary from product questions: `onboarding_started`, `onboarding_completed`, `sign_in_succeeded`, `paywall_viewed`, `purchase_succeeded`, plus domain activation events, each with allowed properties and an owner.
2. Reuse `mobile-app/lib/posthog.ts`; add one parallel web helper only if absent. No direct SDK calls from components.
3. Gate init and capture on a configured token and consent; missing analytics stays non-fatal.
4. Wire identify/reset and screen/page context in Expo Router and TanStack Router.
5. Set the token: dev in the app `.env` (see `.env.example`); `--prod` in the EAS production environment and the web production env. Tag every event with an environment property when projects are shared.
6. Update privacy and store declarations when collection changes.

## 4. Prove

In the PostHog live events view for the target project, capture one anonymous, one authenticated, one conversion, one opt-out, and one sign-out/reset path. Inspect payloads for forbidden fields and the correct environment.

Return the event dictionary, changed owners, consent behavior, PostHog read-back, rejected PII fields, and anything `NOT VERIFIABLE`.
