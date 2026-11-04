---
name: ns-setup-accounts
description: Log in to and link NowStack Mobile external accounts. Connects Convex, Vercel, Apple, Google Play, Expo, Stripe, R2, email, and social OAuth by handing each service to its owner skill. Use for account setup, missing logins, or check-setup account failures.
disable-model-invocation: true
---

# ns-setup-accounts

Get CLI/API access to each service, then hand configuration to the owner skill. Missing CLIs go to `$ns-doctor` first.

## 1. Inspect

```bash
node scripts/check-setup.mjs --accounts
```

Read the `service|status|hint` lines: `ready` = skip, `todo` = do now, `skip-ok` = offer to skip. Ask which surfaces ship (iOS, Android, web, payments, uploads, social sign-in) and drop whole branches. Only Convex is required; record every skip and what it blocks.

## 2. Act, one service at a time (slow approvals first)

The user does only what a provider forces: browser signup, payment, 2FA, one-time secret downloads, web-only grants. Give the exact URL, ask for one thing, wait.

1. **Apple Developer** ($99/yr, 24-48h review) - enroll at https://developer.apple.com/programs/enroll/, then `$ns-find-asc-credentials`. Write the Membership Team ID to `site-config.ts > appleTeamId`.
2. **Google Play** ($25, identity review takes days) - create the account now, then `$ns-find-gpc-credentials` (service-account JSON + Play Console invite).
3. **Convex** (required) - `npx convex dev` (browser login, creates the dev deployment, writes `CONVEX_DEPLOYMENT`). Copy the `.convex.cloud` / `.convex.site` URLs into the app env files. Set the auth baseline:
   ```bash
   BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
   printf '%s' "$BETTER_AUTH_SECRET" | npx convex env set BETTER_AUTH_SECRET
   unset BETTER_AUTH_SECRET
   printf '%s' 'http://localhost:3003' | npx convex env set SITE_URL
   ```
4. **Expo / EAS** - `$ns-setup-expo`.
5. **Vercel** - `vercel login`, then `vercel link` from the repo root. Production env and `CONVEX_DEPLOY_KEY` belong to `$ns-web-deploy`.
6. **Email** (sign-in OTP needs it) - `$ns-setup-email`.
7. **Stripe** (web/Android payments only) - `stripe login`, then `$ns-setup-stripe`.
8. **Cloudflare R2** (uploads only) - `$ns-setup-r2`.
9. **Social sign-in** (only providers whose `SiteConfig.features.enable<Provider>SignIn` is `true`) - Google: `$ns-setup-google-auth`. Apple: `$ns-setup-apple-auth`. GitHub (no owner skill): create an OAuth App with callback `https://<target-convex-site-host>/api/auth/callback/github`, then:
   ```bash
   read -rp "GitHub client ID: " GITHUB_CLIENT_ID
   printf '%s' "$GITHUB_CLIENT_ID" | npx convex env set GITHUB_CLIENT_ID
   read -rsp "GitHub client secret: " GITHUB_CLIENT_SECRET; echo
   printf '%s' "$GITHUB_CLIENT_SECRET" | npx convex env set GITHUB_CLIENT_SECRET
   unset GITHUB_CLIENT_SECRET
   ```
   Production uses a separate OAuth App and `--prod`; see `.agents/rules/auth-payments-storage.md`.

Re-run `node scripts/check-setup.mjs --accounts` after each service; it is done only at `<service>|ready`.

## Rules

- Credential homes: backend secrets in Convex env via stdin; production web env in Vercel; build/submit secrets in EAS secrets or the provider CLI store; ASC `.p8` in `asc` config; Play JSON at git-ignored `mobile-app/google-play-service-account.json`; public ids (`appleTeamId`, `easProjectId`) in `site-config.ts`.
- Never put a secret in a CLI argument, committed `.env`, `site-config.ts`, `eas.json`, or docs. Never print secret values.
- Paid signups and any account mutation need explicit user confirmation.

## 3. Return

Run `npm run check-setup`. Report per service: ready / skipped (and what it blocks) / where the credential lives. Next: `$ns-init-project`.
