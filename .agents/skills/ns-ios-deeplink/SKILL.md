---
name: ns-ios-deeplink
description: Fixes and verifies iOS Universal Links for NowStack Mobile - AASA files, associated domains, Expo Router callback routes, and safe sign-in returnTo. Use when an https link opens Safari instead of the app, or a TestFlight build loses the post-auth destination.
disable-model-invocation: true
---

# iOS Deeplinks - NowStack Mobile

A Universal Link opens the app only if every layer agrees: the installed build has `applinks:<host>` for that exact host, Apple can fetch a valid AASA naming `{APPLE_TEAM_ID}.{bundle_id}` with matching paths, Expo Router has a route for the literal web path, and signed-out users keep a safe native `returnTo`. Any gap opens Safari. Do not stop at code inspection.

Read `.agents/rules/mobile-app.md`, `mobile-app/app.config.ts`, `site-config.ts`, and the `mobile-app/app/` tree first. Never commit or print `.p8`, `.p12`, profiles, p12 passwords, or `credentials.json`; use `trash`, never `rm -rf`.

## A. Identify the failing URL

Record `url`, `domain`, `path`, nested callback, `bundle_id`, `apple_team_id`, and the intended native destination (detail route, signed-in route with its group like `/(app)/...`, or home fallback):

```bash
node -e 'const u=new URL(process.argv[1]); console.log({origin:u.origin, pathname:u.pathname, callbackUrl:u.searchParams.get("callbackUrl"), returnTo:u.searchParams.get("returnTo")})' "$url"
```

## B. Web AASA

Serve `https://{domain}/.well-known/apple-app-site-association` and `https://{domain}/apple-app-site-association` from `web-app/` (TanStack Start routes under `web-app/app/routes/`): no auth, no redirect, no `.json` extension, `Content-Type: application/json`, under 128 KB. Body: `applinks.details[].appIDs` = `["TEAMID.bundle.id"]`, narrow `components` (e.g. `/auth/signin`, `/auth/signin/`, `/app/*`, `/go/*`) rather than `/*`, plus `webcredentials.apps`. On Vercel, set the header for both paths in `web-app/vercel.json`, or it serves `application/octet-stream`.

Verify live, then Apple's CDN (can lag; a fresh TestFlight install refreshes device state):

```bash
curl -i -sS "https://$domain/.well-known/apple-app-site-association" | sed -n '1,80p'
curl -i -sS "https://$domain/apple-app-site-association" | sed -n '1,80p'
curl -I -sS "$url" | sed -n '1,60p'                       # the link itself is a real page, not 404
curl -i -sS "https://app-site-association.cdn-apple.com/a/v1/$domain" | sed -n '1,100p'
```

Expect 200, `application/json`, the exact app ID and paths; the CDN `Apple-From:` points at the live file.

## C. App config

`mobile-app/app.config.ts` `ios.associatedDomains` lists every real host, e.g. `["applinks:example.com", "applinks:www.example.com"]`. Keep the file plain-JS-evaluable per `.agents/rules/mobile-app.md` (no TypeScript-only syntax) and keep `ITSAppUsesNonExemptEncryption: false`.

## D. Routes and safe resolver

- Add Expo Router files for the literal web paths (groups are not in web URLs), e.g. `mobile-app/app/auth/signin.tsx`, `mobile-app/app/app/items/[itemId].tsx`, `mobile-app/app/go/[shortId].tsx`.
- `auth/signin.tsx` reads `callbackUrl` / `returnTo`, resolves them, redirects authenticated users to the target, and sends signed-out users to auth with a sanitized native `returnTo`. The auth screen applies the same resolved target after OTP/social sign-in (`router.replace(target.href)`; social `callbackURL: target.path`).
- Create `mobile-app/lib/deep-links.ts` (`resolveMobileReturnTo`), React-free: accept only trusted origins and known paths; unwrap nested `/auth/signin?callbackUrl=` / `?returnTo=`; map web paths to native route objects with group segments; reject external origins, `//evil.com`, backslashes, control characters, `javascript:`, bad percent encoding, and deep nesting; fall back to home.
- Tests cover the reported URL, direct detail paths, preserved native paths, unsupported fallbacks, and unsafe inputs. Then `cd mobile-app && npx tsc --noEmit`; if the web changed, `cd web-app && npm run typecheck && npm run build`.

## E. Ship and inspect

The fix reaches devices only in a new build. From an isolated `git worktree add` of the release baseline (only the deeplink patch, plus ignored signing files), run `$ns-ios-testflight` phases E-F (OS routing, build, upload after confirmation). Before upload, inspect the IPA:

```bash
inspect_dir="/tmp/ipa-inspect-$(date +%Y%m%d%H%M%S)"; mkdir -p "$inspect_dir"
unzip -q /tmp/{slug}.ipa -d "$inspect_dir"
/usr/bin/codesign -d --entitlements :- "$inspect_dir/Payload/{AppName}.app" 2>/dev/null | plutil -p -
LC_ALL=C grep -a -q '/auth/signin' "$inspect_dir/Payload/{AppName}.app/main.jsbundle" && echo auth-route-present
```

Expect `com.apple.developer.associated-domains` with the hosts and `get-task-allow = false`.

## F. Simulator proof

Standard flows go through `$ns-ios-verification`. For links:

```bash
xcrun simctl openurl "$UDID" "{scheme}://auth/signin?callbackUrl=%2Fapp%2Fitems%2F123"   # resolver/routes
xcrun simctl openurl "$UDID" "https://$domain/auth/signin?callbackUrl=%2Fapp%2Fitems%2F123"
xcrun simctl io "$UDID" screenshot /tmp/deeplink.png
```

If HTTPS opens Safari, check the installed app's entitlements (`codesign -d --entitlements :-` on the `xcrun simctl listapps` bundle path). A dev build without Associated Domains, or installed before the AASA was live, is expected to open Safari and is not a TestFlight failure.

## Done

Report each: live AASA 200 + JSON; CDN matches; failing URL is a real page; routes + resolver + tests; typechecks; IPA entitlement + route in bundle; TestFlight build `VALID` or the exact blocker. Next user action: update to the new TestFlight build; if Safari persists, delete and reinstall once.
