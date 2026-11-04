---
name: ns-check-setup
description: Check NowStack Mobile setup readiness without changing anything. Runs the setup checker in dev, accounts, or production mode and routes each failure to its owner skill. Use for /ns check, configuration readiness, account status, or production preflight.
---

# ns-check-setup

Read-only: no installs, logins, env writes, file edits, service starts, deploys, or browser mutations. Never print secret values.

## 1. Run

```bash
node scripts/check-setup.mjs --json              # local files + dev Convex deployment
node scripts/check-setup.mjs --accounts --json   # external CLIs and logins only
node scripts/check-setup.mjs --prod --json       # production, fail-closed
```

`--skip-convex` is offline dev-only evidence and cannot combine with `--prod`; `--accounts` cannot combine with either. Exit `0` = no blocker (warnings stay visible), `1` = blocked, `2` = invalid invocation. Unknown or inaccessible production state is `NOT VERIFIABLE` and blocks production.

## 2. Route each failure to one owner

| Failure | Owner |
| --- | --- |
| CLI not installed | `$ns-doctor` |
| `convex`, `vercel`, `stripe` login; env files and Convex URLs; `BETTER_AUTH_SECRET`, dev `SITE_URL`, `GITHUB_*` | `$ns-setup-accounts` |
| `eas` login, `easProjectId` placeholder | `$ns-setup-expo` |
| `apple` / `asc` auth, `appleTeamId` | `$ns-find-asc-credentials` |
| `googleplay` service-account key | `$ns-find-gpc-credentials` |
| `LUMAIL_API_KEY`, `EMAIL_FROM` | `$ns-setup-email` |
| `STRIPE_*` | `$ns-setup-stripe` |
| `R2_*` | `$ns-setup-r2` |
| `GOOGLE_CLIENT_*` / `APPLE_CLIENT_*` | `$ns-setup-google-auth` / `$ns-setup-apple-auth` (`--prod` for production) |
| `site-config.ts`, `convex/siteConfig.ts` mirror, `App.storekit` | `$ns-init-project` |
| `mobile-app/eas.json` production values | `$ns-ios-testflight` |
| `web-app/vercel.json`, nitro plugin | `$ns-web-deploy` |
| Production `SITE_URL`, `APP_REVIEW_*`, other prod env sync | `$ns-publish-to-production` |

Anything else (for example `APPLE_SHARED_SECRET`): report it as having no owner skill.

## 3. Return

Mode, error/warning counts, each non-ready item with its evidence line, and its owner skill. Do not turn surfaces the user skipped into blockers unless the target needs them.
