---
name: ns-android-distribute
description: Promotes a tested Android build to Google Play production. Handles listing, screenshots, compliance gates, release notes, and staged rollout. Use for Android release, Play production publishing, or promotion from a testing track.
disable-model-invocation: true
---

# Android Distribute

Android counterpart of `$ns-ios-distribute`. Promote the build already verified on the internal track; never upload a new AAB here (no build on internal -> `$ns-android-beta`). gpc syntax and error diagnosis: `$ns-deploy-android-app`.

Every listing push, screenshot upload, promotion, and rollout change is a separate publication boundary: get fresh explicit confirmation immediately before each one, then read back the Google Play provider state (package, versionCode, track, rollout, review status).

## 1. Inspect

```bash
gpc doctor                                   # else $ns-find-gpc-credentials
gpc releases status --output json            # internal build present, completed
gpc status
```

- Run the production credential boundary in `.agents/skills/ns-publish-to-production/SKILL.md`; direct invocation does not bypass it.
- Stop unless the user confirms the internal build (`versionCode`) was tested: sign-in, prod Convex, Google Play purchase of `payment.productIds.google` (active in Play Console).
- Privacy/terms URLs must be live (`$ns-web-deploy`).

## 2. Screenshots and listing

Produce the approved Android set with `$ns-generate-store-screenshots`, then upload each file after confirmation:

```bash
for f in documents/store-screenshots/<date>/android/phone/en-US/*.png; do
  gpc listings images upload --lang en-US --type phoneScreenshots "$f"
done
gpc listings pull --dir metadata/            # edit to match site-config.ts copy
gpc listings lint --dir metadata/ && gpc listings diff --dir metadata/
gpc --dry-run listings push --dir metadata/  # confirm, then rerun without --dry-run
```

If listing mutations fail with rejected-update errors, use `$ns-android-play-console-release` step 3.

## 3. Compliance gates (user completes in Play Console)

List what is outstanding; never invent answers: Data safety, content rating, target audience, ads declaration, advertising ID, privacy policy URL, government/financial/health declarations, and App access. For App access, reference the secret-managed `APP_REVIEW_EMAIL` / `APP_REVIEW_OTP` (email sign-in, then OTP, no Google/Apple sign-in); never put the values in source, listing text, or chat. Do not claim premium access the review account lacks.

## 4. Release notes

Use `{release_notes}` from `$ns-release`, or write user-facing "what's new" per language (500 chars max, no commit dump).

## 5. Promote and roll out

```bash
gpc --dry-run releases promote --from internal --to production --rollout 10 --notes "{release_notes}"
# fresh explicit confirmation, then:
gpc releases promote --from internal --to production --rollout 10 --notes "{release_notes}"
gpc releases status --track production --output json
gpc watch --track production --on-breach halt
```

`--rollout` is a percentage. After vitals stay healthy and the user confirms again: `gpc releases rollout increase --track production --to 50`, then `gpc releases rollout complete --track production`. On a crash/ANR breach, halt (`gpc releases rollout halt --track production`) and investigate; never force 100%.

## Return

Package, versionCode, track, rollout %, review status from `gpc releases status`, listing/screenshot changes, and outstanding compliance items.
