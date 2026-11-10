# App Store Review Guideline Checks - NowStack Mobile

Severity: BLOCKER (Apple rejects), WARNING (rejects if the feature applies), MANUAL-GATE (not provable from code; give the link + exact answer). `{...}` values come from `site-config.ts`.

## 1.2 UGC (only if users see other users' content)

- Check: any Convex query returning one user's uploads/content to another user (see `convex/storage/r2.ts` consumers).
- Fix: EULA, content filtering, report + block UI on those screens, published contact, action within 24h. Single-user content -> N/A.

## 1.5 Support info

- Check: `company.email` is real (not `support@nowstack.app`), surfaced in `mobile-app/app/(app)/(tabs)/settings.tsx`; web `/support` is live.

## 2.1 Completeness + review demo account (BLOCKER)

- No `TODO` / Lorem / "Coming soon" in shipped screens; the paywall shows `payment.priceDisplay`.
- Convex `ALLOW_DEV_PAYMENT_BYPASS` is not `"true"` on the deployment the build points at (read in `convex/payments/entitlements.ts`; no `EXPO_PUBLIC_` variant).
- Demo account: `convex/auth.ts` short-circuits OTP delivery only for an exact match of Convex env `APP_REVIEW_EMAIL` with a random six-digit `APP_REVIEW_OTP`; no email/code literal in source. Both exist on production, and a real sign-in works without printing them. The email-OTP path is reachable in `mobile-app/components/onboarding/sign-in-form.tsx`.
- MANUAL-GATE: the same values go in private App Review Information (`demoAccountRequired: true`), never in public metadata, docs, logs, commits, or chat. Rotate after review or exposure.

## 2.3.1 / 2.5.1 Hidden features, private APIs

- Check: no remote kill-switch that changes core behavior after review; no private symbols.

## 2.3.10 Other platforms in metadata

- Check: name, description, screenshots never mention Android, Google Play, or a web version.

## 3.1.1 In-App Purchase (BLOCKER)

- `payment.providers.ios` is `apple_iap`.
- `mobile-app/app/(flow)/paywall.tsx` iOS branch uses `mobile-app/lib/iap.ts` (`expo-iap`), never Stripe, `createCheckoutSession`, or an external payment `Linking.openURL`; no "upgrade on our website" copy on iOS.
- A Restore Purchases action (`getAvailablePurchases`/restore) is reachable on iOS. Missing -> BLOCKER.

## 3.1.2 Subscriptions (only if auto-renewing)

- `payment.entitlementKey` `lifetime` -> N/A. Subscription -> paywall shows title, length, price per period, auto-renew text, Terms + Privacy links; description contains the Terms link.

## 3.1.3(b) Multiplatform

- Unified entitlement in `convex/payments/entitlements.ts` is fine; never promote a cheaper web purchase on iOS.

## 4.2 Minimum functionality

- At least one real feature flow beyond auth + paywall.

## 4.8 Sign in with Apple (BLOCKER if it applies)

- `features.enableGoogleSignIn` (or any social login) true -> `enableAppleSignIn` true, button rendered on iOS in `sign-in-form.tsx` when `getEnabledAuthProviders` returns `apple: true`, and `APPLE_CLIENT_ID`/`APPLE_CLIENT_SECRET` set on prod Convex (see `.agents/rules/auth-payments-storage.md`). Email OTP only -> N/A.

## 4.5.4 Push

- If push exists, the app works without granting it; no marketing push without opt-in.

## 5.1.1(i) Permission strings (BLOCKER)

- Every permission-requesting plugin in `mobile-app/app.config.ts` (`expo-image-picker`, `expo-media-library`, notifications, location, ...) has a purpose string naming the feature; no unused permission declared.

## 5.1.1(v) Account deletion (BLOCKER)

- `mobile-app/app/(app)/delete-account.tsx` is linked from settings and calls `anonymizeAccount` in `convex/users/account.ts`, which removes/anonymizes data, not just signs out.

## 5.1.1 / 5.1.2 Privacy policy + data use (BLOCKER + MANUAL-GATE)

- `urls.privacy` and `urls.terms` resolve on the deployed web app and are linked in-app.
- Data inventory from `convex/schema.ts` + `mobile-app/lib/posthog.ts` is the App Privacy answer.
- MANUAL-GATE: `https://appstoreconnect.apple.com/apps/{asc_app_id}/distribution/privacy`. Baseline: Contact Info (email) linked to identity, User Content, Identifiers, Usage Data; not used for tracking while PostHog stays first-party.

## 5.1.2 ATT

- IDFA, `AdSupport`, ad SDKs, or cross-company data sharing -> ATT prompt + `NSUserTrackingUsageDescription` + declaration. None -> "Data Not Used to Track You" and no tracking string.

## Privacy manifest

- Expo covers its own modules. Custom native code or a non-Expo SDK -> require `ios.privacyManifests` in `app.config.ts` with required-reason API categories.

## Export compliance (BLOCKER)

- `ios.infoPlist.ITSAppUsesNonExemptEncryption: false` in `mobile-app/app.config.ts`.

## Generative AI (WARNING; BLOCKER if UGC-facing)

- Triggered by runtime model calls, not only the dependency. Require: in-app disclosure, moderation of generated content, age rating review, accurate claims, third-party model data flow in the privacy policy + App Privacy.

## Severity table

| Finding | Severity |
| --- | --- |
| iOS sells digital goods via Stripe / external link | BLOCKER (3.1.1) |
| No Restore Purchases on iOS | BLOCKER (3.1.1) |
| Subscription paywall missing auto-renew + legal links | BLOCKER (3.1.2) |
| Social sign-in on iOS without Apple sign-in | BLOCKER (4.8) |
| No in-app account deletion | BLOCKER (5.1.1v) |
| Vague, missing, or unused permission string | BLOCKER (5.1.1i) |
| Privacy/terms URL placeholder or not live | BLOCKER (5.1.1) |
| Missing `ITSAppUsesNonExemptEncryption` | BLOCKER (export) |
| Dev payment bypass on, or review account broken/hardcoded | BLOCKER (2.1) |
| UGC without report/block | BLOCKER (1.2) |
| AI usage undisclosed/unmoderated | WARNING |
| Privacy manifest for custom native dep | WARNING |
| App Privacy questionnaire | MANUAL-GATE |
| Review demo account not entered in App Store Connect | MANUAL-GATE (2.1) |
