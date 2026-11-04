---
name: ns-setup-google-auth
description: Configures Google OAuth for web and Expo sign-in. Creates a deployment-specific Google OAuth client, stores its credentials only in Convex, and proves the button works. Use when setting up Google sign-in, GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET, callback URLs, or production Google auth.
argument-hint: "[--prod]"
disable-model-invocation: true
---

# Setup Google Auth

Default: current dev Convex deployment. `--prod`: production, with a dedicated production OAuth client; add `--prod` to every `npx convex` command and never copy development credentials. Wiring rules: `.agents/rules/auth-payments-storage.md`.

## 1. Inspect

```bash
rg -n "enableGoogleSignIn|GOOGLE_CLIENT|getEnabledAuthProviders" site-config.ts convex/auth.ts
npx convex env list | sed 's/=.*$/=<set>/'
npx convex run auth:getEnabledAuthProviders '{}'
```

`SiteConfig.features.enableGoogleSignIn` must be `true` (ships `false`). If the target already returns `google: true` and no rotation was asked, report and stop. Callback: `https://{convex_site_host}/api/auth/callback/google` from the target's `.convex.site` URL.

## 2. Configure Google Cloud

Use the user's session (`gcloud` to inspect, browser for Google Auth Platform); stop only for login, 2FA, or policy gates.

1. Select or create a project named for the product, never an unrelated one.
2. Branding: product name, support/contact email, external audience, real privacy/terms URLs for production.
3. Create a **Web application** OAuth client named `{app} development` or `{app} production` with the exact callback.
4. If the secret is hidden, use **Add secret**. Never put it in chat, logs, screenshots, or tracked files.

## 3. Set Convex env

`SITE_URL` is the browser origin, not the Convex site URL.

```bash
# development
npx convex env set SITE_URL "http://localhost:3003"
npx convex env set GOOGLE_CLIENT_ID "<client>.apps.googleusercontent.com"
pbpaste | npx convex env set GOOGLE_CLIENT_SECRET

# production (--prod)
npx convex env set --prod SITE_URL "https://<production-app-domain>"
npx convex env set --prod GOOGLE_CLIENT_ID "<production-client>.apps.googleusercontent.com"
pbpaste | npx convex env set --prod GOOGLE_CLIENT_SECRET
```

Off macOS, pipe a protected runtime variable into the same value-less command. Never write these values to `.env*`, `site-config.ts`, docs, or build config.

## 4. Prove

1. The provider query on the target returns `google: true`.
2. Web (`dev-browser`): signed-out sign-in shows Google; clicking reaches `accounts.google.com` with the expected client ID and exact callback.
3. Mobile: reload Expo against the same deployment; the button appears.
4. Button missing: check flag, target deployment, both env names, and the query before touching UI.

Return target, project, client name, callback, query result, web/mobile proof, and anything NOT VERIFIED. Production stays blocked until its own client, callback, `--prod` secret, and `google: true` exist.
