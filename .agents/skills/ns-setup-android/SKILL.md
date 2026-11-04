---
name: ns-setup-android
description: Sets up local Android development for NowStack Mobile. Installs Android Studio, SDK, JDK 17, a Pixel emulator, and the first Expo Android dev build. Use for /ns android setup, emulator setup, or npm run android failures; not Play releases.
disable-model-invocation: true
---

# Android Local Setup

Local dev only: no signing, no Play Console, no release builds (`$ns-android-beta`, `$ns-android-distribute`). Android counterpart of `$ns-ios-setup`. Read `.agents/rules/launch-app.md` and `.agents/rules/mobile-app.md`. Keep `mobile-app/android/` generated and uncommitted unless the user asks for native edits.

## 1. Inspect (skip what already works)

```bash
uname -s
java -version; echo "$ANDROID_HOME"; ls "$HOME/Library/Android/sdk" 2>/dev/null
command -v adb sdkmanager avdmanager emulator
ls -d "/Applications/Android Studio.app" 2>/dev/null
node -e 'if(Number(process.versions.node.split(".")[0])<22){console.error("Node 22+ required");process.exit(1)}'
```

The paths and Homebrew installs below are macOS; on Windows/Linux install Android Studio from developer.android.com and use its SDK path for `ANDROID_HOME`, then continue at step 3.

## 2. Install (macOS, one confirmation for the missing batch)

```bash
brew install --cask android-studio
brew install android-commandlinetools android-platform-tools openjdk@17
```

Append to `~/.zprofile` only if equivalent lines are absent, and export them in the current shell:

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export JAVA_HOME="$(/usr/libexec/java_home -v 17)"
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
```

## 3. SDK packages and Pixel AVD

```bash
yes | sdkmanager --licenses
sdkmanager --sdk_root="$ANDROID_HOME" "cmdline-tools;latest" "platform-tools" "emulator" \
  "platforms;android-36" "build-tools;36.0.0" "system-images;android-36;google_apis_playstore;arm64-v8a"
avdmanager list device        # pick the newest Pixel profile
printf 'no\n' | avdmanager create avd --force -n nowstack_pixel_9_pro_xl_api_36 -d pixel_9_pro_xl \
  -k "system-images;android-36;google_apis_playstore;arm64-v8a"
```

Android 36 / build-tools 36.0.0 match Expo SDK 54. Use a newer stable API only if `sdkmanager --list` has its complete Play Store image (use `x86_64` on Intel hosts); skip canary images. Let Gradle install extra build-tools, CMake, or NDK itself.

## 4. Boot and run

```bash
tmux new-session -d -s nowstack-emulator \
  "PATH=\"$ANDROID_HOME/emulator:\$PATH\" emulator -avd nowstack_pixel_9_pro_xl_api_36 -gpu swiftshader_indirect -netdelay none -netspeed full"
adb wait-for-device
until [ "$(adb shell getprop sys.boot_completed | tr -d '\r')" = "1" ]; do sleep 2; done
lsof -nP -iTCP:8081 -sTCP:LISTEN     # must be free or this repo's Metro
```

Launch the stack with `npm run start-all -- --port 3003 --android`, or Metro alone plus the dev build:

```bash
tmux new-session -d -s nowstack-android -c "$PWD/mobile-app" 'LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npx expo start --port 8081 --dev-client'
cd mobile-app && LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 ANDROID_SERIAL=emulator-5554 npm run android
```

Pin the device with `ANDROID_SERIAL`, never `--device emulator-5554`. First Gradle build takes several minutes.

## 5. Verify

```bash
adb shell getprop ro.product.model; adb shell getprop ro.build.version.sdk
adb logcat -d | grep -E 'ReactNativeJS|Running "main"' | tail -20
adb exec-out screencap -p > /tmp/nowstack-android.png
```

Open the screenshot: it must show NowStack, not another Expo app.

## Fixes

- Wrong Java / Gradle Java error: export the JDK 17 `JAVA_HOME`.
- Emulator exits when detached: run it in tmux with `-gpu swiftshader_indirect`.
- Another app's bundle or stale JS: free 8081, restart NowStack Metro, `adb reverse tcp:8081 tcp:8081`, `adb shell am force-stop <package>`. Only `adb shell pm clear <package>` with user approval; it signs the user out. `<package>` is `android.package` from `npx expo config --json`.

## Return

SDK/JDK status, AVD name + API level, app launch state, tmux session names, screenshot path, remaining manual steps.
