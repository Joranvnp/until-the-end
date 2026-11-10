---
name: ns-convex
description: Route NowStack Mobile Convex work to the right skill. Use for underspecified Convex backend, schema, auth, migration, performance, component, or env tasks.
disable-model-invocation: true
---

# ns-convex

1. Read `convex/_generated/ai/guidelines.md` and `.agents/rules/convex.md` before editing anything under `convex/`. Convex is already configured; never run a generic Convex quickstart.
2. Route to the matching skill when one fits:
   - Auth setup or repair: `$convex-setup-auth`
   - Reusable Convex component: `$convex-create-component`
   - Schema or data migration: `$convex-migration-helper`
   - Performance or subscription cost: `$convex-performance-audit`
   - Bandwidth, indexes, full scans, documents read: `$convex-cost-optimizer`
   - Admin access: `$ns-set-admin`
   - Service env vars: the owner listed in `$ns-check-setup`
3. Otherwise implement directly, keeping auth, payment, and storage behavior working for both `web-app/` and `mobile-app/`.
4. Verify:
   ```bash
   npx convex dev --once
   cd web-app && npm run typecheck
   cd mobile-app && npx tsc --noEmit
   ```
