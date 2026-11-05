# Verification

Rules for proving changes actually work.

## When this applies

- Any bugfix, route change, auth flow, UI change, deploy/setup change, or user challenge about whether something works.

## Surface → tool (REQUIRED)

- **Web UI / routes → `dev-browser` CLI.** Drive `web-app` verification with the `/dev-browser` skill (navigate, screenshot, fill, click). It can reuse the user's Helium/login state. Only fall back to Playwright/Browser plugin if dev-browser is unavailable, and say which fallback was used.
- **Mobile UI / Expo app → the `/ns-ios-verification` skill, with `/ns-preview` as the live browser channel.** To verify ANY `mobile-app/**` change, run `ns-ios-verification` — it owns the full procedure (single-agent + parallel multi-agent + OTP test login). When a live preview is useful, run `ns-preview`: one scoped `serve-sim` mirror opened in whatever browser the agent can drive, identical on every harness. Direct preview interaction and scoped `serve-sim` controls are allowed; prefer `simctl` deep links for deterministic route setup and never use computer-use.
- **NEVER use the computer-use / control-the-computer tools to drive the Simulator (or a browser) for UI verification.** No clicking pixels, no opening the Simulator window to navigate. Use `simctl` for mobile and `dev-browser` for web. Computer-use is a last resort only when explicitly requested.

## Mobile simulator — invariants (full procedure: `/ns-ios-verification` skill)

The `/ns-ios-verification` skill is the canonical, step-by-step procedure. Run it for any `mobile-app/**` verification instead of hand-rolling `simctl`. These are the invariants it enforces — do not break them even if you skim:

- **Toolchain:** Metro/builds run on **Node 22** (`eas.json` pins `22.20.0`) + a UTF-8 locale (`PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8`). Node 18 fails reading `app.config.ts`; a non-UTF-8 locale fails `pod install`.
- **Single-agent:** one Metro on `8081` (`npx expo start --port 8081 --dev-client`); clean-launch the dev build (`terminate` then `launch`) so it's foreground; navigate with `xcrun simctl openurl booted "<slug>://(app)/<route>"` (include the route-group segment); capture with `xcrun simctl io booted screenshot`.
- **Parallel / multi-agent:** **never share the 8081 Simulator** — every navigate/reload/screenshot from one agent disturbs the others. Give each agent its OWN autonomous pair: a **dedicated Simulator device** (`simctl create` + `boot` + **`simctl install "$APP"`** — a fresh device has no app) AND a **dedicated Metro port** (`--port 8083`, `8084`, …). Point that build at its Metro with the dev-client deep link, **URL-encoding the `url`**: `xcrun simctl openurl <udid> "<slug>://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8083"`. Address the explicit **`<udid>` in every call — never `booted`** (ambiguous once several devices are booted). Tear down with `simctl shutdown`/`delete` when done.
- **Auth-gated screens / signed-in flows:** either a TEMP no-auth preview route (`mobile-app/app/<name>-preview.tsx`, outside the `(app)` gate but inside root providers — `trash` it after), or programmatic OTP sign-in with the deployment-specific `APP_REVIEW_EMAIL` / `APP_REVIEW_OTP`. Retrieve or rotate those secrets without printing them. For another email, request the OTP through the real UI/API and inspect delivery/runtime evidence. `simctl` cannot type, so never walk the sign-in form by hand. See the skill for the programmatic-login preview snippet.
- **Never** use computer-use to drive the Simulator. `trash` every temp `*-preview.tsx` when done.

## Live Simulator preview (`/ns-preview`)

- `serve-sim` is host-independent. Always pin it to one explicit Simulator UDID, keep its terminal alive, and clean up only that UDID. Never run an unscoped `serve-sim --kill`.
- Bind the preview to `127.0.0.1`. Never expose the shell-enabled preview/control surface to a LAN or public interface.
- **One procedure, no harness routing.** Open the printed URL in whatever browser the agent can control. When the harness can drive no browser, `open` the URL for the user and label the stream `NOT VERIFIED`.
- `serve-sim` exits when its device shuts down (`FrameCapture Code=2 "Device not booted"`). Supervise the mirror and restart it rather than assuming one start survives the session.
- A reachable preview page is not runtime proof. Capture a browser screenshot with a real Simulator frame. If the host cannot inspect the browser, pair the URL with a `simctl` screenshot and report the browser stream as `NOT VERIFIED`.
- The preview is a viewing/interaction transport. Its browser controls are normal preview interaction, not `computer-use`. Simulator system alerts sit above the app and swallow mirror taps; recover with `simctl terminate` then `launch`. Never type credentials into the mirrored Simulator or complete a system sign-in sheet there.
- `ns-ios-verification` remains responsible for auth, deep links, state transitions, backend read-back, and the PASS/FAIL verdict.

## Authenticated test data

- Follow `.agents/rules/user-email.md` before any OTP. If `[user-email]` is still present, stop and ask. Never treat the placeholder as an inbox.
- For auth-gated web/admin/mobile verification, use Convex as the source of truth before settling for an empty new account. Look for an internal/demo/test account that already has relevant rows for the feature under test: `users`, `entitlements`, and any app-specific domain tables. The admin surface also exposes useful starting points through `api.admin.queries.getStats`, `listUsers`, and `getUserDetail`.
- Prefer accounts with test data owned by the project, such as the configured App Review account, seeded demo accounts, or clearly internal/admin test emails. Do not sign in as a real customer or personal account just because it has data.
- Sign in through the real OTP flow unless the mobile `/ns-ios-verification` skill explicitly uses its programmatic preview helper. For web, go to `/auth/signin?callbackUrl=<target>`, request a code for the selected test email, then inspect `npx convex logs` for the matching auth/email details before entering the OTP. Avoid session-token cookie injection or localStorage shortcuts; they miss the actual auth boundary.
- When the selected account has no usable OTP path, configure/rotate the deployment-specific App Review account or create/seed an explicit demo account with the needed test data. Report which account class you used, never the raw email/code pair.

## General

- For runtime bug reports, inspect real logs or terminal output before guessing. Do not diagnose from UI symptoms only.
- For Convex changes, run `npx convex dev --once`.
- For web changes, run `cd web-app && npm run typecheck`; run `npm run build` for route/config changes.
- For mobile changes, run `cd mobile-app && npx tsc --noEmit`; run lint when shared UI or broad files changed.
- Report skipped verification and the concrete reason in the final response.

## Checks

- Web: check HTTP status and visible page content for route moves; verify public routes `/`, `/privacy`, `/cgv`, `/support`, `/app`, `/admin` as applicable.
- For responsive web UI changes, verify at least one desktop and one mobile viewport.
- For auth-gated pages, verify both the signed-out gate and signed-in content when credentials are available (web: dev-browser; mobile: temp preview route).
