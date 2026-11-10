---
name: ns-android-beta
description: Ships a signed NowStack Mobile AAB to Play internal testing. Checks the OS first: macOS builds locally with EAS, Windows/Linux use EAS cloud after ns-setup-expo. Use for Android beta, internal testing, Play upload, or the Android TestFlight equivalent.
disable-model-invocation: true
---

# Android Beta

Android counterpart of `$ns-ios-testflight`: one signed AAB on the Play **internal** track, tested by the user. Promotion is `$ns-android-distribute`; gpc syntax and error diagnosis live in `$ns-deploy-android-app`. Read `.agents/rules/store-release.md` first.

## 1. Inspect

```bash
uname -s || node -p "process.platform"
npm run check-setup
cd mobile-app && npx tsc --noEmit && npm run lint && npx expo config --type public
```

- Confirm `site-config.ts` `androidPackage`, `version`, `payment.productIds.google`, and a real `easProjectId`; the generated `android.package` must match. The package is permanent once the Play app exists.
- Ask once, as a group, for what the agent cannot create: verified Play Developer account, a Play Console app for the package, and Expo login (`eas whoami`).
- Run `$ns-find-gpc-credentials` until `gpc doctor` passes.
- Run the production credential boundary in `.agents/skills/ns-publish-to-production/SKILL.md`. `mobile-app/eas.json` `build.production.env` must hold the **prod** `EXPO_PUBLIC_CONVEX_URL` / `EXPO_PUBLIC_CONVEX_SITE_URL` (reuse what `$ns-ios-testflight` wired, else `docs/production-checklist.md` section 1). The build bakes them in.

## 2. Build (after explicit user confirmation)

EAS owns the upload keystore (`android.credentialsSource: remote`) and auto-increments `versionCode`; never mix it with a local keystore.

- **macOS**: local EAS build.
  ```bash
  cd mobile-app
  eas build --platform android --profile production --local --non-interactive --output /tmp/<slug>-android.aab
  ```
- **Windows/Linux**: never build production locally. Finish `$ns-setup-expo` first (stop there if `eas whoami`, `easProjectId`, or `expo-doctor` is not green), then:
  ```bash
  cd mobile-app
  eas build --platform android --profile production --non-interactive
  ```
  Download the `.aab` from the FINISHED build's artifact URL to `/tmp/<slug>-android.aab`.

Record `AAB`, its `shasum -a 256`, and the `versionCode`.

## 3. Upload to internal

The first time only, the user creates the managed in-app product in Play Console with the exact id `payment.productIds.google` and activates it (it may require an uploaded build first; upload, then return here).

```bash
gpc preflight "$AAB" --fail-on error
gpc publish "$AAB" --track internal --validate-only --changes-not-sent-for-review
```

Show package, track, AAB + SHA256, versionCode, and notes; get explicit confirmation, then:

```bash
gpc releases upload "$AAB" --track internal --name "<version> (<versionCode>)" --notes "<notes>" --changes-not-sent-for-review --output json
gpc releases status --track internal --output json
```

If validation passes but the commit fails (`changesNotSentForReview`, bundle not completed, edit deleted), switch to `$ns-android-play-console-release` with the same AAB.

## 4. Test and stop

The user adds testers to the internal track, installs via the opt-in link, and confirms sign-in, prod Convex data, and the Google Play purchase. Stop; promotion beyond internal is `$ns-android-distribute`.

## Return

Package, AAB path + SHA256, versionCode, `gpc releases status` output for internal, tester result, and remaining manual steps.
