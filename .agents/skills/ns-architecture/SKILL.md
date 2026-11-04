---
name: ns-architecture
description: Maps the NowStack Mobile PRD onto the stack. Reads `.agents/plan/PRD.md` and the real codebase, then writes `.agents/plan/ARCHITECTURE.md` with Convex tables, functions, screens, entitlements, and build order. Use after `$ns-prd`, for `/ns architecture` or technical planning.
disable-model-invocation: true
---

# ns-architecture

Map the PRD onto the fixed stack (Convex, Expo Router, Better Auth, Apple IAP/Stripe, R2, TanStack Start). Do not choose a stack. Do not re-run discovery.

## Inspect

1. Read `.agents/plan/PRD.md`. Missing: run `$ns-prd` and stop.
2. Read `.agents/rules/convex.md`, `.agents/rules/mobile-app.md`, `.agents/rules/auth-payments-storage.md`, and `convex/_generated/ai/guidelines.md`. Designs must satisfy them.
3. Read what exists so you extend it: `convex/schema.ts`, the `convex/functions.ts` builders (`authQuery`, `authMutation`, `authAction`, `adminQuery`, `adminMutation`, `adminAction`), `convex/users/`, `convex/admin/`, `convex/payments/`, `convex/storage/`, `mobile-app/app/` (`(app)/(tabs)`, `(flow)/paywall.tsx`, `onboarding/`), `web-app/app/routes/`, `site-config.ts`.
4. If a PRD gap blocks a decision, ask only that question and write the answer back into the PRD. Otherwise list it under Open Questions.

## Design each PRD must-have

- Tables, key fields, and the index behind every query.
- Functions: name, builder, args -> returns; identity comes from the builder, never a client `userId`.
- Screens: Expo Router path with its group segment (`/(flow)/paywall`), tab / stack / modal, and any web `/app` route.
- Gating: which features sit behind the paywall; entitlement on the user; derived grants per the auth-payments-storage rule.
- R2 uploads and admin-only surfaces.

## Write `.agents/plan/ARCHITECTURE.md`

Only the deltas this product adds, citing real paths:

- Overview linking the PRD.
- Data Model table: table, key fields, indexes, notes.
- Function Surface table: function, builder, args -> returns, auth.
- Screens table: screen, path, type.
- Payments & Entitlements; Storage & Auth.
- ADRs: one per non-obvious choice (context, choice, trade-off).
- Build Order: foundation -> core features -> monetization -> polish.
- Open Questions.

## Return

Confirm every must-have has a table, function, and screen mapping. Report the path. Next: `$ns-tasks`. Stop.
