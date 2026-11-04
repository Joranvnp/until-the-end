---
name: ns-ios-distribute
description: Submits a NowStack Mobile TestFlight build to App Store review. Use for real 6.5-inch screenshots, store metadata, IAP readiness, age rating, review details, asc validate, and the final review submission.
disable-model-invocation: true
---

# iOS Distribute - NowStack Mobile

Workflow owner for App Store submission. Exact `asc` / `asc-api.mjs` syntax for every step lives in `$ns-ios-deploy-app`; do not restate it here.

Every upload and the final review submission is a separate publication boundary: get fresh explicit confirmation immediately before each mutation, then read back App Store Connect provider state (build, version, asset, submission) before moving on.

## A. Preflight (stop on any failure)

1. Auth: `asc auth status --validate`; unknown or failing -> `$ns-find-asc-credentials`.
2. Processed build exists (`GET /v1/builds?filter[app]=...`); none -> `$ns-ios-testflight`.
3. `$ns-ios-audit` has no open BLOCKERs.
4. Run the production credential boundary in `$ns-publish-to-production`; direct invocation does not bypass it.
5. Web app is live: privacy and terms URLs from `site-config.ts` return 200; if not -> `$ns-web-deploy`.
6. Resolve `{asc_app_id}`, `{version_id}` (create the version if missing), `{build_db_id}`. Read URLs, support email, product IDs, and price from `site-config.ts`; never invent metadata values.

## B. Screenshots

Capture with `$ns-generate-store-screenshots`; these rules override it on conflict:

- Raw captures of the real app UI only (onboarding, auth, signed-in home, a real feature, the real paywall, settings). No screenshot-only routes (`/store/*`), fake cards, overlay copy, or composites unless the user asks for framed marketing assets. Discard any set that has them.
- Demo data only; sign in with the deployment's App Review account for gated screens; never print its credentials.
- Paywall: Convex env `ALLOW_DEV_PAYMENT_BYPASS` must not be `"true"` during capture (`npx convex env set ALLOW_DEV_PAYMENT_BYPASS false`, restore after). It is server-side only; no `EXPO_PUBLIC_` variant exists.
- Slot is always "iPhone 6.5 Display" = `IPHONE_65`, 1242x2688, from an iPhone 11 Pro Max class simulator. The `iphone-67` output folder name is only a label from `mobile-app/scripts/store-screenshots.mjs`.

```bash
xcrun simctl create "store-iphone-65" "com.apple.CoreSimulator.SimDeviceType.iPhone-11-Pro-Max" <runtime>
cd mobile-app && npm run screenshots:store:ios          # dry run first
npm run screenshots:store:ios -- --execute              # after confirmation
sips -g pixelWidth -g pixelHeight <dir>/*.png           # every file 1242x2688
```

Open each PNG for visual QA (no dev overlays, placeholder copy, or real user data). Maestro flows: `mobile-app/maestro/store/`; export `JAVA_HOME` from `/usr/libexec/java_home -v 17`. Output stays in gitignored `documents/store-screenshots/`.

## C. Version, metadata, screenshots upload

Attach `{build_db_id}` to the version. Draft metadata from `docs/templates/app-store-metadata.example.json` + `site-config.ts`, show it to the user for approval, then write it. Subscription apps: append `Terms of Use: <terms-url>` and `Privacy Policy: <privacy-url>` to the description. Upload screenshots to `IPHONE_65`.

## D. IAP (skip if nothing is sold on iOS)

Product ID equals `payment.productIds.apple`. Set localizations, one equalized base price, availability, and the real paywall capture as review screenshot. Target: `READY_TO_SUBMIT`.

## E. Compliance

- Content rights and honest age-rating answers via API.
- `"ITSAppUsesNonExemptEncryption": false` stays in `mobile-app/app.config.ts` `infoPlist`.
- App Privacy is web-only: give the user `https://appstoreconnect.apple.com/apps/{asc_app_id}/distribution/privacy` and the declarations from `$ns-ios-audit`. Submission waits until it shows published.

## F. Review details, validate, submit

1. Review details: contact info plus the secret-managed `APP_REVIEW_EMAIL` / `APP_REVIEW_OTP`, `demoAccountRequired: true`, a note explaining email OTP. Never echo the values; build the request in a mode-600 temp file outside the repo and `trash` it after the call.
2. `asc validate` until zero `severity: error`.
3. `asc review submit --dry-run`, show the result, get fresh explicit confirmation, then `--confirm`.
4. Read back `asc status` and submission state. Report version, build number, submission state, and how to monitor (`asc status --app {asc_app_id}`).

Never print or commit ASC credentials.
