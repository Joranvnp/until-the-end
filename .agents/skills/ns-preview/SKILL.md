---
name: ns-preview
description: Mirrors one NowStack iOS Simulator into a live browser via serve-sim. Opens the stream in a controllable browser and drives the app from it. Use for `/ns preview`, showing the Expo app, or browser-visible mobile UI proof.
---

# NS Preview

Stream one explicit Simulator through `serve-sim` into a browser. No Expo or Xcode project changes. `$ns-ios-verification` still owns app launch, auth, deep links, backend read-back, and the PASS/FAIL verdict.

There is no host-specific path. Every agent does the same four steps. If the harness cannot drive a browser, run `open "<url>"` for the user and label the stream `NOT VERIFIED`.

## 1. Pick one UDID

`xcrun simctl list devices available`, choose one, set `SIM="<simulator-udid>"`, and use it in every later call. Never `booted` once more than one Simulator may be active.

## 2. Get the app rendering

Reuse a healthy app/Metro; do not rebuild or restart user-owned processes for the mirror. Otherwise boot, install, launch, and point the dev client at Metro per `$ns-ios-verification` Mode B, addressing `"$SIM"`. Read `BUNDLE_ID` from the installed `.app` `Info.plist`: a stale dev build can differ from `site-config.ts` (`simctl launch` then fails with `FBSOpenApplicationServiceErrorDomain code=4`). Report any mismatch; the fix is `cd mobile-app && npm run ios`.

## 3. Start the mirror, scoped to that UDID

Run in its own long-lived terminal. `serve-sim` exits when the device shuts down (`FrameCapture Code=2 "Device not booted"`), so supervise it:

```bash
SIM="<simulator-udid>"
cleanup_serve_sim() { npx --yes serve-sim@latest --kill "$SIM" >/dev/null 2>&1 || true; }
trap 'cleanup_serve_sim; exit 0' EXIT INT TERM HUP
cleanup_serve_sim
while true; do
  if [ "$(xcrun simctl list devices | grep "$SIM" | grep -c Booted)" -eq 0 ]; then sleep 3; continue; fi
  npx --yes serve-sim@latest --host 127.0.0.1 "$SIM"
  cleanup_serve_sim
  sleep 3
done
```

Wait for readiness: `until curl -sf --max-time 3 -o /dev/null http://127.0.0.1:3200; do sleep 2; done`

## 4. Open and prove

Open the exact URL `serve-sim` prints. Screenshot the browser and confirm a real Simulator frame (`live` badge, device name, app UI). HTTP 200 or a page shell is not proof.

## Driving the app

- Clicking and scrolling in the mirror is normal preview interaction, not computer-use.
- Route setup stays on `simctl`: `xcrun simctl openurl "$SIM" "<slug>://(app)/(tabs)/<route>"`.
- System alerts swallow mirror taps: `xcrun simctl terminate "$SIM" "$BUNDLE_ID"` then `launch`.
- Never type credentials, API keys, or personal data into the mirror, and never complete a system sign-in sheet there; Cancel and relaunch.

## Safety

Never run an unscoped `serve-sim --kill`; another task may own a different Simulator. Keep the preview on `127.0.0.1`; never expose its shell-enabled control surface to a LAN or public interface. Do not edit `.xcodeproj`, `.xcworkspace`, Expo config, schemes, or build settings, and do not use the Swift-package preview launcher. `trash` temp files.

## Report

Simulator name + UDID, installed bundle id and whether it matches `site-config.ts`, Metro port, preview URL, browser used, whether a real frame was observed, screenshot path, mirror restarts, and interactions left unverified. No PASS when only the page shell loaded.
