---
name: ns-ios-deploy-app
description: App Store Connect command reference for NowStack Mobile using asc and asc-api.mjs. Use when $ns-ios-distribute needs exact entity endpoints, metadata/IAP/review commands, validation, staging, or submit syntax without EAS Submit.
disable-model-invocation: true
---

# ns-ios-deploy-app - asc command reference

Command detail only. The release order, confirmations, and read-back gates live in `$ns-ios-distribute`; TestFlight upload/testers live in `$ns-ios-testflight`. Never use `eas submit`.

## Auth and IDs

Auth comes from `$ns-find-asc-credentials` (`asc auth status --validate` must say "works"; `ASC_KEY_ID`/`ASC_ISSUER_ID`/`ASC_P8_PATH` exported for `node mobile-app/scripts/asc-api.mjs <METHOD> <path> [body.json]`).

| Variable | Resolve with |
| --- | --- |
| `{asc_app_id}` | `asc apps list --output table` or `GET "/v1/apps?filter[bundleId]={bundle_id}"` |
| `{build_db_id}` | `GET "/v1/builds?filter[app]={asc_app_id}&limit=3"` (processed build) |
| `{version_id}` | `GET "/v1/apps/{asc_app_id}/appStoreVersions?filter[appStoreState]=PREPARE_FOR_SUBMISSION"`; none -> `POST /v1/appStoreVersions` `{platform:"IOS",versionString}` + app relationship |
| `{version_loc_id}` | en-US `appStoreVersionLocalizations` of `{version_id}` |
| `{app_info_id}` / `{app_info_loc_id}` | `GET /v1/apps/{asc_app_id}/appInfos` + its localizations |

## Entity map (which entity owns which field)

| Field | Command |
| --- | --- |
| attached build | `PATCH /v1/appStoreVersions/{version_id}/relationships/build` body `{data:{type:"builds",id:"{build_db_id}"}}` |
| description, keywords (100 chars, no space after commas), promotionalText, supportUrl, marketingUrl | `PATCH /v1/appStoreVersionLocalizations/{version_loc_id}` |
| subtitle (30 chars), privacyPolicyUrl | `PATCH /v1/appInfoLocalizations/{app_info_loc_id}` |
| primaryCategory | `PATCH /v1/appInfos/{app_info_id}` relationship `{"type":"appCategories","id":"LIFESTYLE"}` |
| copyright, release type | `PATCH /v1/appStoreVersions/{version_id}` |
| age rating | `GET /v1/appInfos/{app_info_id}/ageRatingDeclaration`, then `PATCH /v1/ageRatingDeclarations/<id>` |
| content rights | `asc apps update --id {asc_app_id} --content-rights DOES_NOT_USE_THIRD_PARTY_CONTENT` |
| review contact + demo account | `POST /v1/appStoreReviewDetails` |
| screenshots | `asc screenshots upload --version-localization "{version_loc_id}" --path "{screenshots_dir}" --device-type "IPHONE_65"` |
| app availability | `GET "/v1/territories?limit=200"`, then `POST /v2/appAvailabilities` (v2) with every territory |

## Subscriptions / IAP

Product ID must equal `site-config.ts > payment.productIds.apple`.

```bash
asc subscriptions groups localizations create --group {sub_group_id} --locale en-US --name "<group name>"
asc subscriptions localizations create --subscription-id {subscription_id} --app {asc_app_id} --locale en-US --name "<plan>" --description "<benefit>"
asc subscriptions pricing equalize --subscription-id {subscription_id} --base-price "<price>" --base-territory "<ISO3>" --confirm
asc subscriptions review screenshots create --subscription-id {subscription_id} --file "{screenshots_dir}/<paywall>.png"
asc validate iap --app {asc_app_id} --output table
asc validate subscriptions --app {asc_app_id} --output table
```

## Validate, stage, submit, read back

```bash
asc validate --app {asc_app_id} --version "{version}" --platform IOS --output json
asc release stage --app {asc_app_id} --version "{version}" --build "{build_id}" --metadata-dir "./metadata/version/{version}" --dry-run --output table
asc review submit --app {asc_app_id} --version "{version}" --build "{build_id}" --dry-run --output table
asc review submit --app {asc_app_id} --version "{version}" --build "{build_id}" --confirm
asc status --app {asc_app_id} --output table
asc submit status --version-id "{version_id}"
```

One-shot alternative for a re-submit with an IPA: `asc publish appstore --app {asc_app_id} --ipa "{ipa_path}" --version "{version}" --submit [--wait] --dry-run`, then the same with `--confirm`. Every `--confirm` above follows the caller's confirmation gate. `asc web ...` is an escape hatch for web-only gaps, only with the user knowingly using their Apple session.

## Failure map

- Missing screenshots -> wrong slot or size: `IPHONE_65` needs exactly 1242x2688.
- `app availability not found` -> initialize with `POST /v2/appAvailabilities`, retry.
- Subscription review screenshot stuck processing -> delete the asset, re-upload.
- Cannot attach/submit -> build still processing; `--wait` or poll `asc status`.
- Wrong app -> `{asc_app_id}`, bundle ID, or team mismatch; stop.
- First-review IAP selection or App Privacy publish may be web-only -> manual gate.
