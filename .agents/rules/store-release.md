# Store Release

Rules for iOS/Android release, screenshots, and store workflows.

## When this applies

- App Store, Google Play, EAS Build/Submit, store screenshots, metadata, or release automation.

## Rules

- Do not run store builds, submissions, screenshot uploads, or create external store resources without explicit user confirmation.
- Before any production web deploy, native production build, or store promotion, run `.agents/skills/ns-publish-to-production/SKILL.md`'s production credential boundary. Every enabled OAuth provider needs a production-specific client/app and fresh secret; Apple needs a valid freshly signed Services-ID JWT; Stripe needs live-mode keys, Product/Price, and a production webhook. Never copy development OAuth credentials, an old Apple JWT, Stripe test keys, or a development webhook into production.
- Use repo-local skills for production release workflows:
  - `.agents/skills/ns` - product CLI index that routes to the standalone `ns-*` skills below.
  - `.agents/skills/ns-ios-testflight` - iOS beta: first TestFlight build (EAS init, signing, build, upload).
  - `.agents/skills/ns-ios-audit` - iOS pre-submission: read-only App Store Review Guideline audit (IAP/Restore, account deletion, Sign in with Apple parity, permission strings, privacy/AI disclosure, export compliance). Run before `ns-ios-distribute`.
  - `.agents/skills/ns-ios-distribute` - iOS release: App Store submission (screenshots, metadata, IAP, review).
  - `.agents/skills/ns-android-beta` - Android beta: build AAB + upload to the Play internal track.
  - `.agents/skills/ns-android-play-console-release` - Android Play Console internal-release fallback: direct Android Publisher upload when `gpc` validates but commit/upload handling fails, plus browser-vs-CLI gates.
  - `.agents/skills/ns-android-distribute` - Android release: promote internal → production (listing, Data safety, staged rollout).
  - `.agents/skills/ns-release` - version source first, build and verify matching betas, then promote those exact binaries.
  - `.agents/skills/ns-web-deploy` - Vercel + Convex deploy with the production deploy key.
  - `.agents/skills/ns-publish-to-production` - mandatory production credential boundary and cross-surface release coordinator.
  - `.agents/skills/ns-setup-google-auth` / `.agents/skills/ns-setup-apple-auth` - deployment-specific social auth setup and production rotation.
  - `.agents/skills/ns-setup-stripe` - Stripe test setup or `--prod` live-mode setup.
  - `.agents/skills/ns-ios-deploy-app` - asc-centric iOS submission details.
  - `.agents/skills/ns-deploy-android-app` - gpc-centric Google Play submission details.
  - `.agents/skills/ns-generate-store-screenshots`
- Use `mobile-app/scripts/store-screenshots.mjs` for screenshot manifests and capture command generation.
- Use `mobile-app/scripts/asc-api.mjs` for App Store Connect API calls (certs, profiles, beta groups, testers); credentials come from `ASC_KEY_ID`/`ASC_ISSUER_ID`/`ASC_P8_PATH` env vars, never hardcoded.
- Screenshot generation is dry-run-first. Only pass `--execute` when the user asked for real capture.
- Keep store metadata consistent with `site-config.ts`.
- Treat native credentials, App Store Connect keys, Google service accounts, and EAS tokens as secrets.

## Verification

- For screenshot work, verify the manifest paths and expected devices before real capture.
- For release work, verify EAS/App Store/Play output, not just local command success.
