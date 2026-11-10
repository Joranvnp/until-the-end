---
name: ns-ios-setup
description: Sets up local iOS dev tooling for NowStack Mobile on macOS - Xcode, Simulator runtime, CocoaPods, Watchman, mobile deps, and the first expo run:ios. Use for ios local-setup, setup-ios, simulator preview, or local TestFlight build prerequisites.
disable-model-invocation: true
---

# iOS Local Setup - NowStack Mobile

Goal: `npm run ios` builds the dev client and launches it in the Simulator. Local only: no Apple ID, no signing, no uploads (that is `$ns-ios-testflight`). Payments, IAP, and Apple Sign In need this dev build; never verify them in Expo Go.

## 1. Guard

`uname -s` must print `Darwin`. Otherwise stop: local iOS builds need a Mac; offer an EAS cloud build via `$ns-setup-expo` then `$ns-ios-testflight`, or Android/web locally.

## 2. Detect

| Component | Check | Fix |
| --- | --- | --- |
| Xcode.app (~7 GB) | `xcodebuild -version` | App Store or `brew install xcodes && xcodes install --latest`; offer `$ns-doctor` for the GUI install |
| Developer dir | `xcode-select -p` ends in `/Xcode.app/Contents/Developer` | `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer` |
| License | `xcodebuild -version` has no license error | `sudo xcodebuild -license accept` |
| First launch | idempotent | `xcodebuild -runFirstLaunch` |
| iPhone runtime | `xcrun simctl list devices available \| grep -i iphone` | `xcodebuild -downloadPlatform iOS` |
| CocoaPods | `pod --version` | `brew install cocoapods` |
| Watchman | `command -v watchman` | `brew install watchman` |
| Mobile deps | `ls mobile-app/node_modules/.bin/expo` | `cd mobile-app && npm install` |

Keep `mobile-app/.npmrc` (`legacy-peer-deps=true`); without it npm leaves `node_modules` empty and `expo: command not found`. Check the binary exists, not just exit 0.

## 3. Install

Show every missing component with its exact command (flag Xcode's size) and get one confirmation for the batch. Run in order; skip anything present; never reinstall or re-accept.

## 4. First build

```bash
cd mobile-app && npm run ios                      # expo run:ios: prebuild, pod install, compile, launch
npm run ios -- --device "iPhone 17 Pro"           # specific simulator
npx expo start --port 8082                        # if another Expo app owns 8081
```

- First build takes minutes; run it in the background and do not report success until the app shows in the Simulator.
- `mobile-app/ios/` is generated and gitignored; never commit it. Clear a corrupt `ios/` or `Pods/` with `trash`, never `rm -rf`.
- Build fails -> read the real log (pod install vs Xcode compile vs Metro) and `docs/troubleshooting.md` before guessing.

## 5. Report

Installed / already present / skipped, simulator used, Metro port. Next: `npm run start-all` for the daily loop, `$ns-preview` or `$ns-ios-verification` to exercise flows, `$ns-ios-testflight` for signing and builds. Do not change the user's global Node/Ruby versions.
