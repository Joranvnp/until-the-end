---
name: ns-android-play-console-release
description: Recovers a stuck NowStack Mobile Play internal release. Uses a direct Android Publisher upload script or the Play Console UI when gpc validates but the commit fails. Use for rejected-update, changesNotSentForReview, bundle-not-completed, or deleted-edit errors.
disable-model-invocation: true
---

# Play Console Release Fallback

Fallback for `$ns-android-beta` step 3. Input: the AAB `$ns-android-beta` already built and validated. Never build or promote here; production is `$ns-android-distribute`.

## 1. Inspect

```bash
echo "$GPC_APP"; test -n "$GPC_APP" || echo "run \$ns-find-gpc-credentials"
git check-ignore -q mobile-app/google-play-service-account.json && echo ignored
ls -lh "$AAB" && shasum -a 256 "$AAB"
gpc releases status --output json
```

Stop if `GPC_APP` is unset, the service-account file is not ignored, or the AAB is missing. Capture the exact gpc error.

## 2. Direct API upload

Show package, track, AAB + SHA256, versionCode, name, and notes, then get fresh confirmation (the failed attempt does not count):

```bash
node .agents/skills/ns-android-play-console-release/scripts/upload-internal-release.cjs \
  --app "$GPC_APP" \
  --aab "$AAB" \
  --service-account mobile-app/google-play-service-account.json \
  --track internal \
  --name "<version> (<versionCode>)" \
  --notes "<notes>"
```

Add `--validate-only` to upload and assign without committing. The script opens a new edit, uploads, assigns the track, and retries the commit, handling: `changesNotSentForReview` required, `changesNotSentForReview must not be set`, and `Some of the Android App Bundle uploads are not completed yet`. `This Edit has been deleted` means the failed gpc edit is gone; just rerun the script.

Read back:

```bash
gpc releases status --track internal --output json
```

Success is the internal track with `status: completed` and the new versionCode.

## 3. Browser fallback for listing/app mutations

When `gpc listings` or app-detail updates fail with rejected-update acknowledgement even with `--changes-not-sent-for-review`, do that edit in Play Console with `dev-browser`. If an extension popup (for example a password manager) blocks automation, stop and ask the user to dismiss it; never switch to OS-level computer control. Enter App Review credentials only from the current secret-managed `APP_REVIEW_EMAIL` / `APP_REVIEW_OTP`; never paste them into public fields, logs, docs, or chat.

## Return

Package, AAB path + SHA256, versionCode, internal `gpc releases status`, which path succeeded (script or browser), and any Play Console item still manual. Then continue `$ns-android-beta` step 4.
