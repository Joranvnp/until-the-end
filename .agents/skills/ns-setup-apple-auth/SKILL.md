---
name: ns-setup-apple-auth
description: Configures Sign in with Apple for web and iOS. Creates the Services ID and key, installs a signed client-secret JWT in Convex, and rotates it before expiry. Use when setting up Apple sign-in, APPLE_CLIENT_ID or APPLE_CLIENT_SECRET, return URLs, or expiring Apple JWTs.
argument-hint: "[--prod]"
disable-model-invocation: true
---

# Setup Apple Auth

Default: current dev Convex deployment. `--prod`: production, with a production-only Services ID and a freshly signed JWT; add `--prod` to every `npx convex` command and never copy a development Services ID or JWT. Wiring rules: `.agents/rules/auth-payments-storage.md`.

`APPLE_CLIENT_ID` is the **Services ID** (web OAuth), never the native bundle ID.

## 1. Inspect

```bash
rg -n "enableAppleSignIn|APPLE_CLIENT|getEnabledAuthProviders|bundleId|appleTeamId" site-config.ts convex/auth.ts
npx convex env list | sed 's/=.*$/=<set>/'
npx convex run auth:getEnabledAuthProviders '{}'
```

Derive `{bundle_id}` and `{team_id}` from `site-config.ts`; `{services_id}` = `{bundle_id}.web` (dev) or an existing production-only ID / `{bundle_id}.web.prod` (`--prod`); `{convex_site_host}` from the target's `.convex.site` URL. Return URL: `https://{convex_site_host}/api/auth/callback/apple`; domain: `{convex_site_host}` without scheme or path. If the target returns `apple: true` with an unexpired JWT and no rotation was asked, report and stop.

## 2. Configure Apple Developer

Use the user's session; stop only for login, 2FA, or agreements.

1. Create or open Services ID `{services_id}`, enable **Sign in with Apple**, set the primary App ID to the native `{bundle_id}` App ID, register the domain and exact return URL, save.
2. Create a dedicated **Sign in with Apple** key associated with the same primary App ID. This mutates the account: confirm with the user first.
3. Download `AuthKey_{key_id}.p8` once to a secure directory outside the repo. Never copy it into the repo, print it, or print its path publicly.

## 3. Set Convex env

```bash
# development (add --prod before --team-id for production)
node scripts/generate-apple-client-secret.mjs --dry-run \
  --team-id "<team-id>" --client-id "<services-id>" \
  --key-id "<key-id>" --private-key "/secure/path/AuthKey_<key-id>.p8"
```

Rerun without `--dry-run` to install. The script never prints the JWT, rejects lifetimes over 180 days, and writes `APPLE_CLIENT_ID` + `APPLE_CLIENT_SECRET` to the selected deployment. Record the reported expiry. Then set the web origin:

```bash
npx convex env set SITE_URL "http://localhost:3003"                    # development
npx convex env set --prod SITE_URL "https://<production-app-domain>"  # production
```

Rotate the JWT when missing, expired, close to expiry, or on first production setup; `npm run check-setup -- --prod` fails within seven days of expiry.

## 4. Prove

1. The provider query on the target returns `apple: true`.
2. Web (`dev-browser`): signed-out sign-in shows Apple and redirects to `appleid.apple.com` with `{services_id}` and the exact return URL.
3. iOS: reload the dev build against the same deployment; the native Apple button appears. Complete a sign-in when possible.
4. `invalid_client`: check Services ID vs bundle ID, key association, Team ID, clock skew, and expiry before changing code.

Return target, Services ID, key ID, JWT expiry, query result, web/iOS proof, and anything NOT VERIFIED. Production stays blocked until its domain/return URL, Services ID, fresh `--prod` JWT, and `apple: true` exist.
