---
name: convex-setup-auth
description: Set up or repair NowStack Mobile authentication with Better Auth on Convex, shared across Expo and TanStack Start. Use for auth configuration, protected functions, provider parity, user mapping, and deployment-specific credentials.
disable-model-invocation: true
---

# Convex Auth Setup - NowStack Mobile

<stack_boundary>
This repository has already chosen Better Auth through `@convex-dev/better-auth`. Do not propose Clerk, Auth0, WorkOS, Convex Auth, Firebase, or a parallel identity store unless the user explicitly requests a migration and accepts its cross-surface impact.
</stack_boundary>

<required_reads>
Before editing, read:

1. `convex/_generated/ai/guidelines.md`
2. `.agents/rules/convex.md`
3. `.agents/rules/auth-payments-storage.md`
4. `convex/auth.ts`, `convex/auth.config.ts`, `convex/http.ts`
5. `convex/functions.ts`, `mobile-app/lib/auth-client.ts`, `mobile-app/lib/auth-store.tsx`
6. the matching web auth client/components under `web-app/app/`
</required_reads>

<invariants>
- Mobile and web share one Better Auth + Convex identity backend.
- Protected Convex functions use the repo builders in `convex/functions.ts`; authorization derives identity server-side.
- Never accept client `userId` as authorization evidence.
- Use `identity.tokenIdentifier` as the stable identity key.
- Social buttons on both surfaces come from `api.auth.getEnabledAuthProviders`; a flag alone never renders a provider.
- Every deployment has separate OAuth secrets and registered callback URLs.
- Secrets enter Convex env through stdin, never CLI arguments, tracked files, logs, or chat.
- App Review login uses deployment-scoped `APP_REVIEW_EMAIL` and random six-digit `APP_REVIEW_OTP`; no public fixed credentials.
</invariants>

<workflow>
1. Diagnose the existing flow from backend configuration through mobile and web callers. Do not replace working auth architecture for a local symptom.
2. Identify the deployment (`dev` or `prod`) and enabled providers in `site-config.ts`.
3. For provider setup, delegate to `ns-setup-google-auth` or `ns-setup-apple-auth`; production resources must be dedicated to production.
4. For email OTP, use `ns-setup-email` and verify a real delivery. Configure App Review credentials separately and rotate them after exposure/review.
5. Implement the smallest backend/client change that preserves provider parity and account ownership.
6. Run `npx convex dev --once`, mobile TypeScript/lint, and web typecheck.
7. Verify signed-out, sign-in, signed-in, sign-out, cold relaunch, and protected-route behavior on every changed surface. Production proof that requires unavailable credentials is `NOT VERIFIABLE`, never assumed.
</workflow>

<secret_example>
```bash
read -rsp "Secret value: " VALUE; echo
printf '%s' "$VALUE" | npx convex env set <KEY>
unset VALUE
```
</secret_example>

<success_criteria>
- Better Auth remains the only identity owner.
- Mobile and web expose only providers that are both enabled and configured.
- Protected functions derive identity and enforce ownership/role checks server-side.
- No secret or reviewer credential appears in source, argv, output, or docs.
- Changed auth journeys have runtime evidence on the real surfaces.
</success_criteria>
