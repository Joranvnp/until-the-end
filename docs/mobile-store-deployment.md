# Mobile iOS / Android One-Shot Deployment

This guide summarizes the SDK/tooling decision to publish NowStack Mobile with minimal friction. The recommended Apple path is **asc App Store Connect CLI** for uploads, metadata, screenshots, validation, and submission. EAS Submit is not the default iOS path.

## 90-99% Automation Goal

The goal is not to "take a few screenshots manually." The realistic goal is a playbook where the agent prepares almost everything: configuration, builds, screenshots, visual QA, metadata files, binary uploads, release notes, and TestFlight / internal track distribution.

What can be aggressively automated:

- Expo / `site-config.ts` / App Store Connect configuration validation;
- native iOS build via local Xcode, Xcode Cloud, or fallback EAS Build only if explicitly approved;
- iOS upload/submission via `asc`;
- native Android build via local Gradle, or fallback EAS Build only if explicitly approved;
- Android upload/submission via `gpc`;
- screenshots via dry-run-first wrapper `mobile-app/scripts/store-screenshots.mjs`, Maestro + simulators/emulators + native commands `simctl`/`adb`;
- deterministic demo data, seeds, deep links, and store-demo mode;
- AI visual QA with machine-readable manifest;
- App Store / Google Play metadata file generation without secrets;
- iOS screenshot/metadata upload via `asc`, and Android via `gpc`;
- release notes and TestFlight / Google Play internal track distribution.

What remains an inevitable manual gate:

- Apple and Google developer account verification/enrollment;
- initial creation of certain console resources when Apple/Google require it;
- compliance declarations with business/legal judgment: App Privacy, export compliance, Data Safety, content rating, target audience, ads, app access;
- final human validation before public upload;
- App Review / Play Review approval, rejections, appeals.

So yes, we aim for 90-99% on technical preparation and submission. No, we don't promise to bypass Apple/Google controls.

## Exact Tool Matrix

- **asc App Store Connect CLI**: default iOS tool for App Store Connect, TestFlight, IPA upload, screenshots, metadata, validation, and submit.
- **Local Xcode / Xcode Cloud**: iOS IPA generation when avoiding EAS.
- **EAS Build**: optional fallback to generate `.ipa` iOS or `.aab` Android if user explicitly approves.
- **GPC / Google Play Console CLI**: default Android tool for Google Play, AAB upload, listings, screenshots, tracks, vitals, reviews, rollout, and monitoring.
- **EAS Submit**: do not use by default. Only on explicit override.
- **App Store Connect API (ASC API)**: `asc` authentication via `keyId`, `issuerId`, `.p8` outside git.
- **Android Publisher API**: official Google Play API used by `gpc`, or directly/fastlane for rare gaps.
- **Maestro**: screenshot flow automation under `mobile-app/maestro/store/`.
- **`xcrun simctl`**: native iOS capture from Simulator.
- **`adb`**: native Android capture from Emulator.
- **AI vision QA**: visual validation of PNGs against `manifest.json`.
- **fastlane `supply`**: stable Android fallback if `gpc` blocks.

## Tooling Decision

### iOS

- **Official API**: [App Store Connect API](https://developer.apple.com/documentation/appstoreconnectapi)
- **Default repo tool**: [asc App Store Connect CLI](https://asccli.sh/)
- **Auth**: `asc auth login --key-id ... --issuer-id ... --private-key ...`
- **Upload/submission**: `asc publish appstore --app APP_ID --ipa app.ipa --version VERSION --submit --confirm`
- **Validation**: `asc validate --app APP_ID --version VERSION --platform IOS --output table`
- **Metadata/screenshots**: `asc` first, from files generated and validated by screenshot workflow.

There is no need to add an official Apple JavaScript SDK to the repo for initial launch. For one-shot submission, `asc` uses an App Store Connect API key: `keyId`, `issuerId`, and `.p8` file stored outside git. If the user wants an Apple web session for gaps not covered by the public API, use `asc web ...` commands only after explicit confirmation.

### Android

- **Official API**: [Google Play Developer API / Android Publisher API](https://developers.google.com/android-publisher)
- **Default repo tool**: [GPC / Google Play Console CLI](https://yasserstudio.github.io/gpc/)
- **Auth**: `gpc auth login --service-account ...` or `GPC_SERVICE_ACCOUNT` + `GPC_APP`.
- **Upload/submission**: `gpc publish app.aab --track internal` or `gpc releases upload app.aab --track internal`.
- **Validation**: `gpc preflight app.aab` then `gpc publish app.aab --track internal --validate-only`.
- **Metadata/screenshots**: `gpc listings push` and `gpc listings images upload`.
- **Stable fallback**: fastlane `supply` if `gpc` blocks.

For NowStack Mobile, do not code custom Google Play automation as long as `gpc` suffices. `gpc` authenticates with a Google Play service account and covers more surface than `supply`: releases, listings, screenshots, vitals, reviews, subscriptions/IAP, and monitoring. Note: **Google Play may still require initial bootstrap on the Play Console side for a new app/package**, so initial Play Console setup remains a possible gate.

## One-Shot Strategy

1. Configure `site-config.ts` as source of truth:
   - `title`, `slug`, `bundleId`
   - `appleTeamId`, `easProjectId`
   - `payment.iapProductId`
   - `urls.appStore`, `urls.playStore`, site, support, privacy/legal

2. Verify `mobile-app/app.config.ts`:
   - iOS `bundleIdentifier = SiteConfig.bundleId`
   - Android `package = SiteConfig.bundleId`
   - EAS `projectId = SiteConfig.easProjectId`

3. Verify `mobile-app/eas.json`:
   - replace `EXPO_PUBLIC_CONVEX_URL` placeholders
   - replace `EXPO_PUBLIC_CONVEX_SITE_URL` placeholders
   - do not prepare `submit.production.ios` or `submit.production.android` unless explicit override; store uploads go through `asc` / `gpc`

4. Prepare the stores:
   - iOS: App Store Connect app reserved, bundle ID, `asc auth login` OK, ASC API key, privacy, support URL, age, pricing, screenshots, IAP.
   - Android: Play Console app created, package name reserved, app signing, service account, first manual upload done if initial release, internal track, data safety, privacy policy, listing, screenshots.

5. Generate screenshots with `.agents/skills/ns-generate-store-screenshots` and `cd mobile-app && npm run screenshots:store`: shot list, dry-run manifest, simulator/emulator, native capture, AI visual QA, human validation.

6. Launch build/submission after explicit confirmation. For iOS: signed IPA then `asc`. For Android: signed AAB then `gpc`.

## Automated Screenshots

Screenshots are a release gate, not a 2 a.m. hack. The repo-local workflow is `.agents/skills/ns-generate-store-screenshots` and must produce screenshots generated/QA/upload-ready by automation, not ad-hoc manual captures:

- Maestro flows under `mobile-app/maestro/store/`: complete `*-store-screenshots*.yaml` flows remain human examples, while the `--execute` wrapper launches one Maestro flow per screenshot;
- deterministic demo mode: fixed seed, stable dates, clean fake data, mock/demo auth, no secrets;
- deep links `nowstack://...` to jump directly to onboarding/auth/home/core/paywall/settings;
- iOS capture via Simulator + `xcrun simctl io <udid|booted> screenshot` (`--ios-device`, default `booted`);
- Android capture via Emulator + `adb [-s <serial>] exec-out screencap -p` (`--android-device` optional);
- QA manifest based on `docs/templates/store-screenshot-manifest.example.json`;
- AI visual: correct screen, readable text, no placeholders, no secrets, no cut-off UI, brand consistency;
- frame/composite option: keep raw captures, generate separate mockup/marketing versions;
- output in `documents/store-screenshots/YYYY-MM-DD/` with `manifest.json`.

Safe repo-local commands:

```bash
cd mobile-app

# Dry-run by default: writes manifest and displays commands without touching devices.
npm run screenshots:store
npm run screenshots:store:ios
npm run screenshots:store:android

# Real capture only after validating simulator/emulator and demo mode.
npm run screenshots:store -- --execute
npm run screenshots:store:ios -- --date YYYY-MM-DD --execute --ios-device booted
npm run screenshots:store:android -- --date YYYY-MM-DD --execute --android-device emulator-5554

# By default, a Maestro error skips the native capture for that shot and fails the command.
# To capture anyway after a Maestro error, while keeping native errors blocking:
npm run screenshots:store -- --execute --continue-on-maestro-failure

# Manifest only, without running Maestro.
npm run screenshots:store -- --date YYYY-MM-DD --skip-maestro
```

The wrapper writes canonical paths `ios/iphone-67/fr-FR/01-onboarding.png` and `android/phone/fr-FR/01-onboarding.png` etc. On `--execute`, it orchestrates **each screenshot separately**: for shot `01-onboarding`, it first looks for a real flow `mobile-app/maestro/store/<platform>/01-onboarding.yaml` or `mobile-app/maestro/store/<platform>-01-onboarding.yaml`. If no per-shot flow exists, it temporarily generates under `documents/store-screenshots/YYYY-MM-DD/_maestro/` a flow that launches the app with `appId: com.nowstack.mobile`, then opens the deep link `nowstack://store/...?storeDemo=1&seed=nowstack-store-demo-v1&locale=fr-FR`. The `ns` scheme comes from `SiteConfig.slug` / `mobile-app/app.config.ts`; the bundle id `com.nowstack.mobile` is used for native Maestro launch. These generated flows are intentionally strict: the app must implement store-demo deep links and expose stable text/testIDs, otherwise Maestro fails and the command exits non-zero. Complete flows `ios-store-screenshots*.yaml` / `android-store-screenshots*.yaml` remain documented as human-readable examples, not a single native capture of six screens. The script does no upload and requests no credentials.

Operational templates added:

- `mobile-app/maestro/store/ios-store-screenshots.example.yaml`
- `mobile-app/maestro/store/android-store-screenshots.example.yaml`
- `mobile-app/scripts/store-screenshots.mjs`
- `docs/templates/store-screenshot-manifest.example.json`
- `docs/templates/app-store-metadata.example.json`
- `docs/templates/google-play-release.example.json`

For V1 90-99%, the priority is adding testIDs/deep links on the app side, then transforming `.example.yaml` flows into real per-shot flows. The local wrapper already writes the manifest, can launch Maestro before each capture, captures with `simctl`/`adb` on `--execute`, records Maestro/native status per shot, then leaves AI QA and `asc` / `gpc` upload preparation after validation.

## iOS Commands

Execute only when production config is validated:

```bash
# Install / verify asc
brew install asc
asc auth status --validate || asc auth doctor

# Login if needed
asc auth login \
  --name "NowStack" \
  --key-id "KEY_ID" \
  --issuer-id "ISSUER_ID" \
  --private-key "/secure/local/AuthKey_KEY_ID.p8" \
  --network

# Build IPA without EAS Submit
cd mobile-app
npm run env:prod
npx expo prebuild --clean --platform ios
# Then archive/export local Xcode or Xcode Cloud to get {ipa_path}

# Dry-run then publish/submit via asc
asc publish appstore \
  --app "APP_ID" \
  --ipa "{ipa_path}" \
  --version "1.0.0" \
  --submit \
  --dry-run \
  --output table

asc publish appstore \
  --app "APP_ID" \
  --ipa "{ipa_path}" \
  --version "1.0.0" \
  --submit \
  --wait \
  --confirm
```

## Android Commands

Execute only when production config is validated:

```bash
cd mobile-app
npm run env:prod
npx expo prebuild --clean --platform android
(cd android && ./gradlew bundleRelease)

# Check GPC
gpc doctor

# Expected AAB
AAB_PATH="android/app/build/outputs/bundle/release/app-release.aab"

# Validation without publish
gpc preflight "$AAB_PATH" --fail-on error
gpc publish "$AAB_PATH" --track internal --validate-only

# Upload/publish internal track after confirmation
gpc publish "$AAB_PATH" --track internal --notes "Initial internal test release"
gpc status
```

For Android, target the `internal` track first unless Play Console gates are already validated. For a first Google Play app, `gpc` can drive many things, but if Play Console/API rejects the first upload because the app/package is not yet bootstrapped, complete that bootstrap in Play Console then retry `gpc`.

## What Is Automatable

- EAS / Expo / `site-config.ts` / `eas.json` configuration validation.
- Native iOS/Android build via local Xcode/Gradle, Xcode Cloud, or fallback EAS Build only if explicitly approved.
- iOS binary upload, validation, metadata, screenshots, and submit via `asc`.
- Android binary upload, validation, metadata, screenshots, tracks, and monitoring via `gpc`.
- Apple credential management via `asc auth login`; Android management via `gpc auth login` / `GPC_SERVICE_ACCOUNT`.
- Screenshots via Maestro, simulators/emulators, `simctl`, `adb`, deterministic demo mode, and deep links.
- AI visual QA with manifest and pass/fail criteria.
- App Store metadata via `asc`.
- Google Play metadata via `gpc`, fallback fastlane `supply` if needed.
- Release notes, TestFlight internal distribution, Google Play internal track, and upload-ready folder preparation.
- Reuse of central values from `site-config.ts`.

## What Remains Manual or Semi-Manual

- Apple and Google developer account creation/validation.
- Initial app creation in App Store Connect / Play Console if absent or if owner must confirm.
- Apple app privacy, export compliance, review notes, age rating, pricing/availability.
- Google Play data safety, target audience, app access, content rating, ads declaration.
- Business/legal validation of screenshots, marketing text, pricing, and claims before public upload.
- Final Apple/Google approval, rejections, appeals, and changes requested by review.
- Business validation of iOS IAP type: non-consumable vs subscription.

## Security Points

Never commit:

- App Store Connect `.p8` key
- Google service account JSON
- passwords, app-specific passwords
- certificates, profiles, keystores
- `.env` containing secrets

Local credential paths must be gitignored or replaced with EAS credentials.

## NowStack-Specific Gates

- iOS production must use Apple IAP, not Stripe.
- Android/web use Stripe.
- `SiteConfig.payment.iapProductId`, StoreKit configuration, and `convex/payments/iap.ts` must stay aligned.
- Current code calls `finishTransaction({ isConsumable: true })`: review before release if offer is non-consumable or subscription.
- `convex/payments/iap.ts` decodes/verifies StoreKit 2 JWS locally. For robust production, verify transactions via App Store Server API before granting long-term entitlements.
