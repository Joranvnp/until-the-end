---
name: ns-verify
description: Proves NowStack Mobile changes on web, iOS, Android, and Convex. Routes each surface to its runtime proof and returns a per-surface verdict. Use for `/ns verify`, regression checks, acceptance proof, or release verification.
disable-model-invocation: true
---

# Verify - NowStack Mobile

Prove each changed journey on its real surface. Compilation is not runtime proof. Read `.agents/rules/verification.md` and `.agents/rules/launch-app.md` first.

## Modes

- Default: reuse running servers/Metro (inspect port `3003` and `8081` first; never restart a user-owned process). Starting a missing runtime needs explicit authorization unless the user already asked for it.
- `--read-only`: never start/restart a runtime, run codegen, deploy, install, or mutate local/provider state. Return `NOT VERIFIABLE` where existing evidence is insufficient.

## Route each surface

- Web: `dev-browser` against `http://localhost:3003` or the supplied deployed URL. Capture URL, interaction, console/network errors, and a screenshot.
- iOS: run `$ns-ios-verification` (it owns launch, deep links, auth, and the iOS verdict). Add `$ns-preview` only when a live browser mirror helps.
- Android: install the build under test (`cd mobile-app && npm run android` for dev), drive it with `adb shell am start -a android.intent.action.VIEW -d "<slug>://<route>"`, capture `adb exec-out screencap -p`. Use a dedicated emulator when agents run in parallel.
- Convex: read existing logs (`logs/convex.log`) and read-only function/provider read-backs. Run `npx convex dev --once` only with explicit authorization, never in `--read-only`.

## Minimum matrix per changed journey

Signed-out state, happy path, relevant error/empty/loading state, signed-in state when applicable, cold relaunch/persistence (mobile), direct/deep-link entry. For mutations, confirm the backend/provider read-back, not UI optimism.

## Safety

Use project-owned test accounts per `.agents/rules/verification.md`; never print App Review credentials. Production checks are read-only unless the user authorizes the exact mutation.

## Report

Per surface: `PASS` / `FAIL` / `NOT VERIFIABLE`, command, runtime target, account class, observed result, artifact path, remaining gap. Never generalize iOS proof to Android or local proof to production.
