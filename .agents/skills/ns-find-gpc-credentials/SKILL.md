---
name: ns-find-gpc-credentials
description: Finds and verifies the Google Play service account for gpc. Locates or creates the JSON key and stores it ignored. Use when Play uploads need auth, GPC_SERVICE_ACCOUNT or GPC_APP is unset, gpc doctor fails, or before $ns-android-beta / $ns-android-distribute.
disable-model-invocation: true
---

# Find Google Play Credentials

Read-only helper: find or create the service-account JSON, store it at the ignored runtime path, and prove `gpc` can read the app. Never upload, publish, promote, or edit listings here.

A Play credential spans two consoles: Google Cloud owns the service account + JSON key (with `androidpublisher.googleapis.com` enabled on its `project_id`); Play Console owns app access (the `client_email` invited under Users and permissions). `google-services.json`, keystores (`.jks`/`.keystore`), OAuth client secrets, and `.p8` files are not Play API credentials.

## 1. Target and existing auth

```bash
PACKAGE_NAME=$(node -e 'const s=require("fs").readFileSync("site-config.ts","utf8");const m=s.match(/androidPackage:\s*"([^"]+)"/);if(!m)process.exit(1);process.stdout.write(m[1])') || { echo "androidPackage missing"; exit 1; }
export GPC_APP="$PACKAGE_NAME"
test -f mobile-app/google-play-service-account.json && export GPC_SERVICE_ACCOUNT="$PWD/mobile-app/google-play-service-account.json"
command -v gpc && gpc --version
gpc doctor || true
gpc releases status || true
```

`$PACKAGE_NAME` must equal Expo `android.package` (`SiteConfig.androidPackage ?? SiteConfig.bundleId` in `mobile-app/app.config.ts`); never fall back to the starter package. If `gpc doctor` and `gpc releases status` both work, go to step 5. If `gpc` is missing, install it per `$ns-deploy-android-app`.

## 2. Find candidate JSON files

```bash
find "$HOME/Downloads" "$HOME/Desktop" "$HOME/Documents" "$HOME/Developer" "$HOME/.config/gcloud" \
  -maxdepth 6 -type f -name "*.json" -size -2M 2>/dev/null |
while IFS= read -r f; do
  jq -e '.type=="service_account" and (.client_email|test("@.*\\.iam\\.gserviceaccount\\.com$")) and (.private_key|startswith("-----BEGIN PRIVATE KEY-----"))' "$f" >/dev/null 2>&1 || continue
  jq -r --arg f "$f" '"\($f)\tproject=\(.project_id)\temail=\(.client_email)\tkey_id=\((.private_key_id//"")[0:8])..."' "$f"
done
```

Never print `.private_key` or paste the JSON into chat. With several matches, pick by `client_email` + `project_id` and confirm with the user.

## 3. None found: create one

Console path: Google Cloud -> select/create a dedicated project -> APIs & Services -> enable Google Play Android Developer API -> IAM & Admin -> Service Accounts -> create -> Keys -> JSON. No visible "linked project" is required. With `gcloud` already authenticated and the user's chosen `{project_id}`:

```bash
gcloud config set project "{project_id}"
gcloud services enable androidpublisher.googleapis.com
gcloud iam service-accounts create play-publisher --display-name "NowStack Play Publisher"
gcloud iam service-accounts keys create "$HOME/Downloads/nowstack-play-publisher.json" \
  --iam-account "play-publisher@{project_id}.iam.gserviceaccount.com"
```

The private key is downloadable only at creation; a lost key means creating a new one.

## 4. Grant Play Console access (user, browser)

The user invites the `client_email` in Play Console -> Users and permissions, app-scoped to `$PACKAGE_NAME`: testing-track release for beta, plus release-to-production for `$ns-android-distribute`, store presence for listing sync, financial data only if purchase verification needs it. Account-wide admin only if the user explicitly accepts it. Never automate the user's Google login or 2-Step Verification.

## 5. Store and verify

```bash
mkdir -p "$HOME/Developer/google-play"
install -m 600 "/path/to/verified-service-account.json" "$HOME/Developer/google-play/nowstack-play-service-account.json"
ln -sf "$HOME/Developer/google-play/nowstack-play-service-account.json" mobile-app/google-play-service-account.json
git check-ignore -q mobile-app/google-play-service-account.json || { echo "NOT IGNORED - stop"; exit 1; }
export GPC_SERVICE_ACCOUNT="$PWD/mobile-app/google-play-service-account.json"
gpc auth login --service-account "$GPC_SERVICE_ACCOUNT"
gpc doctor
gpc releases status
```

Move the verified original out of `~/Downloads` so later runs do not pick a stale duplicate. Fastlane fallback check: `bundle exec fastlane run validate_play_store_json_key json_key:"$GPC_SERVICE_ACCOUNT"`.

## Failures

- API disabled / never used: enable `androidpublisher.googleapis.com` on the JSON's `project_id`.
- `The caller does not have permission` / `Package not found`: email not invited, lacks app access, or the app for `$PACKAGE_NAME` is in another developer account.
- Auth missing: wrong `GPC_SERVICE_ACCOUNT` path, malformed JSON, or `gpc auth login` not run.

## Return

`GPC_APP`, `GPC_SERVICE_ACCOUNT` path, `project_id`, `client_email`, permission scope, and the `gpc doctor` / `gpc releases status` result. Record only these non-secret facts; never the key or JSON contents.
