---
name: ns-deploy-android-app
description: Google Play gpc command reference for NowStack Mobile. Covers install, auth, validation, upload, track status, listings, promotion, rollout control, Fastlane fallback, and error diagnosis. Use when a Play workflow needs exact gpc syntax or a gpc error must be explained.
disable-model-invocation: true
---

# Google Play gpc Reference

Reference only. Workflows own the sequence and approvals: `$ns-android-beta` (AAB build + internal upload), `$ns-android-play-console-release` (commit-bug / browser fallback), `$ns-android-distribute` (production). Credentials: `$ns-find-gpc-credentials` (exports `GPC_APP`, `GPC_SERVICE_ACCOUNT`). Android ships through `gpc`, never EAS Submit.

## Guardrails

- Run a mutating command (`publish`, `releases upload|promote|assign|rollout *`, `listings push|update`, `listings images upload`) only from a workflow skill, after its validate-only / `--dry-run` step and the user's explicit confirmation of package, track, artifact, and notes.
- Never print or commit the service-account JSON, keystores, or passwords; mask paths in summaries.
- Android purchases use Google Play Billing with `payment.productIds.google` (Stripe is web only).

## Install and auth

```bash
npm install -g @gpc-cli/cli        # or: brew install yasserstudio/tap/gpc
gpc auth login --service-account "$GPC_SERVICE_ACCOUNT"
gpc doctor                          # auth, config, connectivity; --score for readiness grade
```

Never pipe a remote installer into a shell. Global flags: `--app <package>` (else `GPC_APP`), `--output json`, `--dry-run`, `--no-interactive`, `--yes`.

## Commands

| Need | Command |
| --- | --- |
| Offline compliance scan | `gpc preflight "$AAB" --fail-on error` |
| Server-side checks | `gpc validate "$AAB" --track internal` |
| Upload + validate, discard | `gpc publish "$AAB" --track internal --validate-only --changes-not-sent-for-review` |
| Upload to a track | `gpc releases upload "$AAB" --track internal --name "<version> (<versionCode>)" --notes "..." --changes-not-sent-for-review --output json` |
| Per-track binary proof | `gpc releases status --track <track> --output json` |
| Health overview (releases, vitals, reviews) | `gpc status` |
| Reuse an uploaded versionCode | `gpc releases assign <versionCode> --track <track>` |
| Promote without re-upload | `gpc releases promote --from internal --to production --rollout 10 --notes "..."` |
| Rollout control | `gpc releases rollout increase --track production --to 50`, `halt`, `resume`, `complete --track production` |
| Vitals watch | `gpc watch --track production --on-breach halt` |
| Listing sync (Fastlane layout) | `gpc listings pull --dir metadata/`, `gpc listings lint`, `gpc listings diff`, `gpc listings push --dir metadata/` |
| Screenshot upload (one file per call) | `gpc listings images upload --lang en-US --type phoneScreenshots <file.png>` |

`--rollout` and `--to` are percentages (`10` = 10%). `gpc status` can show empty releases while `gpc releases status` shows the track; trust `gpc releases status` for binary proof. A local `gpc preflight` crash is not a Play rejection; record it and rely on `validate` / `--validate-only`.

## Fastlane fallback (only when gpc is unavailable)

```bash
bundle exec fastlane supply --aab "$AAB" --track internal --json_key "$GPC_SERVICE_ACCOUNT" --validate_only true
bundle exec fastlane supply --aab "$AAB" --track internal --json_key "$GPC_SERVICE_ACCOUNT"
```

## Failure diagnosis

- `gpc doctor` fails -> `$ns-find-gpc-credentials`.
- First API upload fails on a brand-new app -> the Play app/package or first Console setup is incomplete; the user finishes it in Play Console.
- Package mismatch / reserved package -> AAB `android.package` differs from the Play app.
- Upload key / Play App Signing error -> keep EAS-managed signing (`mobile-app/eas.json` `android.credentialsSource: remote`); never mix local and EAS keystores or write keys into Gradle files.
- `API_CHANGES_NOT_SENT_FOR_REVIEW`, `changesNotSentForReview must not be set`, `bundle uploads are not completed yet`, or `This Edit has been deleted` -> `$ns-android-play-console-release`.
- `version code already used` -> promote or `assign` the existing build; do not re-upload.
- `preflight` blocks -> fix restricted permissions, target SDK, debuggable/exported flags, embedded secrets, or non-Play billing SDKs in source.
- Release blocked by app content -> Data safety, content rating, target audience, ads, app access, or privacy policy incomplete (`$ns-android-distribute`).
- App hits the dev backend -> AAB built before `mobile-app/eas.json` `build.production.env` had prod Convex URLs; rebuild.
