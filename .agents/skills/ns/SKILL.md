---
name: ns
description: "Route NowStack Mobile lifecycle goals to the owning ns-* workflow across planning, setup, verification, web, iOS, Android, and release. Use for `/ns` subcommands, `/ns status`, or a natural-language product goal."
argument-hint: "[onboard|create-app|prd|pricing|architecture|tasks|doctor|accounts|setup|check|verify|preview|security|launch-audit|app-onboarding|analytics|email|google-auth|apple-auth|set-admin|dev|expo-go|stripe|r2|notification|screenshots|icon|images|ui|docs|optimize|production-gate|release|ios ...|android ...|web ...|status] or a goal"
disable-model-invocation: true
---

# NowStack Mobile CLI

Route and sequence only. Each workflow lives in its own skill; open the target file and follow it. Never restate a target's steps here.

Parse `$ARGUMENTS`:

1. Known subcommand: follow its file below; pass the rest of the line as context.
2. `help` or a question about `/ns`: one line on what it is, the tables, then Status.
3. Empty or `status`: Status.
4. Anything else: Goal mode.

## Subcommands

| Subcommand | Owner |
| --- | --- |
| `onboard` (first-clone wizard) | `.agents/skills/ns-onboard/SKILL.md` |
| `create-app` (PRD -> architecture -> tasks -> optional pricing -> setup) | `.agents/skills/ns-create-app/SKILL.md` |
| `prd` | `.agents/skills/ns-prd/SKILL.md` |
| `architecture` | `.agents/skills/ns-architecture/SKILL.md` |
| `tasks` | `.agents/skills/ns-tasks/SKILL.md` |
| `pricing` | `.agents/skills/ns-plan-pricing/SKILL.md` |
| `doctor` (install CLIs) | `.agents/skills/ns-doctor/SKILL.md` |
| `accounts` | `.agents/skills/ns-setup-accounts/SKILL.md` |
| `setup` (rebrand + config) | `.agents/skills/ns-init-project/SKILL.md` |
| `setup-expo` (EAS link) | `.agents/skills/ns-setup-expo/SKILL.md` |
| `check` (read-only readiness) | `.agents/skills/ns-check-setup/SKILL.md` |
| `google-auth`, `apple-auth` (`--prod` for production) | `.agents/skills/ns-setup-google-auth/SKILL.md`, `.agents/skills/ns-setup-apple-auth/SKILL.md` |
| `email`, `stripe`, `r2`, `analytics` | `.agents/skills/ns-setup-email/SKILL.md`, `.agents/skills/ns-setup-stripe/SKILL.md`, `.agents/skills/ns-setup-r2/SKILL.md`, `.agents/skills/ns-analytics/SKILL.md` |
| `notification` (alias `push`) | `.agents/skills/ns-ios-notification/SKILL.md` |
| `set-admin` | `.agents/skills/ns-set-admin/SKILL.md` |
| `app-onboarding` (end-user activation) | `.agents/skills/ns-setup-app-onboard/SKILL.md` |
| `verify` | `.agents/skills/ns-verify/SKILL.md` |
| `preview` (alias `show`, `ios preview`) | `.agents/skills/ns-preview/SKILL.md` |
| `security` | `.agents/skills/ns-security-audit/SKILL.md` |
| `launch-audit` | `.agents/skills/ns-launch-audit/SKILL.md` |
| `production-gate` | `.agents/skills/ns-publish-to-production/SKILL.md` |
| `release` | `.agents/skills/ns-release/SKILL.md` |
| `ui` | `.agents/skills/ns-ui/SKILL.md` |
| `icon`, `images`, `screenshots` | `.agents/skills/ns-icon/SKILL.md`, `.agents/skills/ns-images/SKILL.md`, `.agents/skills/ns-generate-store-screenshots/SKILL.md` |
| `docs`, `optimize` | `.agents/skills/ns-add-documentation/SKILL.md`, `.agents/skills/ns-optimizer/SKILL.md` |
| backend work | `.agents/skills/ns-convex/SKILL.md` |
| `ios local-setup` (alias `setup-ios`) | `.agents/skills/ns-ios-setup/SKILL.md` |
| `ios setup` (signing only) | `.agents/skills/ns-ios-testflight/SKILL.md` phases A-D; stop before the build |
| `ios testflight` (alias `testflight`) | `.agents/skills/ns-ios-testflight/SKILL.md` |
| `ios audit` (alias `audit`) | `.agents/skills/ns-ios-audit/SKILL.md` |
| `ios distribute` (alias `distribute`) | `.agents/skills/ns-ios-distribute/SKILL.md` |
| `ios verification` | `.agents/skills/ns-ios-verification/SKILL.md` |
| `ios deeplink` | `.agents/skills/ns-ios-deeplink/SKILL.md` |
| `android setup` (alias `setup-android`) | `.agents/skills/ns-setup-android/SKILL.md` |
| `android beta` | `.agents/skills/ns-android-beta/SKILL.md` |
| `android play-console-release` | `.agents/skills/ns-android-play-console-release/SKILL.md` |
| `android distribute` | `.agents/skills/ns-android-distribute/SKILL.md` |
| `web landing-page` | `.agents/skills/ns-web-landing-page/SKILL.md` |
| `web deploy` | `.agents/skills/ns-web-deploy/SKILL.md` |
| `dev` | `npm run start-all -- --port 3003` (Convex + web + mobile); payments and social auth need a dev build, not Expo Go |
| `expo-go` (alias `go`) | `npm run expo-go`; add `-- --tunnel` only when LAN fails |

`local-setup` = this Mac's simulator/emulator toolchain. `setup` under `ios` = EAS project, production Convex URLs, and signing. Unknown subcommand: show the table, then Status.

## Goal Mode

1. Run Status to learn what is done.
2. Build the shortest chain from these edges, skipping finished steps. Each owner already runs its own checks; do not repeat them.
   - first run: `onboard` (it chains doctor -> accounts -> create-app -> setup -> check)
   - paid product: `pricing` before `stripe`
   - new product: `create-app`, then `app-onboarding` once the core screens exist
   - anything that ships: `check` clean, then `production-gate`
   - web: `production-gate -> web deploy`; web deploy precedes store distribution (legal URLs must be live)
   - iOS: `ios setup -> ios testflight -> ios audit -> ios distribute`
   - Android: `android beta -> android distribute`
   - new version everywhere: `release` (versions source, builds matching betas, verifies, then distributes)
   - before launch: `launch-audit`
3. Show the plan once. Get fresh explicit confirmation at each external boundary: paid/cloud build, commit, push/tag, production deploy, store upload, Play promotion, App Store submission.
4. Follow each owner in order. On failure, stop and report where the chain stands.
5. Report each step as done, skipped, or failed, with URLs, build numbers, tracks, and remaining manual gates.

## Status

Run in order; the first failing signal is the stage.

```bash
node scripts/check-setup.mjs --accounts
node scripts/check-setup.mjs --skip-convex
grep -m1 'title:' site-config.ts
grep -m1 'easProjectId:' site-config.ts
```

| Stage | Signal | Next |
| --- | --- | --- |
| Fresh clone | origin is still `Melvynx/nowstack-mobile` | `/ns onboard` |
| No CLIs | `eas`, `vercel`, or `asc` missing | `/ns doctor` |
| No accounts | `--accounts` reports a required `todo` | `/ns accounts` |
| Not initialized | title still `NowStack` or placeholder URLs | `/ns setup` |
| Config errors | `check-setup` errors | `/ns check` |
| Local dev | `easProjectId` placeholder | build features, then `/ns ios setup` |
| Beta-ready | EAS project exists, no beta | `/ns ios testflight`, `/ns android beta` |
| Store submission | beta on TestFlight / Play internal | `/ns ios distribute`, `/ns android distribute` |
| Live | version released | `/ns release` |

Report the stage, two or three facts, and one next command.

## Rules

- Every question and confirmation is blocking (AGENTS.md > User Questions); never auto-resolve one or pick a default for the user.
- Read the matching `.agents/rules/*.md` before acting.
- Detect the OS before any mobile build: macOS may build locally; Windows and Linux use EAS cloud after `$ns-setup-expo`. The owning build skill enforces this.
- An upfront plan approval never replaces fresh explicit confirmation at a publication boundary.
