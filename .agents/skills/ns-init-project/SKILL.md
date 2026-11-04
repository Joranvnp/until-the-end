---
name: ns-init-project
description: Rebrand the boilerplate into a NowStack Mobile product. Applies the PRD or product brief to site-config, the Convex config mirror, web and mobile copy, StoreKit ids, and theme colors. Use for /ns setup, rebranding, renaming the app, or product brief intake.
disable-model-invocation: true
---

# ns-init-project

Turns the boilerplate into the user's product. Accounts, secrets, and env vars are not set here.

## 1. Inspect

```bash
test -f .agents/plan/PRD.md && sed -n '1,200p' .agents/plan/PRD.md
sed -n '1,240p' site-config.ts
sed -n '1,80p' convex/siteConfig.ts
rg -n "NowStack|nowstack|boilerplate|TODO" web-app/app mobile-app/app mobile-app/components convex docs site-config.ts
git status --short
```

- Brief source: `.agents/plan/PRD.md` if it exists; otherwise ask once for title, slug, bundle id, Android package, company/contact, domain, brand color, theme mode, pricing + product ids, admin emails. For full product discovery hand off to `$ns-prd`.
- Stop if the brief is too vague to fill a value. Never invent legal company, domain, pricing, store ids, or OAuth credentials.
- Stop if unrelated worktree changes would be mixed into this work.

## 2. Act

1. `site-config.ts`: title, slug, `bundleId`, `androidPackage`, URLs, `auth.trustedOrigins`, features, payment ids.
2. Mirror into `convex/siteConfig.ts`: `title`, `slug`, `bundleId`, `androidPackage`, `brand`, `company`, `auth.trustedOrigins` (must include `"<slug>://"`), `features`, `payment` product ids.
3. `mobile-app/App.storekit`: set `productID` to the Apple product id.
4. Copy: web in `web-app/app/routes/` and `web-app/app/components/`; mobile in `mobile-app/app/` and `mobile-app/components/`, including `mobile-app/components/onboarding/content.ts`.
5. Product context: the Project Foundation section of `AGENTS.md` and `PRODUCT.md`. Keep `CLAUDE.md` a symlink.
6. Colors: edit only `mobile-app/lib/theme.ts`. Ask dual theme or single theme; for single theme follow `references/theming.md`.
7. Hand off: admin emails -> `$ns-set-admin`; onboarding images -> `$ns-images`; app icon -> `$ns-icon`; `easProjectId` -> `$ns-setup-expo`; landing page -> `$ns-web-landing-page`.

Read `convex/_generated/ai/guidelines.md` before editing anything under `convex/`.

## 3. Validate and return

```bash
npm run check-setup
npx convex dev --once
cd web-app && npm run typecheck
cd mobile-app && npx tsc --noEmit && npm run lint
```

Route each check-setup failure through `$ns-check-setup`. Report changed files, values still missing from the brief, and remaining manual items from `docs/production-checklist.md`.
