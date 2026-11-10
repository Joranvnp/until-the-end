---
name: ns-ios-verification
description: Proves NowStack Mobile iOS changes in the Simulator with xcrun simctl. Covers single or parallel Metro/device flows, deep links, preview routes, and signed-in state. Use for `ns ios verification`, "test on simulator", or changed `mobile-app/**`.
---

# iOS Verification - NowStack Mobile

Render the change in the Simulator with `xcrun simctl` only (deep links + screenshots). Never use computer-use. This skill owns launch, navigation, auth, backend read-back, and the iOS verdict; `$ns-preview` is only a live mirror.

## Preflight

- `uname -s` is `Darwin`; a dev build exists (`cd mobile-app && npm run ios` once). Native modules (IAP, Stripe, Apple Sign In) exist only in the dev build, not Expo Go.
- Node 22 + UTF-8 locale on every command (Node 18 cannot load `app.config.ts`; non-UTF-8 breaks `pod install`):

```bash
node -e 'if(+process.versions.node.split(".")[0]<22){console.error("Node 22+ required");process.exit(1)}'
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8
APP=$(find ~/Library/Developer/Xcode/DerivedData -path '*/Build/Products/Debug-iphonesimulator/*.app' -maxdepth 6 -type d 2>/dev/null | head -1)
BUNDLE_ID=$(/usr/libexec/PlistBuddy -c 'Print CFBundleIdentifier' "$APP/Info.plist")
SLUG=$(/usr/libexec/PlistBuddy -c 'Print CFBundleURLTypes:0:CFBundleURLSchemes:0' "$APP/Info.plist")
```

Read the slug and bundle id from the built `Info.plist`, not from `site-config.ts`.

## Mode A - single agent (default)

1. Metro on `8081` for this app only (a sibling app's Metro there serves the wrong bundle; tell the user if you stop it): `cd mobile-app && npx expo start --port 8081 --dev-client`
2. Clean launch: `xcrun simctl terminate booted "$BUNDLE_ID"; xcrun simctl launch booted "$BUNDLE_ID"`
3. Navigate, including the route group: `xcrun simctl openurl booted "$SLUG://(app)/(tabs)/settings"`
4. Capture and read: `xcrun simctl io booted screenshot /tmp/shot.png`. For a scrolled state, temporarily set `contentOffset={{ x: 0, y: N }}` on the `ScrollView`, capture, revert.

## Mode B - parallel agents

Never share the `8081` Simulator. Each agent gets its own device and Metro port (`8083`, `8084`, ...) and passes the explicit UDID to every call, never `booted`:

```bash
UDID=$(xcrun simctl create "agent-a" "iPhone 16 Pro"); xcrun simctl boot "$UDID"
xcrun simctl install "$UDID" "$APP"
(cd mobile-app && EXPO_NO_INTERACTIVE=1 npx expo start --port 8083 --dev-client &)
xcrun simctl launch "$UDID" "$BUNDLE_ID"
xcrun simctl openurl "$UDID" "$SLUG://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8083"
xcrun simctl openurl "$UDID" "$SLUG://(app)/(tabs)/settings"
xcrun simctl io "$UDID" screenshot /tmp/agent-a.png
```

The `url=` value must be URL-encoded. On `.expo/` cache races, add `--clear` to the first Metro or give each a distinct `TMPDIR`.

## Signed-in screens

`simctl` cannot type, so never walk the sign-in form yourself. Choose one:

1. UI only: temp route `mobile-app/app/<name>-preview.tsx` outside the `(app)` gate but inside root providers; deep-link to it, capture, `trash` it.
2. Real session: reuse a Simulator already signed in with a project-owned test account and cold-relaunch to prove `mobile-app/lib/auth-store.tsx` restores it. Otherwise ask the user to complete OTP sign-in with a controlled inbox or the private `APP_REVIEW_EMAIL` / `APP_REVIEW_OTP` pair. Never print those, expose them as `EXPO_PUBLIC_*`, or embed them in a route or bundle. If nobody can sign in, report authenticated behavior `NOT VERIFIABLE`. OTP send fails loudly without `LUMAIL_API_KEY` (fix via `$ns-setup-email`).

Static checks follow `.agents/rules/verification.md`.

## Finish

`trash` every temp `*-preview.tsx`, `simctl shutdown` + `delete` throwaway devices, then report screens verified, artifact paths, and each skipped check with its reason.
