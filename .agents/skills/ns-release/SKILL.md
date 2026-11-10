---
name: ns-release
description: Ships one coherent NowStack Mobile X.Y.Z release. Versions source first, builds matching TestFlight and Play betas, verifies them, then promotes those exact binaries and tags Git. Use for `/ns release`, a new app version, or promoting the latest beta.
disable-model-invocation: true
---

# Release - NowStack Mobile

Source version, changelog, IPA/AAB, store version, release notes, and Git tag all identify the same `X.Y.Z`. The version is embedded at build time, so the order is fixed: version source -> build betas -> verify exact betas -> promote exact betas -> tag. A rebuild creates a new binary and resets verification.

## 1. Preflight

```bash
git status --short
git rev-parse --abbrev-ref HEAD
```

Stop on a dirty tree unless every change belongs to this release. Ask which platforms: iOS, Android, or both. The production credential gate (`$ns-publish-to-production`) runs inside the beta and distribute skills; do not run it separately here.

## 2. Version source

Read the current version in `site-config.ts` (`version`), `mobile-app/app.config.ts`, and `mobile-app/package.json`; agree patch/minor/major with the user and compute `X.Y.Z`. Write a dated `CHANGELOG.md` entry from commits since the last release tag, plus user-facing iOS and Android release notes, each approved by the user. Update all three version fields and show the diff. Get fresh explicit approval, then:

```bash
git add site-config.ts mobile-app/app.config.ts mobile-app/package.json CHANGELOG.md
git commit -m "chore(release): vX.Y.Z"
```

If approval is withheld or the commit fails, stop: never build a release binary from uncommitted version state. Do not tag or push yet.

## 3. Build matching betas

iOS -> `$ns-ios-testflight`; Android -> `$ns-android-beta`. They own the gate, build-cost and upload confirmations. Record each returned marketing version and build number/versionCode. Any marketing version other than `X.Y.Z` stops that platform; never promote it.

## 4. Verify

- Run `$ns-verify` on the release commit and `$ns-ios-audit` (read-only) for iOS.
- Read back App Store Connect and Play internal-track store state for the recorded builds: version, build/versionCode, processing state, tester availability.
- Ask the user to smoke-test the installed TestFlight / internal-track build (startup, sign-in, core flow, purchase, deep link, account deletion) and record the result. Simulator dev-build proof does not cover the store binary.

Only evidence for the exact `X.Y.Z` builds passes.

## 5. Promote

iOS -> `$ns-ios-distribute`; Android -> `$ns-android-distribute`, each with the approved notes and recorded build. Each App Store review submission and each Play production promotion needs its own fresh explicit confirmation (account, app/package, version, build, track, rollout, notes) and a provider read-back after. Report platforms independently; one failure never becomes a global success.

## 6. Tag and push

After submissions are accepted or queued, show the tag and remote, get fresh explicit approval, then:

```bash
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin HEAD
git push origin vX.Y.Z
```

If approval is withheld, report the exact commands left to run.

## Rules

- Never combine commit, push, build credits, store upload, and store submission into one blanket confirmation.
- Never claim success from local command output; read back store state.
- Return per platform: version, build id/versionCode, verification evidence, submission state, and remaining manual gates.
