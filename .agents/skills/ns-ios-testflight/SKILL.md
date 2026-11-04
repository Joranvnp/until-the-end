---
name: ns-ios-testflight
description: Builds a NowStack Mobile iOS app and uploads it to TestFlight. Checks the OS first - macOS builds locally with eas build --local; Windows/Linux run $ns-setup-expo and use EAS cloud. Use for ios setup, ios testflight, or a beta build.
disable-model-invocation: true
---

# iOS TestFlight - NowStack Mobile

Modes: `ios setup` / "credentials only" -> phases A-D, then stop and report readiness. `ios testflight` -> A-F. `--expo` forces EAS cloud on macOS. App Store submission is `$ns-ios-distribute`.

## Guardrails

- Get explicit confirmation before: creating an Apple distribution certificate (low per-account cap), any EAS cloud build (uses Expo credits), and the TestFlight upload.
- Never commit or print `.p8`, `.p12`, p12 passwords, provisioning profiles, or `credentials.json`. Do signing work in a directory outside the repo (e.g. `~/ios-credentials/<slug>/`).
- Env is baked into the binary: `eas.json > build.production.env` must point at PROD Convex before building.

## A. Preflight

```bash
uname -s || node -p "process.platform"
npm run check-setup
cd mobile-app && npx tsc --noEmit && npm run lint
eas whoami
asc version && asc auth status --validate
```

- `Darwin` -> `{build_mode}=local` (unless `--expo`); also require `xcodebuild -version` and `command -v pod`, else `$ns-ios-setup`.
- Linux / Windows -> `{build_mode}=expo`; never attempt a local iOS build. Run `$ns-setup-expo` first and stop until it is green.
- ASC auth failing or `ASC_KEY_ID`/`ASC_ISSUER_ID`/`ASC_P8_PATH` unknown -> `$ns-find-asc-credentials`.
- Confirm `site-config.ts` `title`, `bundleId`, `appleTeamId`, and payment product IDs with the user. The bundle ID is permanent once the app record exists.

## B. EAS project

`easProjectId` in `site-config.ts` still a placeholder -> `$ns-setup-expo` (owns `eas init` and the `easProjectId` write). Recheck `npm run check-setup`.

## C. Production backend

Run `$ns-publish-to-production` for Convex prod deploy, prod env, and its production credential boundary (production-specific OAuth clients, fresh Apple JWT, live Stripe). Never copy development secrets, an old Apple JWT, Stripe test keys, or a development webhook into production. Then set `mobile-app/eas.json`:

```json
"production": {
  "autoIncrement": true,
  "credentialsSource": "local",
  "env": {
    "EXPO_PUBLIC_CONVEX_URL": "https://<prod-deployment>.convex.cloud",
    "EXPO_PUBLIC_CONVEX_SITE_URL": "https://<prod-deployment>.convex.site"
  }
}
```

## D. Signing via ASC API (no Apple ID 2FA)

All calls: `node mobile-app/scripts/asc-api.mjs <METHOD> <path> [body.json]`. Write request bodies with `node -e` + `JSON.stringify`.

1. App record (hard gate): `GET "/v1/apps?filter[bundleId]={bundle_id}"`. Empty -> stop; the user creates it at appstoreconnect.apple.com (My Apps > + > New App) with this bundle ID. Else `{asc_app_id}=data[0].id`.
2. Bundle ID: `GET "/v1/bundleIds?filter[identifier]={bundle_id}"`; missing -> `POST /v1/bundleIds` (`platform: "IOS"`). Enable capabilities the app uses via `POST /v1/bundleIdCapabilities` (`IN_APP_PURCHASE`, `APPLE_ID_AUTH`, `PUSH_NOTIFICATIONS`).
3. Certificate: `GET "/v1/certificates?filter[certificateType]=DISTRIBUTION"`. Reuse only if the user has its `.p12`. Else, after confirmation:
   ```bash
   openssl req -new -newkey rsa:2048 -nodes -keyout dist.key -out dist.csr -subj "/CN={title} Distribution/C=US"
   # POST /v1/certificates {certificateType:"DISTRIBUTION", csrContent} -> save data.id; base64-decode certificateContent -> dist.cer
   ```
   409 / limit reached -> list certs and ask which to revoke (`DELETE /v1/certificates/<id>`); never revoke without confirmation.
4. Profile: `POST /v1/profiles` (`profileType: "IOS_APP_STORE"`, bundleId + certificate relationships, empty devices) -> base64-decode `profileContent` -> `appstore.mobileprovision`.
5. `.p12` (`-legacy` is mandatory):
   ```bash
   P12PASS=$(openssl rand -hex 12)
   openssl x509 -inform der -in dist.cer -out dist.pem
   openssl pkcs12 -export -in dist.pem -inkey dist.key -out dist.p12 -name "{title} Distribution" -passout pass:"$P12PASS" -legacy
   ```
6. Wire in: copy `dist.p12` and `appstore.mobileprovision` to `mobile-app/credentials/`; write `mobile-app/credentials.json` (`ios.provisioningProfilePath`, `ios.distributionCertificate.{path,password}`, paths relative to `mobile-app/`) by piping `$P12PASS` through stdin. Then `git check-ignore mobile-app/credentials.json mobile-app/credentials/dist.p12` must print both.

Setup-only stops here: report app record, cert, profile, `credentials.json`, `eas.json`, and the next command.

## E. Build

- local (macOS): `cd mobile-app && eas build --platform ios --profile production --local --non-interactive --output /tmp/{slug}.ipa`. No Expo cloud credits.
- expo (Windows/Linux or `--expo`, after confirmation): `eas build --platform ios --profile production --non-interactive --no-wait`; poll `eas build:view <BUILD_ID> --json` until FINISHED/ERRORED; download `artifacts.buildUrl` to `/tmp/{slug}.ipa`.
- `expo doctor` patch mismatch blocks the build -> `npx expo install --check`, minimal patch updates, rerun tsc + lint. Skipped build numbers under `autoIncrement` are fine.

## F. Upload, validate, testers

```bash
# beta group (required by --group): POST /v1/betaGroups {name:"Internal",isInternalGroup:true,hasAccessToAllBuilds:true}; 409 -> GET /v1/apps/{asc_app_id}/betaGroups
asc publish testflight --app "{asc_app_id}" --ipa /tmp/{slug}.ipa --group "{beta_group_id}" \
  --wait --timeout 45m --output json --pretty | tee /tmp/{slug}-testflight-upload.json   # -> {build_id}
asc validate testflight --app "{asc_app_id}" --build "{build_id}" --output table
```

- `processingState` must reach `VALID` (poll `asc status --app "{asc_app_id}" --output table`) or report Apple's exact failure.
- Fix validation gaps and rerun until clean: review contact via `asc testflight review view` + `asc testflight review edit --id <id> --contact-first-name ... --contact-last-name ... --contact-email ... --contact-phone ... --demo-account-required false --notes ...` (ask once for missing contact fields); "What to Test" via `asc build-localizations create|update --build "{build_id}" --locale en-US --whats-new "{what_to_test}"`, specific to this build.
- Testers (`{expected_tester_emails}` = requested emails, plus existing group testers for "invite all"): for each, `asc testflight testers invite --app ... --email ... --group ...`, `add-groups --id <tester_id> --group ...`, `add-builds --id <tester_id> --build-id "{build_id}"`, then resend `invite` after the build is attached.
- Read back: `asc testflight groups links view --group-id "{beta_group_id}" --type betaTesters|builds --paginate`, `asc testflight testers builds list --tester-id <id>`.

Report build number, build ID, validation result, beta group, and verified testers. A tester blocked by ASC team visibility is reported with the exact error.

## Failure map

- `.p12` rejected -> re-export with `-legacy`.
- Build asks for credentials -> `credentialsSource: "local"` missing or `credentials.json` paths wrong.
- Missing export compliance -> `"ITSAppUsesNonExemptEncryption": false` in `mobile-app/app.config.ts` `infoPlist`.
- App can't reach backend -> built before prod URLs; fix `eas.json` and rebuild.
- User insists on EAS-managed credentials -> `eas credentials` in a real terminal with the user; never script the 2FA prompt.
