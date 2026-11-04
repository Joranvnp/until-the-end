---
name: ns-setup-app-onboard
description: Designs and verifies the end-user onboarding journey. Improves the NowStack Mobile first-launch to activation flow (screens, auth, permission, and paywall timing). Use for "app onboarding", "activation", `/ns app-onboarding`; not for repo setup, which is `$ns-onboard`.
disable-model-invocation: true
---

# ns-setup-app-onboard

Own the end-user journey from first launch to the first meaningful product outcome. Repo and machine setup belong to `$ns-onboard`.

## Inspect

1. Read `.agents/plan/PRD.md` Key Flows and Success Metrics if present; do not re-ask its answers.
2. Read `.agents/rules/mobile-app.md`, then the current flow: `mobile-app/app/onboarding/`, `mobile-app/components/onboarding/content.ts`, `mobile-app/components/onboarding/use-onboarding-flow.ts`, `mobile-app/lib/auth-store.tsx`, `mobile-app/app/(flow)/paywall.tsx`, `mobile-app/lib/posthog.ts`.
3. Establish what is still unknown: target user, promised outcome, activation event, minimum input before activation, permission / auth / paywall timing, skip and back behavior, returning users, progress across cold relaunch.

## Act

1. Map the current funnel and its measurable activation event.
2. Propose the smallest screen or state change with keep/change rationale. Get product direction before a material redesign.
3. Implement with the existing theme, UI primitives, auth store, and paywall; no parallel state machine. Use `building-native-ui` and `vercel-react-native-skills` where they apply; images via `$ns-images`.
4. Ask permissions in context, never as a first-launch wall. Keep resumability, safe-area and keyboard behavior, reduced motion, and small-screen layouts.
5. Instrument intent and outcome events through `$ns-analytics`; no raw email, free text, or tokens.

## Verify

Through `$ns-ios-verification` (and Android when behavior is shared): fresh account, interrupted and resumed onboarding, existing account, cold relaunch, keyboard, accessibility.

## Return

Report the funnel change, activation instrumentation, and any platform left `NOT VERIFIABLE`. Stop.
