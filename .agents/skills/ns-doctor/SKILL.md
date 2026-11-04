---
name: ns-doctor
description: Install and verify the NowStack Mobile developer toolchain. Detects missing CLIs and Xcode or Android Studio for the current OS, installs the approved batch, and re-verifies. Use for a fresh machine, command not found errors, or before connecting accounts.
disable-model-invocation: true
---

# ns-doctor

Installs tools only. Never log in or write credentials; that is `$ns-setup-accounts`.

## 1. Inspect

```bash
uname -s                                   # Darwin | Linux; Windows = PowerShell + winget/scoop
node -v
node scripts/check-setup.mjs --accounts
for c in bun eas vercel asc gpc fastlane gcloud stripe gh wrangler; do command -v $c >/dev/null && echo "ok $c" || echo "MISSING $c"; done
xcodebuild -version >/dev/null 2>&1 && echo "ok xcode" || echo "MISSING xcode"
command -v adb >/dev/null && echo "ok android" || echo "MISSING android-studio"
```

Ask which surfaces ship. No iOS: skip `asc`, Xcode. No Android: skip `gpc`, `fastlane`, `gcloud`, Android Studio. No web payments: skip `stripe`. No R2: skip `wrangler`.

## 2. Propose one batch

Show every missing tool with the command for this OS (plus GUI download sizes), get one confirmation, then install the whole batch without re-prompting. Missing Node: propose nvm/fnm (`winget install OpenJS.NodeJS` on Windows); never switch an existing Node version. Missing Homebrew on macOS: `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`.

| Tool | macOS | Linux | Windows |
| --- | --- | --- | --- |
| `eas`, `vercel`, `wrangler` | `npm i -g eas-cli vercel wrangler` | same | same |
| `gpc` | `npm i -g @gpc-cli/cli` | same | same |
| `asc` | `brew install asc` | download from https://asccli.sh | skip (iOS release is macOS-only) |
| `fastlane` | `brew install fastlane` | `gem install fastlane` | `gem install fastlane` |
| `bun` | `brew install bun` | distro package manager | `scoop install bun` |
| `gcloud` (optional) | `brew install --cask google-cloud-sdk` | Google Cloud apt/dnf repo | `winget install Google.CloudSDK` |
| `stripe` | `brew install stripe/stripe-cli/stripe` | Stripe apt/dnf repo | `scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git; scoop install stripe` |
| `gh` | `brew install gh` | distro package or GitHub apt repo | `winget install GitHub.cli` |
| Xcode (~7 GB) | App Store or `brew install xcodes && xcodes install --latest` | n/a | n/a |
| Android Studio (~1 GB + SDK) | `brew install --cask android-studio` | `sudo snap install android-studio --classic` | `winget install Google.AndroidStudio` |

Convex needs no global install (`npx convex`).

## Rules

- Never pipe a remote install script into a shell. If an official installer script is unavoidable, download it to a temp file, show its HTTPS origin and contents, and run it only after explicit confirmation.
- Idempotent: never reinstall or upgrade a tool already on PATH unless asked.
- Never run `brew` on Linux or Windows.
- After Xcode: `sudo xcodebuild -license accept`. After Android Studio: create an AVD and export `ANDROID_HOME` (full local setup is `$ns-ios-setup` / `$ns-setup-android`).

## 3. Return

Re-run the inspect block. Report installed now / already present / skipped / still missing, then hand off to `$ns-setup-accounts`.
