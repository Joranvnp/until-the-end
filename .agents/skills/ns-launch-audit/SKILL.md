---
name: ns-launch-audit
description: Issues a read-only GO or NO-GO launch verdict for NowStack Mobile. Audits product, web, iOS, Android, backend, auth, payments, email, storage, analytics, stores, and operations with evidence. Use before launch or for launch readiness.
---

# Launch Audit - NowStack Mobile

Fail closed. Never edit, install, deploy, build, upload, submit, or change provider state; route findings, never repair them.

## Gather evidence (all read-only)

1. `$ns-check-setup` in development, `--accounts`, and `--prod` modes.
2. `$ns-ios-audit` for App Store readiness.
3. `$ns-security-audit` in `audit` mode.
4. `$ns-verify --read-only` for existing runtimes. Never run `npx convex dev --once` from this audit.
5. Provider state only with credentials already available; otherwise `NOT VERIFIABLE`.

## Matrix

1. Product/config: placeholders, legal/support URLs, `site-config.ts` vs `convex/siteConfig.ts` mirrors, one version across `site-config.ts`, `mobile-app/app.config.ts`, `mobile-app/package.json`.
2. Backend: Convex compile state, schema/index/auth boundaries, production env presence.
3. Web: production build, SSR routes `/`, `/privacy`, `/cgv`, `/support`, `/app`, `/admin`, auth gates.
4. iOS: exact TestFlight build and App Review readiness.
5. Android: exact internal-track build, package/account/track, listing and Data safety.
6. Auth: provider parity, production-specific OAuth, private reviewer credentials, account deletion.
7. Money/data: Apple IAP, Stripe live objects, R2 target and public exposure, email delivery.
8. Analytics/privacy: consent, PII policy, dev/prod separation, store privacy declarations.
9. Operations: rollback, monitoring, support ownership, credential rotation.

## Verdict

`GO` only with zero blockers and zero required `NOT VERIFIABLE`. Return blockers, warnings, manual gates, verified strengths, and the shortest ordered fix path with one owner skill per item (e.g. `$ns-publish-to-production`, `$ns-setup-stripe`, `$ns-web-deploy`).
