# NowStack Mobile

This file is the entrypoint for AI agents working in this repo. Detailed rules live in `.agents/rules/`; read the relevant rule files manually before touching matching code.

`CLAUDE.md` is a thin symlink to this file. Do not duplicate guidance there.

## Project Foundation

NowStack Mobile is an Expo + Convex mobile boilerplate with a unified TanStack Start web app. It ships an iOS/Android app, a public landing/legal site, a signed-in `/app` web surface, and an `/admin` dashboard backed by the same Convex + Better Auth identity system.

## Stack

- Mobile: Expo Router, React Native, NativeWind, Stripe React Native, Apple Sign In.
- Web: TanStack Start, TanStack Router, React 19, TailwindCSS v4, shadcn/Base UI.
- Backend: Convex only. Do not add Prisma, PostgreSQL, Supabase, Firebase, or DB-mirroring flows unless explicitly requested.
- Auth: Better Auth through `@convex-dev/better-auth`; mobile and web share the same Convex auth backend.
- Email: Lumail through `@lumail/convex` is the only mailer. OTP, reset, and verification go through `LUMAIL_API_KEY` + `EMAIL_FROM` in Convex. Do not add Resend, SMTP, or a second provider.
- Payments: Apple IAP on iOS, Stripe for Android/web, server-side payment logic in Convex.
- Storage: Cloudflare R2 through S3-compatible Convex helpers.

## Non-Negotiable Workflow

1. Before editing, read at least 3 relevant files: similar implementation, caller, and imported helper/API.
2. Before editing anything under `convex/`, read `convex/_generated/ai/guidelines.md`.
3. Before touching a domain covered by `.agents/rules/`, read the matching rule file from the index below.
4. Prefer `trash` for deletions. **NEVER use `rm -rf`**.
5. Keep Convex env/secrets in Convex. Do not merge deployment secrets into app `.env` files.
6. Do not revert unrelated worktree changes. This repo often has user work in progress.

## Rule Index

Use this index before planning edits. If a rule path matches the files or behavior you will touch, read it first.

- `.agents/rules/convex.md` - Convex functions, schema, auth builders, indexes, env, and generated API usage.
- `.agents/rules/web-app.md` - `web-app/` TanStack Start routes, auth gates, landing/legal pages, admin UI, and styling.
- `.agents/rules/mobile-app.md` - `mobile-app/` Expo Router, NativeWind, auth, payments, analytics, and native store constraints.
- `.agents/rules/auth-payments-storage.md` - Better Auth, Apple IAP, Stripe, Cloudflare R2, and cross-surface account behavior.
- `.agents/rules/launch-app.md` - Local app launch commands, required web port `3003`, and port-reuse behavior.
- `.agents/rules/development-commands.md` - Install, dev, build, typecheck, Convex, and mobile command choices.
- `.agents/rules/verification.md` - Browser/runtime verification, logs, screenshots, and route checks.
- `.agents/rules/store-release.md` - iOS/Android production deployment and store screenshot workflows.
- `.agents/rules/typescript-and-code-style.md` - TypeScript (including the hard `any` ban), imports, file naming, comments, and UI style constraints.
- `.agents/rules/user-email.md` - `[user-email]` placeholder: stop, ask the user, replace everywhere, delete the STOP comments.

## User Questions

Every question an agent or `ns-*` skill asks the user is required and blocking.

- Codex: call `request_user_input` with `isBlocking: true` and never set `autoResolutionMs`. Claude Code: `AskUserQuestion`. Elsewhere: ask in chat and end the turn.
- Never answer for the user: no timeout, no auto-selected default or recommended option, no assumption from silence. Wait for the reply before the step that depends on it.
- Ask one question, or one small related batch, at a time.

## Commands

- `/ns <subcommand>` - product lifecycle CLI (skill router): `onboard` (first-run wizard), `create-app` (idea→plan), `prd`, `pricing`, `architecture`, `tasks`, `doctor`, `accounts`, `setup`, `setup-ios` (legacy alias for `ios local-setup`), `setup-expo`, `setup-android`, `check`, `verify`, `preview`, `security`, `launch-audit`, `production-gate`, `app-onboarding`, `analytics`, `email`, `set-admin`, `google-auth`, `apple-auth`, `dev`, `expo-go`, `stripe`, `r2`, `notification`, `screenshots`, `icon`, `images`, `ui`, `docs`, `optimize`, `release`, `ios local-setup|setup|testflight|audit|distribute|verification|preview|deeplink|notification`, `android setup|beta|play-console-release|distribute`, `web landing-page|deploy`, `status` — also accepts natural-language goals ("set up my project", "show the iOS app", "deploy the web app and the iOS app", "release the latest TestFlight version") and chains the right skills. See `.agents/skills/ns/SKILL.md`.
- `npm run start-all -- --port 3003` - launch Convex + web + mobile Metro with the web app on `http://localhost:3003`; inspect/reuse port `3003` first per `.agents/rules/launch-app.md`.
- `npm run expo-go` - launch an Expo Go-compatible preview with an intact QR code, automatic Metro port selection, and safe fallbacks for unsupported native modules; add `-- --tunnel` when LAN discovery fails.
- `npm run start-all -- --port 3003 --ios` - launch full stack and open the iOS simulator.
- `npm run start-all -- --port 3003 --android` - launch full stack and open the Android emulator.
- `npm run check-setup` - validate config, env vars, and Convex secrets.
- `npm run dev:convex` - root Convex dev/codegen.
- `npm run deploy:convex` - deploy current Convex deployment.
- `cd web-app && npx vite dev --port 3003` - TanStack Start web app on port `3003`.
- `cd web-app && npm run build` - production web build.
- `cd web-app && npm run typecheck` - web TypeScript check.
- `cd mobile-app && npm run start` - Expo dev server.
- `cd mobile-app && npm run ios` - Expo iOS native run.
- `cd mobile-app && npm run android` - Expo Android native run.
- `cd mobile-app && npx tsc --noEmit` - mobile TypeScript check.
- `cd mobile-app && npm run lint` - mobile lint + Prettier check.
- `cd mobile-app && npm run screenshots:store` - dry-run store screenshot manifest.

## Important Files

- `site-config.ts` - cross-surface product, brand, URLs, payment, and auth configuration. If you see `[user-email]` or `STOP Agents work`, read `.agents/rules/user-email.md`. Never treat the placeholder as an inbox.
- `convex/functions.ts` - `authQuery`, `authMutation`, `adminQuery`, `adminMutation`, and auth helpers.
- `convex/auth.ts`, `convex/auth.config.ts`, `convex/http.ts` - Better Auth and Convex HTTP wiring. Auth mail is Lumail (`convex/email.ts`).
- `convex/schema.ts` - Convex schema and indexes.
- `convex/users/`, `convex/admin/`, `convex/payments/`, `convex/storage/` - backend domains.
- `web-app/app/routes/` - public, `/app`, and `/admin` TanStack routes.
- `web-app/app/components/` - web/admin components and shadcn/Base UI primitives.
- `mobile-app/app/` - Expo Router screens and route groups.
- `mobile-app/components/ui/` - NativeWind component primitives.
- `mobile-app/lib/auth-client.ts`, `mobile-app/lib/auth-store.tsx` - mobile auth client/state.
- `mobile-app/lib/posthog.ts` - analytics helper.
- `mobile-app/scripts/store-screenshots.mjs` - store screenshot workflow.

## Verification Surfaces

- **Web** → drive with the `dev-browser` CLI (navigate, screenshot, fill, click). Fall back to Playwright only if unavailable, and say so.
- **Mobile** → verify journeys with `xcrun simctl` through `ns-ios-verification`; use `ns-preview` for a live `serve-sim` mirror opened in whatever browser the agent can drive.
- **Never** use computer-use / control-the-computer tools to drive a browser or the Simulator for UI verification. See `.agents/rules/verification.md`.

## Convex AI

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
