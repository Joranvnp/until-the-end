---
name: ns-generate-store-screenshots
description: Generate App Store and Google Play screenshots for NowStack Mobile with a dry-run-first Maestro plus simctl/adb pipeline and AI visual QA. Use when preparing store screenshots, Play listing images, or refreshing captures after UI changes.
disable-model-invocation: true
---

# Store Screenshots - NowStack Mobile

Follow `.agents/rules/store-release.md`. This skill produces upload-ready files and a manifest only; it never uploads. Uploads happen in `$ns-ios-distribute` / `$ns-android-distribute` after explicit user approval.

Guardrails: seeded demo data only (no real users, emails, tokens, private media, production customer data); never commit screenshots (`documents/store-screenshots/` is gitignored) or demo credentials; no misleading capability claims.

## Fixed contract (`mobile-app/scripts/store-screenshots.mjs`)

- Shots: `01-onboarding`, `02-auth`, `03-home`, `04-core-feature`, `05-paywall`, `06-settings`. Home, core-feature, and settings need a signed-in simulator (deployment App Review account) before `--execute`.
- iOS: script default iPhone 15 Pro Max, 1290x2796. `$ns-ios-distribute` uploads to the `IPHONE_65` slot (1242x2688), so capture on an iPhone 11 Pro Max class simulator (`--ios-device <udid>`); the `iphone-67` folder name is only a label. Android: phone, 1080x1920.
- Output: `documents/store-screenshots/<date>/manifest.json`, `ios/iphone-67/<locale>/NN-slug.png`, `android/phone/<locale>/NN-slug.png`. Default locale `en-US`.
- Demo mode: `?storeDemo=1&seed=nowstack-store-demo-v1&locale=<locale>` deep links or `EXPO_PUBLIC_STORE_SCREENSHOTS=1` (`mobile-app/lib/store-demo.ts`). Deep links use the Expo scheme (`SiteConfig.slug`); Maestro `appId` uses `SiteConfig.bundleId` (iOS) / `SiteConfig.androidPackage ?? SiteConfig.bundleId` (Android).
- Per-shot Maestro flows: `mobile-app/maestro/store/<platform>/<NN>-<slug>.yaml` or `mobile-app/maestro/store/<platform>-<NN>-<slug>.yaml`. Missing ones are generated under `<output>/_maestro/`. `mobile-app/maestro/store/{ios,android}-store-screenshots.example.yaml` are references only.

## Flow

1. Preflight from `mobile-app/`: `npx expo config --type public`, `npm run screenshots:store -- --help`. Confirm name, slug, bundle/package, and colors in `site-config.ts` are final and the paywall copy is store-acceptable.
2. Dry run (writes the manifest, prints commands):
   ```bash
   cd mobile-app
   npm run screenshots:store:ios -- --date YYYY-MM-DD --skip-maestro
   npm run screenshots:store:android -- --date YYYY-MM-DD --skip-maestro
   ```
3. Build and boot: `npx expo run:ios` / `npx expo run:android`. Do not run `npm run env:prod` or `env:dev`: `mobile-app/scripts/swap-env.js` is missing. Set `EXPO_PUBLIC_CONVEX_URL` / `EXPO_PUBLIC_CONVEX_SITE_URL` explicitly if a production backend is required.
4. Capture (only when the user asked for real capture):
   ```bash
   npm run screenshots:store:ios -- --date YYYY-MM-DD --execute --ios-device <udid|booted>
   npm run screenshots:store:android -- --date YYYY-MM-DD --execute --android-device emulator-5554
   ```
   Other flags: `--locale fr-FR`, `--output <path>`, `--continue-on-maestro-failure`. A Maestro failure skips that shot and exits non-zero; fix with stable testIDs or deep links, do not brute-force taps.
5. AI visual QA: read `manifest.json` (shape: `docs/templates/store-screenshot-manifest.example.json`) and every PNG. Fail a shot for wrong screen, clipping by notch/home indicator/keyboard, unreadable copy at thumbnail size, placeholders, debug banners, `localhost`, secrets, private data, brand mismatch, or misleading claims. Fix and recapture. `trash` any set that leaked private data.
6. Optional marketing frames go to `framed/` as copies; keep raw captures untouched and record `rawPath` + `framedPath`.

Return the manifest path, per-shot QA status, and remaining blockers. `upload_ready` is true only after QA passes and the user approves.
