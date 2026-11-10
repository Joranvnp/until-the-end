---
name: ns-ios-audit
description: Audits a NowStack Mobile iOS app against App Store Review Guidelines before submission, read-only - IAP and Restore, account deletion, Sign in with Apple parity, permission strings, App Privacy, AI disclosure, export compliance. Use for "ns ios audit" or "will my app pass review".
---

# iOS App Store Audit - NowStack Mobile

Read-only: no code edits, no `site-config.ts` changes, no store mutations. Recommend fixes; implement only if the user asks. Runs after `$ns-ios-testflight` and before `$ns-ios-distribute`.

## 1. Detect the feature set (from repo root)

```bash
grep -nE "providers:|ios:|entitlementKey|priceDisplay|enable.*SignIn|privacy|terms|website|email" site-config.ts
grep -rnE "stripe|createCheckoutSession|Linking.openURL|restore|getAvailablePurchases" "mobile-app/app/(flow)/paywall.tsx" mobile-app/lib/iap.ts "mobile-app/app/(app)/(tabs)/settings.tsx"
grep -nE "getEnabledAuthProviders|APP_REVIEW_EMAIL|APP_REVIEW_OTP" convex/auth.ts
grep -rniE "delete.?account|anonymize" mobile-app/app convex/users
grep -nE "Permission|UsageDescription|ITSAppUsesNonExemptEncryption|privacyManifests|associatedDomains" mobile-app/app.config.ts
grep -nE '"ai"|@ai-sdk|openai|anthropic' mobile-app/package.json
grep -rniE "generateText|streamText|@ai-sdk|openai|anthropic|replicate" convex mobile-app/lib mobile-app/app
grep -rniE "idfa|adsupport|requestTrackingAuthorization|NSUserTracking" mobile-app --include='*.ts' --include='*.tsx'
grep -rniE "report|block|moderat" mobile-app/app
sed -n '1,80p' convex/schema.ts
```

Also scan `convex/` for queries returning one user's content to another (UGC). Boilerplate placeholders (URLs, support email, `easProjectId`) are findings.

## 2. Judge each guideline

Walk every section of `references/guidelines.md`; it holds the check and fix per guideline. Read the real file before calling anything PASS (e.g. the `Platform.OS` iOS branch of the paywall, the settings link to delete-account). Guidelines whose trigger is absent are N/A with the reason. Every one of the BLOCKER rows in its severity table gets an explicit verdict.

## 3. Report

```
## iOS App Store Audit - {title} ({bundleId} v{version})
VERDICT: N blockers / M warnings / K manual gates   (or: Ready to submit - only manual gates remain)

### BLOCKERS
- [3.1.1] <finding> - path:line. Fix: <file + change>
### WARNINGS
### MANUAL GATES
- App Privacy: https://appstoreconnect.apple.com/apps/{asc_app_id}/distribution/privacy - declare: <list>
### PASSING
### N/A
```

- Every code finding cites `path:line`; manual gates cite the ASC or live web URL. No emojis.
- End with one next action: blockers -> fix, then rerun this audit; only manual gates -> clear them, then `$ns-ios-distribute`.

## Traps

- Stripe imports are fine; only an iOS branch reaching Stripe or an external payment link is a 3.1.1 blocker.
- First-party PostHog is not tracking: no ATT, but declare Usage Data.
- `ai` / `@ai-sdk/google` in `mobile-app/package.json` put AI disclosure in scope; confirm what runs at runtime before raising it.
- A configured privacy/terms URL that does not resolve is still a blocker.
