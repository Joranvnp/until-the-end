---
name: ns-publish-to-production
description: Enforces the NowStack Mobile production credential gate. Proves every enabled OAuth, Apple, Stripe, email, and storage integration uses production-specific secrets in Convex prod. Use before a production web deploy, native production build, or store promotion.
disable-model-invocation: true
---

# Production Credential Gate - NowStack Mobile

Hard gate before deploying production Convex/web or building/promoting a native production binary. Called by `$ns-web-deploy`, `$ns-ios-testflight`, `$ns-android-beta`, `$ns-ios-distribute`, `$ns-android-distribute`, and `$ns-release`. If it already passed in this session for the same prod deployment and no prod env changed since, reuse that result instead of re-running.

## Production credential boundary

0. Backend deployed: prod functions must exist. Web releases ship them through `$ns-web-deploy`; for a native-only release, show the target deployment and run `npm run deploy:convex` only after explicit confirmation.
1. Enumerate enabled integrations from `site-config.ts`, `convex/siteConfig.ts`, `convex/auth.ts`, and `convex/payments/`: Google, Apple, GitHub, Stripe, Lumail, R2, plus any other provider the code reads.
2. Resolve the production `.convex.site` host and final web origin. Social callbacks are `https://<prod-convex-site-host>/api/auth/callback/<provider>`; `SITE_URL` is the final browser origin.
3. Each enabled social provider needs a production-specific client and fresh secret; never reuse the development client:
   - Google: `$ns-setup-google-auth --prod`.
   - Apple: `$ns-setup-apple-auth --prod` (`APPLE_CLIENT_ID` is the Services ID; the JWT is freshly signed and unexpired).
   - GitHub: a dedicated production OAuth App with the production callback; set `GITHUB_CLIENT_ID` and the secret through stdin: `printf '%s' "$GITHUB_CLIENT_SECRET" | npx convex env set --prod GITHUB_CLIENT_SECRET`.
   - Any other provider: same rule, exact env names and callback from the implementation.
4. Stripe enabled for web (and Android only when `site-config.ts` `providers.android` is `stripe`; default is `google_play`): `$ns-setup-stripe --prod` (live keys, live Product/Price, production webhook secret when required). Never `sk_test_*`, a test price, or a development webhook.
5. Email: production `LUMAIL_API_KEY` / `EMAIL_FROM` via `$ns-setup-email` (prod). R2: the five prod vars via `$ns-setup-r2`.
6. Core prod env: a new `BETTER_AUTH_SECRET` (never the dev value), `SITE_URL` = final web origin, `APPLE_SHARED_SECRET` when IAP is enabled. `ALLOW_DEV_PAYMENT_BYPASS` must be absent on prod.
7. Server secrets go only into Convex prod via stdin. Never into tracked env files, Vercel plaintext, docs, or chat. iOS production payments stay Apple IAP, never Stripe.
8. Verify without printing values:

```bash
npx convex env list --prod | sed 's/=.*$/=<set>/'
npx convex run --prod auth:getEnabledAuthProviders '{}'
npm run check-setup -- --prod
```

## Verdict

`PASS` only when the provider query matches the enabled feature flags and `check-setup --prod` has no error. `FAIL` (blocks the caller) on any missing provider, development callback or client, reused dev `BETTER_AUTH_SECRET`, `ALLOW_DEV_PAYMENT_BYPASS` set, expired Apple JWT, Stripe test key, missing live price, missing required webhook secret, or secret found in a tracked file. Return the per-integration table and the owner skill for each failure.

Called directly for a full production push: after `PASS`, hand off web to `$ns-web-deploy` and native to `$ns-release`. Beyond step 0, this skill never deploys, builds, or submits.
